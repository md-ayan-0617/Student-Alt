const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');
const seedService = require('../services/seedService');

// GET all settings
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    rows.forEach(r => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch (e) {
        settings[r.key] = r.value;
      }
    });

    // Check count of students and if any demo
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const demoCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE is_demo = 1').get().count;

    res.json({
      success: true,
      settings,
      stats: {
        totalStudents,
        demoCount,
        isDemoActive: demoCount > 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update specific setting
router.post('/', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, error: 'Key is required' });
    }

    const db = getDb();
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(key, serialized);

    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Seed realistic demo dataset
router.post('/seed-demo', (req, res) => {
  try {
    const result = seedService.seedDemoDataset();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Purge all data (Clean slate)
router.post('/purge-data', (req, res) => {
  try {
    const result = seedService.purgeAllData();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Audit logs
router.get('/audit-logs', (req, res) => {
  try {
    const db = getDb();
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50').all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
