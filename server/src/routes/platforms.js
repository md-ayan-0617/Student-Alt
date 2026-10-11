const express = require('express');
const router = express.Router();
const platformManager = require('../integrations/platformManager');
const { getDb } = require('../database/db');

// GET status of all 5 platform adapters
router.get('/status', (req, res) => {
  try {
    const db = getDb();
    const lastSyncs = db.prepare(`
      SELECT platform, MAX(last_sync_at) as last_sync, 
             COUNT(CASE WHEN status = 'connected' THEN 1 END) as connected_count,
             COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
      FROM platform_accounts
      GROUP BY platform
    `).all();

    const syncMap = {};
    lastSyncs.forEach(s => {
      syncMap[s.platform] = s;
    });

    const platforms = [
      {
        id: 'leetcode',
        name: 'LeetCode',
        connectionStatus: 'Operational',
        accessMethod: 'Official GraphQL Query',
        rateLimit: '30 requests / minute',
        authRequired: false,
        metricsAvailable: ['Total Solved', 'Easy/Medium/Hard Breakdown', 'Contest Rating', 'Global Rank'],
        unsupportedMetrics: ['Private Submission Code', 'Exact Memory Percentile Across Problems'],
        lastSync: syncMap['leetcode']?.last_sync || null,
        connectedCount: syncMap['leetcode']?.connected_count || 0,
        errorCount: syncMap['leetcode']?.error_count || 0
      },
      {
        id: 'gfg',
        name: 'GeeksforGeeks',
        connectionStatus: 'Operational',
        accessMethod: 'Public Profile Stats Connector',
        rateLimit: '20 requests / minute',
        authRequired: false,
        metricsAvailable: ['Total Solved', 'Coding Score', 'Institute Rank', 'Topic Solved Counts'],
        unsupportedMetrics: ['Real-time IDE Keystrokes', 'Contest Anti-Cheat Flags'],
        lastSync: syncMap['gfg']?.last_sync || null,
        connectedCount: syncMap['gfg']?.connected_count || 0,
        errorCount: syncMap['gfg']?.error_count || 0
      },
      {
        id: 'codechef',
        name: 'CodeChef',
        connectionStatus: 'Operational',
        accessMethod: 'Official Profile API',
        rateLimit: '30 requests / minute',
        authRequired: false,
        metricsAvailable: ['Current Star Rating', 'Stars (1★-7★)', 'Global Rank', 'Country Rank', 'Contest Ratings'],
        unsupportedMetrics: ['Unrated Practice Submissions'],
        lastSync: syncMap['codechef']?.last_sync || null,
        connectedCount: syncMap['codechef']?.connected_count || 0,
        errorCount: syncMap['codechef']?.error_count || 0
      },
      {
        id: 'hackerrank',
        name: 'HackerRank',
        connectionStatus: 'Linked Profiles Required',
        accessMethod: 'Authorized Public Profile ELO Connector',
        rateLimit: '30 requests / minute',
        authRequired: false,
        metricsAvailable: ['Badges Count', 'Domain Scores', 'Rank Tiers'],
        unsupportedMetrics: ['Interview Assessment Results (Private)'],
        lastSync: syncMap['hackerrank']?.last_sync || null,
        connectedCount: syncMap['hackerrank']?.connected_count || 0,
        errorCount: syncMap['hackerrank']?.error_count || 0
      },
      {
        id: 'github',
        name: 'GitHub',
        connectionStatus: 'Operational',
        accessMethod: 'GitHub REST API v3',
        rateLimit: '60 req/hr (unauth) / 5000 req/hr (PAT configured)',
        authRequired: false,
        metricsAvailable: ['Public Repositories', 'Stars', 'Top Languages Distribution', 'Public Followers'],
        unsupportedMetrics: ['Private Enterprise Commits', 'Algorithmic Skill Rating (Non-comparable)'],
        lastSync: syncMap['github']?.last_sync || null,
        connectedCount: syncMap['github']?.connected_count || 0,
        errorCount: syncMap['github']?.error_count || 0
      }
    ];

    res.json({ success: true, platforms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Trigger platform synchronization
router.post('/sync-all', async (req, res) => {
  try {
    const { platform = 'all' } = req.body;
    const result = await platformManager.runSyncJob(platform);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Recent sync job logs
router.get('/sync-jobs', (req, res) => {
  try {
    const db = getDb();
    const jobs = db.prepare('SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 20').all();
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
