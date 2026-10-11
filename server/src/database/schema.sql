-- CAMPUS CODING INTELLIGENCE: Core Relational Database Schema
-- Implemented for SQLite (WAL mode) / PostgreSQL compatible

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  branch TEXT,
  batch TEXT,
  semester TEXT,
  student_id TEXT,
  email TEXT,
  data_completeness REAL DEFAULT 0,
  is_demo INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_accounts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'leetcode', 'gfg', 'codechef', 'hackerrank', 'github'
  username TEXT,
  profile_url TEXT,
  is_linked INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'connected', 'pending', 'error', 'not_found', 'manual'
  last_sync_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE (student_id, platform)
);

CREATE TABLE IF NOT EXISTS platform_metrics (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  total_solved INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  rating REAL,
  global_rank INTEGER,
  country_rank INTEGER,
  institutional_rank INTEGER,
  acceptance_rate REAL,
  contests_attended INTEGER DEFAULT 0,
  stars TEXT,
  github_repos INTEGER,
  github_commits_year INTEGER,
  github_stars INTEGER,
  github_prs INTEGER,
  top_languages TEXT, -- JSON array
  topic_stats TEXT, -- JSON object
  raw_data TEXT, -- JSON object
  updated_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE (student_id, platform)
);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  total_solved INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  rating REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform_activity_events (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  event_date TEXT NOT NULL,
  activity_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'verified_active', -- 'verified_active', 'no_activity', 'sync_failed'
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  valid_records INTEGER DEFAULT 0,
  invalid_records INTEGER DEFAULT 0,
  duplicate_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  errors TEXT, -- JSON array
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  profiles_synced INTEGER DEFAULT 0,
  profiles_failed INTEGER DEFAULT 0,
  details TEXT, -- JSON object
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user_role TEXT DEFAULT 'College Administrator',
  details TEXT,
  ip_address TEXT,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS external_benchmarks (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  year TEXT NOT NULL,
  is_verified INTEGER DEFAULT 0,
  metrics TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_student ON platform_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_accounts_platform ON platform_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_metrics_student ON platform_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_metrics_platform ON platform_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_snapshots_student ON metric_snapshots(student_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON metric_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_activity_student_date ON platform_activity_events(student_id, event_date);
