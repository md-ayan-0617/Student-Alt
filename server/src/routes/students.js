const express = require('express');
const router = express.Router();
const studentService = require('../services/studentService');
const platformManager = require('../integrations/platformManager');

// GET all students with multi-filter & pagination
router.get('/', (req, res) => {
  try {
    const result = studentService.getAllStudents(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET export filtered students as CSV
router.get('/export-csv', (req, res) => {
  try {
    const { students } = studentService.getAllStudents({ ...req.query, limit: 10000, page: 1 });
    const headers = [
      'Internal ID', 'Name', 'Student ID', 'Branch', 'Batch', 'Semester',
      'LeetCode Handle', 'LeetCode Solved', 'LeetCode Rating',
      'GFG Handle', 'GFG Solved',
      'CodeChef Handle', 'CodeChef Rating', 'CodeChef Stars',
      'GitHub Handle', 'GitHub Repos',
      'HackerRank Handle', 'Data Completeness %'
    ];

    const rows = students.map(s => [
      `"${s.id}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.student_id || ''}"`,
      `"${s.branch || ''}"`,
      `"${s.batch || ''}"`,
      `"${s.semester || ''}"`,
      `"${s.leetcode_username || ''}"`,
      s.leetcode_solved || 0,
      s.leetcode_rating || '',
      `"${s.gfg_username || ''}"`,
      s.gfg_solved || 0,
      `"${s.codechef_username || ''}"`,
      s.codechef_rating || '',
      `"${s.codechef_stars || ''}"`,
      `"${s.github_username || ''}"`,
      s.github_repos || 0,
      `"${s.hackerrank_username || ''}"`,
      s.data_completeness || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campus_coding_roster_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single student details
router.get('/:id', (req, res) => {
  try {
    const student = studentService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update student details & linked handles
router.put('/:id', (req, res) => {
  try {
    const updated = studentService.updateStudent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE student
router.delete('/:id', (req, res) => {
  try {
    const deleted = studentService.deleteStudent(req.params.id);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST sync a single student platform
router.post('/:id/sync/:platform', async (req, res) => {
  try {
    const { id, platform } = req.params;
    const result = await platformManager.syncStudentAccount(id, platform);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST sync all platforms for a single student
router.post('/:id/sync-all', async (req, res) => {
  try {
    const { id } = req.params;
    const platforms = ['leetcode', 'gfg', 'codechef', 'github', 'hackerrank'];
    const results = {};
    for (const p of platforms) {
      results[p] = await platformManager.syncStudentAccount(id, p);
    }
    const updated = studentService.getStudentById(id);
    res.json({ success: true, results, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
