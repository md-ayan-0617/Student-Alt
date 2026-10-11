const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class StudentService {
  getAllStudents(options = {}) {
    const db = getDb();
    const {
      search = '',
      branch = '',
      batch = '',
      semester = '',
      platform = '',
      minSolved = null,
      ratingMin = null,
      page = 1,
      limit = 25,
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    let baseQuery = `
      SELECT 
        s.id, s.name, s.branch, s.batch, s.semester, s.student_id, s.email, s.data_completeness, s.is_demo, s.created_at, s.updated_at,
        lc.username as leetcode_username, lc.profile_url as leetcode_url, lc.status as leetcode_status, lc.last_sync_at as leetcode_sync,
        lcm.total_solved as leetcode_solved, lcm.easy_solved as leetcode_easy, lcm.medium_solved as leetcode_medium, lcm.hard_solved as leetcode_hard, lcm.rating as leetcode_rating,
        gfg.username as gfg_username, gfg.profile_url as gfg_url, gfg.status as gfg_status, gfg.last_sync_at as gfg_sync,
        gfgm.total_solved as gfg_solved, gfgm.rating as gfg_score, gfgm.institutional_rank as gfg_institute_rank, gfgm.raw_data as gfg_raw,
        cc.username as codechef_username, cc.profile_url as codechef_url, cc.status as codechef_status, cc.last_sync_at as codechef_sync,
        ccm.total_solved as codechef_solved, ccm.rating as codechef_rating, ccm.stars as codechef_stars, ccm.global_rank as codechef_global_rank,
        gh.username as github_username, gh.profile_url as github_url, gh.status as github_status,
        ghm.github_repos, ghm.github_stars,
        hr.username as hackerrank_username, hr.profile_url as hackerrank_url, hr.status as hackerrank_status,
        hrm.total_solved as hackerrank_solved, hrm.rating as hackerrank_rating
      FROM students s
      LEFT JOIN platform_accounts lc ON s.id = lc.student_id AND lc.platform = 'leetcode'
      LEFT JOIN platform_metrics lcm ON s.id = lcm.student_id AND lcm.platform = 'leetcode'
      LEFT JOIN platform_accounts gfg ON s.id = gfg.student_id AND gfg.platform = 'gfg'
      LEFT JOIN platform_metrics gfgm ON s.id = gfgm.student_id AND gfgm.platform = 'gfg'
      LEFT JOIN platform_accounts cc ON s.id = cc.student_id AND cc.platform = 'codechef'
      LEFT JOIN platform_metrics ccm ON s.id = ccm.student_id AND ccm.platform = 'codechef'
      LEFT JOIN platform_accounts gh ON s.id = gh.student_id AND gh.platform = 'github'
      LEFT JOIN platform_metrics ghm ON s.id = ghm.student_id AND ghm.platform = 'github'
      LEFT JOIN platform_accounts hr ON s.id = hr.student_id AND hr.platform = 'hackerrank'
      LEFT JOIN platform_metrics hrm ON s.id = hrm.student_id AND hrm.platform = 'hackerrank'
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim() !== '') {
      baseQuery += ` AND (
        s.name LIKE ? OR 
        s.student_id LIKE ? OR 
        lc.username LIKE ? OR 
        gfg.username LIKE ? OR 
        cc.username LIKE ? OR 
        gh.username LIKE ?
      )`;
      const sTerm = `%${search.trim()}%`;
      params.push(sTerm, sTerm, sTerm, sTerm, sTerm, sTerm);
    }

    if (branch && branch !== 'all') {
      baseQuery += ' AND s.branch = ?';
      params.push(branch);
    }

    if (batch && batch !== 'all') {
      baseQuery += ' AND s.batch = ?';
      params.push(batch);
    }

    if (semester && semester !== 'all') {
      baseQuery += ' AND s.semester = ?';
      params.push(semester);
    }

    if (platform && platform !== 'all') {
      if (platform === 'leetcode') baseQuery += ' AND lc.username IS NOT NULL AND lc.username != ""';
      if (platform === 'gfg') baseQuery += ' AND gfg.username IS NOT NULL AND gfg.username != ""';
      if (platform === 'codechef') baseQuery += ' AND cc.username IS NOT NULL AND cc.username != ""';
      if (platform === 'github') baseQuery += ' AND gh.username IS NOT NULL AND gh.username != ""';
      if (platform === 'hackerrank') baseQuery += ' AND hr.username IS NOT NULL AND hr.username != ""';
    }

    if (minSolved !== null && minSolved !== '') {
      baseQuery += ' AND (COALESCE(lcm.total_solved, 0) + COALESCE(gfgm.total_solved, 0)) >= ?';
      params.push(Number(minSolved));
    }

    if (ratingMin !== null && ratingMin !== '') {
      baseQuery += ' AND (COALESCE(lcm.rating, 0) >= ? OR COALESCE(ccm.rating, 0) >= ?)';
      params.push(Number(ratingMin), Number(ratingMin));
    }

    // Count total query
    const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery})`;
    const totalCount = db.prepare(countQuery).get(...params).count;

    // Sorting
    const sortMap = {
      name: 's.name',
      completeness: 's.data_completeness',
      leetcode_solved: 'COALESCE(lcm.total_solved, 0)',
      leetcode_rating: 'COALESCE(lcm.rating, 0)',
      gfg_solved: 'COALESCE(gfgm.total_solved, 0)',
      codechef_solved: 'COALESCE(ccm.total_solved, 0)',
      codechef_rating: 'COALESCE(ccm.rating, 0)',
      hackerrank_solved: 'COALESCE(hrm.total_solved, 0)',
      github_repos: 'COALESCE(ghm.github_repos, 0)',
      total_solved: '(COALESCE(lcm.total_solved, 0) + COALESCE(gfgm.total_solved, 0) + COALESCE(ccm.total_solved, 0))',
      created_at: 's.created_at'
    };
    const orderCol = sortMap[sortBy] || 's.name';
    const orderDir = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    baseQuery += ` ORDER BY ${orderCol} ${orderDir}`;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(2500, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    baseQuery += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const rows = db.prepare(baseQuery).all(...params);

    // Compute presentation aggregates per student
    const students = rows.map(r => {
      const reportedTotal = (r.leetcode_solved || 0) + (r.gfg_solved || 0) + (r.codechef_solved || 0) + (r.hackerrank_solved || 0);
      return {
        ...r,
        leetcode_url: r.leetcode_url || getCanonicalProfileUrl('leetcode', r.leetcode_username),
        gfg_url: r.gfg_url || getCanonicalProfileUrl('gfg', r.gfg_username),
        codechef_url: r.codechef_url || getCanonicalProfileUrl('codechef', r.codechef_username),
        github_url: r.github_url || getCanonicalProfileUrl('github', r.github_username),
        hackerrank_url: r.hackerrank_url || getCanonicalProfileUrl('hackerrank', r.hackerrank_username),
        reported_solved_total: reportedTotal,
        has_all_initial_platforms: !!(r.leetcode_username && r.gfg_username && r.codechef_username),
        platforms_linked_count: [r.leetcode_username, r.gfg_username, r.codechef_username, r.github_username, r.hackerrank_username].filter(Boolean).length
      };
    });

    return {
      students,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize) || 1
      }
    };
  }

  getStudentById(id) {
    const db = getDb();
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) return null;

    const rawAccounts = db.prepare('SELECT * FROM platform_accounts WHERE student_id = ?').all(id);
    const metrics = db.prepare('SELECT * FROM platform_metrics WHERE student_id = ?').all(id);
    const snapshots = db.prepare('SELECT * FROM metric_snapshots WHERE student_id = ? ORDER BY snapshot_date ASC').all(id);
    const activityEvents = db.prepare('SELECT * FROM platform_activity_events WHERE student_id = ? ORDER BY event_date DESC LIMIT 30').all(id);

    // Ensure accounts have canonical URLs
    const accounts = rawAccounts.map(a => ({
      ...a,
      username: extractUsername(a.platform, a.username),
      profile_url: a.profile_url || getCanonicalProfileUrl(a.platform, a.username)
    }));

    // Parse JSON columns in metrics
    const metricsMap = {};
    metrics.forEach(m => {
      metricsMap[m.platform] = {
        ...m,
        top_languages: m.top_languages ? JSON.parse(m.top_languages) : [],
        topic_stats: m.topic_stats ? JSON.parse(m.topic_stats) : {},
        raw_data: m.raw_data ? JSON.parse(m.raw_data) : null
      };
    });

    return {
      student,
      accounts,
      metrics: metricsMap,
      snapshots,
      recentActivity: activityEvents
    };
  }

  updateStudent(id, data) {
    const db = getDb();
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) return null;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE students 
      SET name = COALESCE(?, name),
          branch = COALESCE(?, branch),
          batch = COALESCE(?, batch),
          semester = COALESCE(?, semester),
          student_id = COALESCE(?, student_id),
          email = COALESCE(?, email),
          updated_at = ?
      WHERE id = ?
    `).run(data.name, data.branch, data.batch, data.semester, data.student_id, data.email, now, id);

    // Platform handles
    const platforms = ['leetcode', 'gfg', 'codechef', 'github', 'hackerrank'];
    const upsertAccount = db.prepare(`
      INSERT INTO platform_accounts (id, student_id, platform, username, profile_url, is_linked, status, created_at)
      VALUES (?, ?, ?, ?, ?, 1, 'pending', ?)
      ON CONFLICT(student_id, platform) DO UPDATE SET
        username = excluded.username,
        profile_url = excluded.profile_url,
        is_linked = excluded.is_linked
    `);

    platforms.forEach(p => {
      if (data[`${p}_id`] !== undefined) {
        const val = extractUsername(p, data[`${p}_id`]);
        const canonicalUrl = getCanonicalProfileUrl(p, val);
        if (val) {
          upsertAccount.run(uuidv4(), id, p, val, canonicalUrl, now);
        } else {
          db.prepare('DELETE FROM platform_accounts WHERE student_id = ? AND platform = ?').run(id, p);
        }
      }
    });

    return this.getStudentById(id);
  }

  deleteStudent(id) {
    const db = getDb();
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    return true;
  }
}

module.exports = new StudentService();
