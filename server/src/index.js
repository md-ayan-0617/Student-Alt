const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./database/db');
const seedService = require('./services/seedService');

// Route modules
const studentsRouter = require('./routes/students');
const analyticsRouter = require('./routes/analytics');
const importRouter = require('./routes/import');
const platformsRouter = require('./routes/platforms');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize DB and ensure seed data if empty
try {
  getDb();
  if (seedService.isDatabaseEmpty()) {
    console.log('[Campus Intelligence] Initializing database with demonstration college dataset...');
    seedService.seedDemoDataset();
  }
} catch (err) {
  console.error('[Campus Intelligence] Database initialization error:', err);
}

// API Routes
app.use('/api/students', studentsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/import', importRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Campus Coding Intelligence API',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`[Campus Intelligence API] Server running on http://localhost:${PORT}`);
});
