const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

// Overview dashboard metrics
router.get('/overview', (req, res) => {
  try {
    const data = analyticsService.getOverview(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Leaderboards
router.get('/leaderboards', (req, res) => {
  try {
    const { type = 'total_solved', branch, batch, semester, limit = 50 } = req.query;
    const data = analyticsService.getLeaderboards(type, { branch, batch, semester, limit: parseInt(limit, 10) });
    res.json({ success: true, data, type });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Skills and DSA Topics
router.get('/skills', (req, res) => {
  try {
    const data = analyticsService.getSkillsAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Branch & Batch breakdown
router.get('/branch-batch', (req, res) => {
  try {
    const data = analyticsService.getBranchBatchComparison();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/benchmarks', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        methodologyNotice: 'External benchmarking requires authorized inter-institutional contest datasets. Institutional scores and cohort rankings are only displayed when verified partner records are uploaded.',
        hasExternalDataset: false,
        internalProgressIndex: null,
        comparisonPartners: []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
