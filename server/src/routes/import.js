const express = require('express');
const router = express.Router();
const importService = require('../services/importService');
const platformManager = require('../integrations/platformManager');
const { getDb } = require('../database/db');
const fs = require('fs');
const path = require('path');

// POST Preview JSON student import
router.post('/preview', (req, res) => {
  try {
    const rawData = req.body;
    let jsonArray = rawData;

    if (typeof rawData === 'string') {
      try {
        jsonArray = JSON.parse(rawData);
      } catch (parseErr) {
        return res.status(400).json({ success: false, error: 'Malformed JSON payload: ' + parseErr.message });
      }
    }

    if (!Array.isArray(jsonArray)) {
      if (jsonArray && typeof jsonArray === 'object') {
        jsonArray = [jsonArray];
      } else {
        return res.status(400).json({ success: false, error: 'Expected student object or array of student objects' });
      }
    }

    const preview = importService.previewImport(jsonArray);
    res.json(preview);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Commit JSON student import
router.post('/commit', (req, res) => {
  try {
    let { students, filename = 'roster.json', duplicatePolicy = 'update', autoSync = true } = req.body;
    if (!Array.isArray(students)) {
      if (students && typeof students === 'object') {
        students = [students];
      } else {
        return res.status(400).json({ success: false, error: 'Expected student object or array of student objects' });
      }
    }

    const result = importService.commitImport(students, filename, 0, duplicatePolicy);

    let syncJobId = null;
    if (autoSync && result.targetStudentIds && result.targetStudentIds.length > 0) {
      syncJobId = platformManager.queueSyncStudents(result.targetStudentIds);
    }

    res.json({
      ...result,
      syncJobId,
      autoSyncStarted: Boolean(syncJobId)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Template JSON
router.get('/template', (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../../../data/students_template.json');
    if (fs.existsSync(templatePath)) {
      const data = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      res.json({ success: true, template: data });
    } else {
      res.json({
        success: true,
        template: [
          {
            name: "Student Name",
            leetcode_id: "leetcode_username",
            gfg_id: "gfg_username",
            codechef_id: "codechef_username"
          }
        ]
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Current active roster as JSON
router.get('/current-roster', (req, res) => {
  try {
    const db = getDb();
    const students = db.prepare(`
      SELECT 
        s.name, s.student_id, s.branch, s.batch, s.semester, s.email,
        lc.username as leetcode_id,
        gfg.username as gfg_id,
        cc.username as codechef_id,
        gh.username as github_id,
        hr.username as hackerrank_id
      FROM students s
      LEFT JOIN platform_accounts lc ON s.id = lc.student_id AND lc.platform = 'leetcode'
      LEFT JOIN platform_accounts gfg ON s.id = gfg.student_id AND gfg.platform = 'gfg'
      LEFT JOIN platform_accounts cc ON s.id = cc.student_id AND cc.platform = 'codechef'
      LEFT JOIN platform_accounts gh ON s.id = gh.student_id AND gh.platform = 'github'
      LEFT JOIN platform_accounts hr ON s.id = hr.student_id AND hr.platform = 'hackerrank'
      ORDER BY s.name ASC
    `).all();

    const cleanList = students.map(s => {
      const obj = { name: s.name };
      if (s.student_id) obj.student_id = s.student_id;
      if (s.branch) obj.branch = s.branch;
      if (s.batch) obj.batch = s.batch;
      if (s.semester) obj.semester = s.semester;
      if (s.email) obj.email = s.email;
      if (s.leetcode_id) obj.leetcode_id = s.leetcode_id;
      if (s.gfg_id) obj.gfg_id = s.gfg_id;
      if (s.codechef_id) obj.codechef_id = s.codechef_id;
      if (s.github_id) obj.github_id = s.github_id;
      if (s.hackerrank_id) obj.hackerrank_id = s.hackerrank_id;
      return obj;
    });

    res.json({ success: true, students: cleanList, count: cleanList.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET List all existing JSON files in data directory
router.get('/files', (req, res) => {
  try {
    const dataDir = path.join(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      return res.json({ success: true, files: [] });
    }
    const entries = fs.readdirSync(dataDir);
    const jsonFiles = entries
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const fullPath = path.join(dataDir, filename);
        const stats = fs.statSync(fullPath);
        let count = 0;
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (Array.isArray(content)) count = content.length;
        } catch (_) {}
        return {
          filename,
          sizeBytes: stats.size,
          recordsCount: count,
          updatedAt: stats.mtime
        };
      });
    res.json({ success: true, files: jsonFiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Read a specific JSON file from data directory
router.get('/file-content', (req, res) => {
  try {
    const rawFilename = req.query.filename || 'sample_college_students.json';
    const safeFilename = path.basename(rawFilename);
    const filePath = path.join(__dirname, '../../../data', safeFilename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      res.json({
        success: true,
        filename: safeFilename,
        data: parsed,
        raw: content,
        count: Array.isArray(parsed) ? parsed.length : 1
      });
    } else {
      res.status(404).json({ success: false, error: `File "${safeFilename}" not found` });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Read sample_college_students.json file
router.get('/sample-file', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../../data/sample_college_students.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      res.json({ success: true, filename: 'sample_college_students.json', data: parsed, raw: content, count: parsed.length });
    } else {
      res.status(404).json({ success: false, error: 'sample_college_students.json not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save edits back to a JSON file in data directory
router.post('/save-file', (req, res) => {
  try {
    const { content, filename = 'sample_college_students.json' } = req.body;
    let validatedData;
    if (typeof content === 'string') {
      validatedData = JSON.parse(content);
    } else if (Array.isArray(content)) {
      validatedData = content;
    } else {
      return res.status(400).json({ success: false, error: 'Content must be a JSON array' });
    }
    const safeFilename = path.basename(filename || 'sample_college_students.json');
    if (!safeFilename.endsWith('.json')) {
      return res.status(400).json({ success: false, error: 'Filename must have .json extension' });
    }
    const dataDir = path.join(__dirname, '../../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, safeFilename);
    fs.writeFileSync(filePath, JSON.stringify(validatedData, null, 2), 'utf8');
    res.json({
      success: true,
      filename: safeFilename,
      count: validatedData.length,
      message: `Successfully saved ${validatedData.length} students to ${safeFilename}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save edits back to sample_college_students.json file (backward compatibility)
router.post('/save-sample-file', (req, res) => {
  try {
    const { content } = req.body;
    let validatedData;
    if (typeof content === 'string') {
      validatedData = JSON.parse(content);
    } else if (Array.isArray(content)) {
      validatedData = content;
    } else {
      return res.status(400).json({ success: false, error: 'Content must be a JSON array' });
    }
    const filePath = path.join(__dirname, '../../../data/sample_college_students.json');
    fs.writeFileSync(filePath, JSON.stringify(validatedData, null, 2), 'utf8');
    res.json({ success: true, count: validatedData.length, message: 'Saved to sample_college_students.json successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Import history
router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const jobs = db.prepare('SELECT * FROM import_jobs ORDER BY created_at DESC LIMIT 20').all();
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
