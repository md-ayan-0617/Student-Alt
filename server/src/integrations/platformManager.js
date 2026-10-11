const leetcode = require('./leetcodeAdapter');
const gfg = require('./gfgAdapter');
const codechef = require('./codechefAdapter');
const hackerrank = require('./hackerrankAdapter');
const github = require('./githubAdapter');
const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

const adapters = {
  leetcode,
  gfg,
  codechef,
  hackerrank,
  github
};

class PlatformManager {
  getAdapter(platform) {
    return adapters[platform] || null;
  }

  calculateCompleteness(studentId) {
    const db = getDb();
    const accounts = db.prepare('SELECT platform, username, is_verified, status FROM platform_accounts WHERE student_id = ?').all(studentId);
    
    let score = 20; // 20 base for student master identity
    const platformWeights = {
      leetcode: 25,
      gfg: 20,
      codechef: 20,
      github: 10,
      hackerrank: 5
    };

    for (const acc of accounts) {
      if (acc.username && acc.username.trim() !== '') {
        const weight = platformWeights[acc.platform] || 10;
        if (acc.status === 'connected' || acc.is_verified === 1) {
          score += weight;
        } else {
          score += Math.round(weight * 0.4);
        }
      }
    }

    const finalScore = Math.min(100, score);
    db.prepare('UPDATE students SET data_completeness = ?, updated_at = ? WHERE id = ?')
      .run(finalScore, new Date().toISOString(), studentId);

    return finalScore;
  }

