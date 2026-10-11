const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class ImportService {
  validateRow(row, index = 0) {
    const errors = [];
    if (!row || typeof row !== 'object') {
      return { valid: false, errors: ['Item is not a valid JSON object'], row };
    }

    const name = row.name ? String(row.name).trim() : '';
    if (!name) {
      errors.push('Missing or empty "name" field');
    }

    // Support both key conventions: platform_id and platform
    const leetcodeInput = row.leetcode_id !== undefined ? row.leetcode_id : (row.leetcode !== undefined ? row.leetcode : '');
    const gfgInput = row.gfg_id !== undefined ? row.gfg_id : (row.gfg !== undefined ? row.gfg : '');
    const codechefInput = row.codechef_id !== undefined ? row.codechef_id : (row.codechef !== undefined ? row.codechef : '');
    const githubInput = row.github_id !== undefined ? row.github_id : (row.github !== undefined ? row.github : '');
    const hackerrankInput = row.hackerrank_id !== undefined ? row.hackerrank_id : (row.hackerrank !== undefined ? row.hackerrank : '');

    const leetcode_id = extractUsername('leetcode', leetcodeInput);
    const gfg_id = extractUsername('gfg', gfgInput);
    const codechef_id = extractUsername('codechef', codechefInput);
    const github_id = extractUsername('github', githubInput);
    const hackerrank_id = extractUsername('hackerrank', hackerrankInput);

    const rawStudentId = row.student_id !== undefined ? row.student_id : (row.roll_no !== undefined ? row.roll_no : (row.roll_number !== undefined ? row.roll_number : (row.registration_no !== undefined ? row.registration_no : null)));

    return {
      valid: errors.length === 0,
      errors,
      index,
      data: {
        name,
        leetcode_id,
        gfg_id,
        codechef_id,
        github_id,
        hackerrank_id,
        branch: row.branch ? String(row.branch).trim() : null,
        batch: row.batch ? String(row.batch).trim() : null,
        semester: row.semester ? String(row.semester).trim() : null,
        student_id: rawStudentId ? String(rawStudentId).trim() : null,
        email: row.email ? String(row.email).trim() : null
      }
    };
  }

  previewImport(input) {
    let jsonArray = input;
    if (!Array.isArray(jsonArray)) {
      if (jsonArray && typeof jsonArray === 'object' && typeof jsonArray.name === 'string' && jsonArray.name.trim()) {
        jsonArray = [jsonArray];
      } else {
        return {
          success: false,
          error: 'Uploaded content must be a student object (with "name") or a JSON array of student objects [ { name, leetcode_id, ... } ]'
        };
      }
    }

    const db = getDb();
    const existingStudents = db.prepare('SELECT id, name, student_id FROM students').all();
    const existingAccounts = db.prepare('SELECT student_id, platform, username FROM platform_accounts').all();

    const handleMap = new Map();
    existingAccounts.forEach(acc => {
      if (acc.username) {
        handleMap.set(`${acc.platform}:${acc.username.toLowerCase()}`, acc.student_id);
      }
    });

    const studentIdMap = new Map();
    existingStudents.forEach(s => {
      if (s.student_id) {
        studentIdMap.set(s.student_id.toLowerCase(), s.id);
      }
    });

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    let newCount = 0;
    let updateCount = 0;

    const seenInFile = new Set();
    const previewList = [];

    jsonArray.forEach((item, idx) => {
      const validated = this.validateRow(item, idx);
      if (!validated.valid) {
        invalidCount++;
        previewList.push({
          status: 'invalid',
          errors: validated.errors,
          record: item
        });
        return;
      }

      validCount++;
      const data = validated.data;
      const fileKey = data.student_id 
        ? `sid:${data.student_id.toLowerCase()}` 
        : `name:${data.name.toLowerCase()}|lc:${data.leetcode_id.toLowerCase()}`;

      if (seenInFile.has(fileKey)) {
        duplicateCount++;
        previewList.push({
          status: 'duplicate_in_file',
          errors: ['Duplicate student entry detected within this import file'],
          record: data
        });
        return;
      }
      seenInFile.add(fileKey);

      // Check if already in DB
      let matchedExistingId = null;
      if (data.student_id && studentIdMap.has(data.student_id.toLowerCase())) {
        matchedExistingId = studentIdMap.get(data.student_id.toLowerCase());
      } else if (data.leetcode_id && handleMap.has(`leetcode:${data.leetcode_id.toLowerCase()}`)) {
        matchedExistingId = handleMap.get(`leetcode:${data.leetcode_id.toLowerCase()}`);
      } else if (data.codechef_id && handleMap.has(`codechef:${data.codechef_id.toLowerCase()}`)) {
        matchedExistingId = handleMap.get(`codechef:${data.codechef_id.toLowerCase()}`);
      }

      if (matchedExistingId) {
        updateCount++;
        previewList.push({
          status: 'existing_match',
          existingId: matchedExistingId,
          action: 'Will update handles and academic info without wiping history',
          record: data
        });
      } else {
        newCount++;
        previewList.push({
          status: 'new',
          action: 'Will create new student profile',
          record: data
        });
      }
    });

    return {
      success: true,
      total_records: jsonArray.length,
      valid_records: validCount,
      invalid_records: invalidCount,
      duplicates_in_file: duplicateCount,
      new_students: newCount,
      existing_students_to_update: updateCount,
      preview: previewList.slice(0, 100)
    };
  }

  commitImport(input, filename = 'imported_roster.json', isDemo = 0, duplicatePolicy = 'update') {
    let jsonArray = input;
    if (!Array.isArray(jsonArray)) {
      if (jsonArray && typeof jsonArray === 'object' && typeof jsonArray.name === 'string' && jsonArray.name.trim()) {
        jsonArray = [jsonArray];
      } else {
        return {
          success: false,
          error: 'Expected a student object (with "name") or an array of student objects to commit'
        };
      }
    }

    const preview = this.previewImport(jsonArray);
    if (!preview.success) return preview;

    const db = getDb();
    const now = new Date().toISOString();
    const jobId = uuidv4();

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const targetStudentIds = [];

    const existingStudents = db.prepare('SELECT id, name, student_id FROM students').all();
    const existingAccounts = db.prepare('SELECT student_id, platform, username FROM platform_accounts').all();

    const handleMap = new Map();
    existingAccounts.forEach(acc => {
      if (acc.username) {
        handleMap.set(`${acc.platform}:${acc.username.toLowerCase()}`, acc.student_id);
      }
    });

    const studentIdMap = new Map();
    existingStudents.forEach(s => {
      if (s.student_id) {
        studentIdMap.set(s.student_id.toLowerCase(), s.id);
      }
    });

    const insertStudent = db.prepare(`
      INSERT INTO students (id, name, branch, batch, semester, student_id, email, data_completeness, is_demo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStudent = db.prepare(`
      UPDATE students 
      SET name = ?, branch = COALESCE(?, branch), batch = COALESCE(?, batch), semester = COALESCE(?, semester), 
          student_id = COALESCE(?, student_id), email = COALESCE(?, email), updated_at = ?
      WHERE id = ?
    `);

    const upsertAccount = db.prepare(`
      INSERT INTO platform_accounts (id, student_id, platform, username, profile_url, is_linked, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
      ON CONFLICT(student_id, platform) DO UPDATE SET
        username = excluded.username,
        profile_url = excluded.profile_url,
        is_linked = excluded.is_linked
    `);

    const runTransaction = db.transaction(() => {
      const seenInFile = new Set();

      for (const item of jsonArray) {
        const validated = this.validateRow(item);
        if (!validated.valid) {
          skipped++;
          continue;
        }

        const data = validated.data;
        const fileKey = data.student_id 
          ? `sid:${data.student_id.toLowerCase()}` 
          : `name:${data.name.toLowerCase()}|lc:${data.leetcode_id.toLowerCase()}`;

        if (seenInFile.has(fileKey)) {
          skipped++;
          continue;
        }
        seenInFile.add(fileKey);

        let targetStudentId = null;
        if (data.student_id && studentIdMap.has(data.student_id.toLowerCase())) {
          targetStudentId = studentIdMap.get(data.student_id.toLowerCase());
        } else if (data.leetcode_id && handleMap.has(`leetcode:${data.leetcode_id.toLowerCase()}`)) {
          targetStudentId = handleMap.get(`leetcode:${data.leetcode_id.toLowerCase()}`);
        } else if (data.codechef_id && handleMap.has(`codechef:${data.codechef_id.toLowerCase()}`)) {
          targetStudentId = handleMap.get(`codechef:${data.codechef_id.toLowerCase()}`);
        }

        if (targetStudentId) {
          if (duplicatePolicy === 'skip') {
            skipped++;
            continue;
          }
          updateStudent.run(data.name, data.branch, data.batch, data.semester, data.student_id, data.email, now, targetStudentId);
          updated++;
          targetStudentIds.push(targetStudentId);
        } else {
          targetStudentId = uuidv4();
          insertStudent.run(
            targetStudentId,
            data.name,
            data.branch || 'Computer Science & Engineering',
            data.batch || '2023-2027',
            data.semester || '5th Sem',
            data.student_id || null,
            data.email || null,
            20,
            isDemo ? 1 : 0,
            now,
            now
          );
          created++;
          targetStudentIds.push(targetStudentId);
        }

        const platformsToLink = [
          { platform: 'leetcode', id: data.leetcode_id, url: getCanonicalProfileUrl('leetcode', data.leetcode_id) },
          { platform: 'gfg', id: data.gfg_id, url: getCanonicalProfileUrl('gfg', data.gfg_id) },
          { platform: 'codechef', id: data.codechef_id, url: getCanonicalProfileUrl('codechef', data.codechef_id) },
          { platform: 'github', id: data.github_id, url: getCanonicalProfileUrl('github', data.github_id) },
          { platform: 'hackerrank', id: data.hackerrank_id, url: getCanonicalProfileUrl('hackerrank', data.hackerrank_id) }
        ];

        for (const p of platformsToLink) {
          if (p.id) {
            upsertAccount.run(uuidv4(), targetStudentId, p.platform, p.id, p.url, 1, now);
            handleMap.set(`${p.platform}:${p.id.toLowerCase()}`, targetStudentId);
          }
        }
      }

      db.prepare(`
        INSERT INTO import_jobs (id, filename, total_records, valid_records, invalid_records, duplicate_records, status, errors, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)
      `).run(
        jobId, filename, jsonArray.length, preview.valid_records, preview.invalid_records, preview.duplicates_in_file,
        JSON.stringify([]), now
      );

      db.prepare(`
        INSERT INTO audit_logs (id, action, user_role, details, timestamp)
        VALUES (?, 'import_roster', 'College Administrator', ?, ?)
      `).run(
        uuidv4(),
        JSON.stringify({ filename, created, updated, skipped, isDemo }),
        now
      );
    });

    runTransaction();

    return {
      success: true,
      jobId,
      created,
      updated,
      skipped,
      totalProcessed: jsonArray.length,
      targetStudentIds
    };
  }
}

module.exports = new ImportService();
