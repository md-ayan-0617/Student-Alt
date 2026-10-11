const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../campus_intelligence.db');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? null : null });
    // Enable WAL (Write-Ahead Logging) mode and foreign keys for high performance and integrity
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    // Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      dbInstance.exec(schemaSql);
    }

    // Initialize default settings if not exists
    const initSettings = dbInstance.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    const defaultSettings = [
      ['institution_name', JSON.stringify({ name: 'Rungta Group of Institutions', code: 'RUNGTA-CAMPUS' })],
      ['theme_mode', JSON.stringify('dark')],
      ['index_weights', JSON.stringify({
        problem_volume: 0.25,
        difficulty_progression: 0.25,
        consistency: 0.20,
        competitive_programming: 0.15,
        github_development: 0.15
      })],
      ['connectors_config', JSON.stringify({
        leetcode: { enabled: true, rate_limit_rpm: 30, method: 'public_graphql' },
        gfg: { enabled: true, rate_limit_rpm: 20, method: 'public_profile' },
        codechef: { enabled: true, rate_limit_rpm: 30, method: 'public_api' },
        hackerrank: { enabled: true, rate_limit_rpm: 30, method: 'authorized_profile' },
        github: { enabled: true, rate_limit_rpm: 60, method: 'rest_api_v3' }
      })],
      ['demo_mode', JSON.stringify({ active: false, notice: 'Live institutional roster active' })]
    ];

    const runInit = dbInstance.transaction(() => {
      for (const [key, val] of defaultSettings) {
        initSettings.run(key, val);
      }
    });
    runInit();
  }
  return dbInstance;
}

module.exports = { getDb };
