const fs = require('fs');
const path = require('path');
const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class SeedService {
  isDatabaseEmpty() {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    return count === 0;
  }

  purgeAllData() {
    const db = getDb();
    const runPurge = db.transaction(() => {
      db.prepare('DELETE FROM platform_activity_events').run();
      db.prepare('DELETE FROM metric_snapshots').run();
      db.prepare('DELETE FROM platform_metrics').run();
      db.prepare('DELETE FROM platform_accounts').run();
      db.prepare('DELETE FROM students').run();
      db.prepare('DELETE FROM import_jobs').run();
      db.prepare('DELETE FROM sync_jobs').run();
      db.prepare('UPDATE settings SET value = ? WHERE key = ?')
        .run(JSON.stringify({ active: false, notice: 'Live institutional mode active' }), 'demo_mode');
    });
    runPurge();
    return { success: true, message: 'All student records, accounts, and snapshots purged cleanly' };
  }

  seedDemoDataset() {
    const samplePath = path.join(__dirname, '../../../data/sample_college_students.json');
    if (!fs.existsSync(samplePath)) {
      throw new Error('Sample students JSON file not found at ' + samplePath);
    }

    const studentsData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    const db = getDb();
    const now = new Date();

    const insertStudent = db.prepare(`
      INSERT INTO students (id, name, branch, batch, semester, student_id, email, data_completeness, is_demo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const insertAccount = db.prepare(`
      INSERT INTO platform_accounts (id, student_id, platform, username, profile_url, is_linked, is_verified, status, last_sync_at, created_at)
      VALUES (?, ?, ?, ?, ?, 1, 0, 'pending', NULL, ?)
    `);

    const runSeed = db.transaction(() => {
      this.purgeAllData();

      studentsData.forEach((st) => {
        const studentId = uuidv4();
        const createdDate = now.toISOString();
        const studentEmail = st.name ? `${st.name.toLowerCase().replace(/\s+/g, '.')}` + (st.student_id ? `@iet.edu.in` : `@college.edu`) : null;

        // Insert student master record without fabricated metrics
        insertStudent.run(
          studentId,
          st.name,
          st.branch || 'Computer Science & Engineering',
          st.batch || '2023-2027',
          st.semester || '5th Sem',
          st.student_id || null,
          studentEmail,
          20, // baseline completeness for unverified linked profile
          createdDate,
          createdDate
        );

        // Link student accounts using clean handles and canonical URLs
        const platforms = [
          { key: 'leetcode_id', platform: 'leetcode' },
          { key: 'gfg_id', platform: 'gfg' },
          { key: 'codechef_id', platform: 'codechef' },
          { key: 'github_id', platform: 'github' },
          { key: 'hackerrank_id', platform: 'hackerrank' }
        ];

        platforms.forEach(p => {
          const rawVal = st[p.key];
          if (rawVal && String(rawVal).trim() !== '') {
            const clean = extractUsername(p.platform, String(rawVal));
            const canonicalUrl = getCanonicalProfileUrl(p.platform, clean);
            if (clean) {
              insertAccount.run(
                uuidv4(),
                studentId,
                p.platform,
                clean,
                canonicalUrl,
                createdDate
              );
            }
          }
        });
      });
    });

    runSeed();

    return {
      success: true,
      studentsCount: studentsData.length,
      message: `Loaded ${studentsData.length} students roster. Live platform metrics will synchronize on demand.`
    };
  }
}

module.exports = new SeedService();