  async syncStudentAccount(studentId, platform) {
    const db = getDb();
    const adapter = this.getAdapter(platform);
    if (!adapter) {
      return { success: false, error: `Unsupported platform: ${platform}` };
    }

    const account = db.prepare('SELECT * FROM platform_accounts WHERE student_id = ? AND platform = ?')
      .get(studentId, platform);

    if (!account || !account.username || account.username.trim() === '') {
      return { success: false, error: `No ${platform} handle linked for student` };
    }

    // Clean and normalize username
    const cleanUsername = extractUsername(platform, account.username);
    const canonicalUrl = getCanonicalProfileUrl(platform, cleanUsername);

    const result = await adapter.fetchProfile(cleanUsername);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    if (result.success) {
      const verifiedProfileUrl = result.profile_url || canonicalUrl;

      // Update account status and sanitize stored handle
      db.prepare(`
        UPDATE platform_accounts 
        SET is_verified = 1, status = 'connected', last_sync_at = ?, last_error = NULL, 
            username = ?, profile_url = ?
        WHERE id = ?
      `).run(now, cleanUsername, verifiedProfileUrl, account.id);

      const m = result.metrics || {};

      // Insert or update platform_metrics
      const existingMetrics = db.prepare('SELECT id FROM platform_metrics WHERE student_id = ? AND platform = ?')
        .get(studentId, platform);

      const metricId = existingMetrics ? existingMetrics.id : uuidv4();

      db.prepare(`
        INSERT INTO platform_metrics (
          id, student_id, platform, total_solved, easy_solved, medium_solved, hard_solved,
          rating, global_rank, country_rank, institutional_rank, acceptance_rate,
          contests_attended, stars, github_repos, github_commits_year, github_stars,
          github_prs, top_languages, topic_stats, raw_data, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
        ON CONFLICT(student_id, platform) DO UPDATE SET
          total_solved = excluded.total_solved,
          easy_solved = excluded.easy_solved,
          medium_solved = excluded.medium_solved,
          hard_solved = excluded.hard_solved,
          rating = excluded.rating,
          global_rank = excluded.global_rank,
          country_rank = excluded.country_rank,
          institutional_rank = excluded.institutional_rank,
          acceptance_rate = excluded.acceptance_rate,
          contests_attended = excluded.contests_attended,
          stars = excluded.stars,
          github_repos = excluded.github_repos,
          github_stars = excluded.github_stars,
          top_languages = excluded.top_languages,
          raw_data = excluded.raw_data,
          updated_at = excluded.updated_at
      `).run(
        metricId, studentId, platform,
        m.total_solved !== undefined && m.total_solved !== null ? m.total_solved : null,
        m.easy_solved !== undefined && m.easy_solved !== null ? m.easy_solved : null,
        m.medium_solved !== undefined && m.medium_solved !== null ? m.medium_solved : null,
        m.hard_solved !== undefined && m.hard_solved !== null ? m.hard_solved : null,
        m.rating || null,
        m.global_rank || null,
        m.country_rank || null,
        m.institutional_rank || null,
        m.acceptance_rate || null,
        m.contests_attended || null,
        m.stars || null,
        m.github_repos || null,
        m.github_commits_year || null,
        m.github_stars || null,
        m.github_prs || null,
        m.top_languages ? JSON.stringify(m.top_languages) : null,
        m.topic_stats ? JSON.stringify(m.topic_stats) : null,
        result.raw ? JSON.stringify(result.raw) : null,
        now
      );

      // Record snapshot with verified numbers
      const existingSnapshot = db.prepare('SELECT id FROM metric_snapshots WHERE student_id = ? AND platform = ? AND snapshot_date = ?')
        .get(studentId, platform, today);

      if (!existingSnapshot) {
        db.prepare(`
          INSERT INTO metric_snapshots (id, student_id, platform, snapshot_date, total_solved, easy_solved, medium_solved, hard_solved, rating, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(), studentId, platform, today,
          m.total_solved || null,
          m.easy_solved || null,
          m.medium_solved || null,
          m.hard_solved || null,
          m.rating || null,
          now
        );
      }

      // Record verified activity event
      if (m.total_solved > 0 || m.github_repos > 0) {
        const existingEvent = db.prepare('SELECT id FROM platform_activity_events WHERE student_id = ? AND platform = ? AND event_date = ?')
          .get(studentId, platform, today);
        if (!existingEvent) {
          db.prepare(`
            INSERT INTO platform_activity_events (id, student_id, platform, event_date, activity_count, status)
            VALUES (?, ?, ?, ?, ?, 'verified_active')
          `).run(uuidv4(), studentId, platform, today, m.total_solved || 1);
        }
      }

      this.calculateCompleteness(studentId);
      return { success: true, metrics: m, profile_url: verifiedProfileUrl, username: cleanUsername };
    } else {
      // Failed synchronization must preserve previous successful snapshot timestamp and mark as stale
      const previousSuccessfulSync = account.last_sync_at;
      const newStatus = previousSuccessfulSync ? 'stale' : (result.code === 'USER_NOT_FOUND' ? 'not_found' : 'error');
      
      db.prepare(`
        UPDATE platform_accounts 
        SET status = ?, last_error = ?, username = ?, profile_url = ?
        WHERE id = ?
      `).run(newStatus, result.error, cleanUsername, canonicalUrl, account.id);

      this.calculateCompleteness(studentId);
      return { success: false, error: result.error, code: result.code, preservedLastSync: previousSuccessfulSync };
    }
  }

  queueSyncStudents(studentIds, platform = 'all') {
    if (!studentIds || studentIds.length === 0) return null;
    const db = getDb();
    const jobId = uuidv4();
    const startTime = new Date().toISOString();

    db.prepare(`
      INSERT INTO sync_jobs (id, platform, status, profiles_synced, profiles_failed, details, created_at)
      VALUES (?, ?, 'running', 0, 0, ?, ?)
    `).run(
      jobId,
      platform,
      JSON.stringify({
        message: 'Background profile sync initiated for imported students',
        total_students: studentIds.length,
        progress: 0
      }),
      startTime
    );

    // Run asynchronously in the background so import HTTP response returns instantly
    setImmediate(async () => {
      try {
        await this.processStudentSyncQueue(jobId, studentIds, platform);
      } catch (err) {
        console.error('[PlatformManager] Background sync error:', err);
        const failTime = new Date().toISOString();
        db.prepare(`
          UPDATE sync_jobs SET status = 'failed', details = ?, completed_at = ? WHERE id = ?
        `).run(JSON.stringify({ error: err.message }), failTime, jobId);
      }
    });

    return jobId;
  }

  async processStudentSyncQueue(jobId, studentIds, platform = 'all') {
    const db = getDb();
    const placeholders = studentIds.map(() => '?').join(',');
    let query = `
      SELECT student_id, platform 
      FROM platform_accounts 
      WHERE student_id IN (${placeholders})
        AND username IS NOT NULL AND username != ''
    `;
    const params = [...studentIds];
    if (platform !== 'all') {
      query += ' AND platform = ?';
      params.push(platform);
    }

    const accounts = db.prepare(query).all(...params);
    let synced = 0;
    let failed = 0;
    const errors = [];

    // Controlled concurrency batching: 5 concurrent requests with 250ms spacing
    const concurrency = 5;
    for (let i = 0; i < accounts.length; i += concurrency) {
      const batch = accounts.slice(i, i + concurrency);
      await Promise.all(batch.map(async (acc) => {
        try {
          const res = await this.syncStudentAccount(acc.student_id, acc.platform);
          if (res.success) {
            synced++;
          } else {
            failed++;
            errors.push({ student_id: acc.student_id, platform: acc.platform, error: res.error });
          }
        } catch (err) {
          failed++;
          errors.push({ student_id: acc.student_id, platform: acc.platform, error: err.message });
        }
      }));

      const progressPercent = Math.round(((synced + failed) / (accounts.length || 1)) * 100);
      db.prepare(`
        UPDATE sync_jobs 
        SET profiles_synced = ?, profiles_failed = ?, details = ?
        WHERE id = ?
      `).run(
        synced,
        failed,
        JSON.stringify({
          total: accounts.length,
          progress: progressPercent,
          errors: errors.slice(0, 5)
        }),
        jobId
      );

      // Controlled backoff between batches to prevent 429 rate limits
      if (i + concurrency < accounts.length) {
        await new Promise(r => setTimeout(r, 250));
      }
    }

    const endTime = new Date().toISOString();
    const finalStatus = failed === 0 ? 'success' : (synced === 0 ? 'failed' : 'partial');
    db.prepare(`
      UPDATE sync_jobs 
      SET status = ?, profiles_synced = ?, profiles_failed = ?, details = ?, completed_at = ?
      WHERE id = ?
    `).run(
      finalStatus,
      synced,
      failed,
      JSON.stringify({
        total: accounts.length,
        progress: 100,
        errors: errors.slice(0, 10)
      }),
      endTime,
      jobId
    );
  }

  async runSyncJob(platform = 'all') {
    const db = getDb();
    const jobId = uuidv4();
    const startTime = new Date().toISOString();

    db.prepare(`
      INSERT INTO sync_jobs (id, platform, status, profiles_synced, profiles_failed, details, created_at)
      VALUES (?, ?, 'running', 0, 0, ?, ?)
    `).run(jobId, platform, JSON.stringify({ message: 'Sync in progress', progress: 0 }), startTime);

    let query = 'SELECT student_id, platform FROM platform_accounts WHERE username IS NOT NULL AND username != ""';
    let params = [];
    if (platform !== 'all') {
      query += ' AND platform = ?';
      params.push(platform);
    }

    const accounts = db.prepare(query).all(...params);
    let synced = 0;
    let failed = 0;
    const errors = [];

    // Controlled concurrency batching of 5
    const concurrency = 5;
    for (let i = 0; i < accounts.length; i += concurrency) {
      const batch = accounts.slice(i, i + concurrency);
      await Promise.all(batch.map(async (acc) => {
        try {
          const res = await this.syncStudentAccount(acc.student_id, acc.platform);
          if (res.success) {
            synced++;
          } else {
            failed++;
            errors.push({ student_id: acc.student_id, platform: acc.platform, error: res.error });
          }
        } catch (err) {
          failed++;
          errors.push({ student_id: acc.student_id, platform: acc.platform, error: err.message });
        }
      }));

      const progressPercent = Math.round(((synced + failed) / (accounts.length || 1)) * 100);
      db.prepare(`
        UPDATE sync_jobs 
        SET profiles_synced = ?, profiles_failed = ?, details = ?
        WHERE id = ?
      `).run(
        synced,
        failed,
        JSON.stringify({
          total: accounts.length,
          progress: progressPercent,
          errors: errors.slice(0, 5)
        }),
        jobId
      );

      if (i + concurrency < accounts.length) {
        await new Promise(r => setTimeout(r, 250));
      }
    }

    const endTime = new Date().toISOString();
    const finalStatus = failed === 0 ? 'success' : (synced === 0 ? 'failed' : 'partial');

    db.prepare(`
      UPDATE sync_jobs 
      SET status = ?, profiles_synced = ?, profiles_failed = ?, details = ?, completed_at = ?
      WHERE id = ?
    `).run(
      finalStatus,
      synced,
      failed,
      JSON.stringify({ total: accounts.length, progress: 100, errors: errors.slice(0, 10) }),
      endTime,
      jobId
    );

    return { jobId, status: finalStatus, synced, failed, total: accounts.length };
  }
}

module.exports = new PlatformManager();
