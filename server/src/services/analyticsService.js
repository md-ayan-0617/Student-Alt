const { getDb } = require('../database/db');

class AnalyticsService {
  getOverview(filters = {}) {
    const db = getDb();
    const { branch, batch, semester, timeRange = '30d' } = filters;

    let studentFilter = 'WHERE 1=1';
    const params = [];
    if (branch && branch !== 'all') {
      studentFilter += ' AND s.branch = ?';
      params.push(branch);
    }
    if (batch && batch !== 'all') {
      studentFilter += ' AND s.batch = ?';
      params.push(batch);
    }
    if (semester && semester !== 'all') {
      studentFilter += ' AND s.semester = ?';
      params.push(semester);
    }

    // 1. Coverage
    const totalStudents = db.prepare(`SELECT COUNT(*) as count FROM students s ${studentFilter}`).get(...params).count;

    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        coverage: { withAnyPlatform: 0, withInitialThree: 0, platformCounts: {} },
        problemSolving: { totalReported: 0, avgPerStudent: 0, medianPerStudent: 0, easy: 0, medium: 0, hard: 0 },
        competitiveProgramming: { ratedStudents: 0, maxLeetCodeRating: null, maxCodeChefRating: null },
        activity: { active7d: 0, active30d: 0 },
        platforms: [],
        difficulty: { easy: 0, medium: 0, hard: 0, easyPct: 0, mediumPct: 0, hardPct: 0 },
        historicalTrends: [],
        highlights: {}
      };
    }

    // Platform account counts
    const platformCountsQuery = `
      SELECT pa.platform, COUNT(DISTINCT pa.student_id) as count,
             SUM(CASE WHEN pa.status = 'connected' OR pa.is_verified = 1 THEN 1 ELSE 0 END) as verified_count
      FROM platform_accounts pa
      JOIN students s ON pa.student_id = s.id
      ${studentFilter} AND pa.username IS NOT NULL AND pa.username != ''
      GROUP BY pa.platform
    `;
    const platformRows = db.prepare(platformCountsQuery).all(...params);
    const platformMap = {};
    platformRows.forEach(r => {
      platformMap[r.platform] = { total: r.count, verified: r.verified_count };
    });

    // Students with at least 1 platform
    const withAnyQuery = `
      SELECT COUNT(DISTINCT pa.student_id) as count
      FROM platform_accounts pa
      JOIN students s ON pa.student_id = s.id
      ${studentFilter} AND pa.username IS NOT NULL AND pa.username != ''
    `;
    const withAnyCount = db.prepare(withAnyQuery).get(...params).count;

    // Students with all three initially supplied identifiers (leetcode, gfg, codechef)
    const withThreeQuery = `
      SELECT COUNT(*) as count FROM (
        SELECT s.id
        FROM students s
        JOIN platform_accounts pa ON s.id = pa.student_id
        ${studentFilter} AND pa.platform IN ('leetcode', 'gfg', 'codechef') AND pa.username IS NOT NULL AND pa.username != ''
        GROUP BY s.id
        HAVING COUNT(DISTINCT pa.platform) = 3
      )
    `;
    const withThreeCount = db.prepare(withThreeQuery).get(...params).count;

    // 2. Problem Solving Metrics
    const metricsSumQuery = `
      SELECT 
        pm.platform,
        SUM(pm.total_solved) as total_solved,
        SUM(pm.easy_solved) as easy_solved,
        SUM(pm.medium_solved) as medium_solved,
        SUM(pm.hard_solved) as hard_solved,
        MAX(pm.rating) as max_rating,
        AVG(pm.rating) as avg_rating
      FROM platform_metrics pm
      JOIN students s ON pm.student_id = s.id
      ${studentFilter}
      GROUP BY pm.platform
    `;
    const metricsRows = db.prepare(metricsSumQuery).all(...params);

    let totalInstitutionalReported = 0;
    let easyTotal = 0;
    let mediumTotal = 0;
    let hardTotal = 0;

    metricsRows.forEach(r => {
      totalInstitutionalReported += (r.total_solved || 0);
      easyTotal += (r.easy_solved || 0);
      mediumTotal += (r.medium_solved || 0);
      hardTotal += (r.hard_solved || 0);
    });

    // Student-level distribution for median & average
    const studentTotalsQuery = `
      SELECT s.id, SUM(COALESCE(pm.total_solved, 0)) as student_total
      FROM students s
      LEFT JOIN platform_metrics pm ON s.id = pm.student_id
      ${studentFilter}
      GROUP BY s.id
      ORDER BY student_total ASC
    `;
    const studentTotals = db.prepare(studentTotalsQuery).all(...params).map(r => r.student_total);
    const avgPerStudent = totalStudents > 0 ? Math.round(totalInstitutionalReported / totalStudents) : 0;
    let medianPerStudent = 0;
    if (studentTotals.length > 0) {
      const mid = Math.floor(studentTotals.length / 2);
      medianPerStudent = studentTotals.length % 2 !== 0 ? studentTotals[mid] : Math.round((studentTotals[mid - 1] + studentTotals[mid]) / 2);
    }

    // 3. Competitive Programming
    const lcMax = db.prepare(`
      SELECT MAX(pm.rating) as max_r FROM platform_metrics pm
      JOIN students s ON pm.student_id = s.id
      ${studentFilter} AND pm.platform = 'leetcode'
    `).get(...params)?.max_r || null;

    const ccMax = db.prepare(`
      SELECT MAX(pm.rating) as max_r FROM platform_metrics pm
      JOIN students s ON pm.student_id = s.id
      ${studentFilter} AND pm.platform = 'codechef'
    `).get(...params)?.max_r || null;

    const ratedCount = db.prepare(`
      SELECT COUNT(DISTINCT pm.student_id) as count FROM platform_metrics pm
      JOIN students s ON pm.student_id = s.id
      ${studentFilter} AND pm.rating IS NOT NULL AND pm.rating > 0
    `).get(...params).count;

    // 4. Activity (based on verified activity events or recent snapshots)
    const active7d = db.prepare(`
      SELECT COUNT(DISTINCT pae.student_id) as count
      FROM platform_activity_events pae
      JOIN students s ON pae.student_id = s.id
      ${studentFilter} AND pae.event_date >= date('now', '-7 days') AND pae.activity_count > 0
    `).get(...params)?.count || 0;

    const active30d = db.prepare(`
      SELECT COUNT(DISTINCT pae.student_id) as count
      FROM platform_activity_events pae
      JOIN students s ON pae.student_id = s.id
      ${studentFilter} AND pae.event_date >= date('now', '-30 days') AND pae.activity_count > 0
    `).get(...params)?.count || 0;

    // 5. Difficulty Breakdown
    const diffSum = easyTotal + mediumTotal + hardTotal;
    const difficulty = {
      easy: easyTotal,
      medium: mediumTotal,
      hard: hardTotal,
      easyPct: diffSum > 0 ? Math.round((easyTotal / diffSum) * 100) : 0,
      mediumPct: diffSum > 0 ? Math.round((mediumTotal / diffSum) * 100) : 0,
      hardPct: diffSum > 0 ? Math.round((hardTotal / diffSum) * 100) : 0
    };

    // 6. Platform Comparison summary cards
    const platformSummaries = [
      {
        platform: 'leetcode',
        name: 'LeetCode',
        color: '#FFA116',
        accountsLinked: platformMap['leetcode']?.total || 0,
        accountsVerified: platformMap['leetcode']?.verified || 0,
        totalSolved: metricsRows.find(m => m.platform === 'leetcode')?.total_solved || 0,
        maxRating: lcMax,
        coveragePct: Math.round(((platformMap['leetcode']?.total || 0) / totalStudents) * 100)
      },
      {
        platform: 'gfg',
        name: 'GeeksforGeeks',
        color: '#2F8D46',
        accountsLinked: platformMap['gfg']?.total || 0,
        accountsVerified: platformMap['gfg']?.verified || 0,
        totalSolved: metricsRows.find(m => m.platform === 'gfg')?.total_solved || 0,
        maxRating: null,
        coveragePct: Math.round(((platformMap['gfg']?.total || 0) / totalStudents) * 100)
      },
      {
        platform: 'codechef',
        name: 'CodeChef',
        color: '#8B5CF6',
        accountsLinked: platformMap['codechef']?.total || 0,
        accountsVerified: platformMap['codechef']?.verified || 0,
        totalSolved: metricsRows.find(m => m.platform === 'codechef')?.total_solved || 0,
        maxRating: ccMax,
        coveragePct: Math.round(((platformMap['codechef']?.total || 0) / totalStudents) * 100)
      },
      {
        platform: 'hackerrank',
        name: 'HackerRank',
        color: '#00EA64',
        accountsLinked: platformMap['hackerrank']?.total || 0,
        accountsVerified: platformMap['hackerrank']?.verified || 0,
        totalSolved: metricsRows.find(m => m.platform === 'hackerrank')?.total_solved || 0,
        maxRating: null,
        coveragePct: Math.round(((platformMap['hackerrank']?.total || 0) / totalStudents) * 100)
      },
      {
        platform: 'github',
        name: 'GitHub',
        color: '#6B8CFF',
        accountsLinked: platformMap['github']?.total || 0,
        accountsVerified: platformMap['github']?.verified || 0,
        totalSolved: null, // Distinct metric: public dev repos
        reposCount: db.prepare(`SELECT SUM(pm.github_repos) as total FROM platform_metrics pm JOIN students s ON pm.student_id = s.id ${studentFilter} AND pm.platform = 'github'`).get(...params)?.total || 0,
        coveragePct: Math.round(((platformMap['github']?.total || 0) / totalStudents) * 100)
      }
    ];

    // 7. Historical Trends based on snapshots
    const snapshotsQuery = `
      SELECT ms.snapshot_date, 
             SUM(ms.total_solved) as total_solved,
             SUM(ms.easy_solved) as easy_solved,
             SUM(ms.medium_solved) as medium_solved,
             SUM(ms.hard_solved) as hard_solved,
             AVG(ms.rating) as avg_rating
      FROM metric_snapshots ms
      JOIN students s ON ms.student_id = s.id
      ${studentFilter}
      GROUP BY ms.snapshot_date
      ORDER BY ms.snapshot_date ASC
      LIMIT 30
    `;
    const historicalTrends = db.prepare(snapshotsQuery).all(...params);

    // 8. Highlights
    const topSolvedStudent = db.prepare(`
      SELECT s.id, s.name, s.branch, SUM(pm.total_solved) as total
      FROM students s
      JOIN platform_metrics pm ON s.id = pm.student_id
      ${studentFilter}
      GROUP BY s.id
      ORDER BY total DESC
      LIMIT 1
    `).get(...params);

    const topRatingStudent = db.prepare(`
      SELECT s.id, s.name, s.branch, MAX(pm.rating) as rating, pm.platform
      FROM students s
      JOIN platform_metrics pm ON s.id = pm.student_id
      ${studentFilter} AND pm.rating IS NOT NULL
      GROUP BY s.id
      ORDER BY rating DESC
      LIMIT 1
    `).get(...params);

    const topHardStudent = db.prepare(`
      SELECT s.id, s.name, s.branch, SUM(pm.hard_solved) as total_hard
      FROM students s
      JOIN platform_metrics pm ON s.id = pm.student_id
      ${studentFilter}
      GROUP BY s.id
      ORDER BY total_hard DESC
      LIMIT 1
    `).get(...params);

    const topGithubStudent = db.prepare(`
      SELECT s.id, s.name, s.branch, pm.github_repos, pm.github_stars
      FROM students s
      JOIN platform_metrics pm ON s.id = pm.student_id
      ${studentFilter} AND pm.platform = 'github'
      ORDER BY (COALESCE(pm.github_stars, 0) * 3 + COALESCE(pm.github_repos, 0)) DESC
      LIMIT 1
    `).get(...params);

    return {
      totalStudents,
      coverage: {
        totalStudents,
        withAnyPlatform: withAnyCount,
        withInitialThree: withThreeCount,
        platformCounts: platformMap,
        coveragePct: Math.round((withAnyCount / totalStudents) * 100)
      },
      problemSolving: {
        totalReported: totalInstitutionalReported,
        avgPerStudent,
        medianPerStudent,
        easy: easyTotal,
        medium: mediumTotal,
        hard: hardTotal
      },
      competitiveProgramming: {
        ratedStudents: ratedCount,
        maxLeetCodeRating: lcMax,
        maxCodeChefRating: ccMax
      },
      activity: {
        active7d,
        active30d,
        active7dPct: Math.round((active7d / totalStudents) * 100),
        active30dPct: Math.round((active30d / totalStudents) * 100)
      },
      platforms: platformSummaries,
      difficulty,
      historicalTrends,
      highlights: {
        topSolved: topSolvedStudent,
        topRating: topRatingStudent,
        topHard: topHardStudent,
        topGithub: topGithubStudent
      }
    };
  }

  getLeaderboards(type = 'total_solved', options = {}) {
    const db = getDb();
    const { branch, batch, semester, limit = 50 } = options;

    let filter = 'WHERE 1=1';
    const params = [];
    if (branch && branch !== 'all') {
      filter += ' AND s.branch = ?';
      params.push(branch);
    }
    if (batch && batch !== 'all') {
      filter += ' AND s.batch = ?';
      params.push(batch);
    }
    if (semester && semester !== 'all') {
      filter += ' AND s.semester = ?';
      params.push(semester);
    }

    let query = '';

    switch (type) {
      case 'easy_solved':
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 SUM(COALESCE(pm.easy_solved, 0)) as metric_value,
                 'Easy Problems Solved' as metric_label
          FROM students s
          JOIN platform_metrics pm ON s.id = pm.student_id
          ${filter}
          GROUP BY s.id
          HAVING metric_value > 0
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;

      case 'medium_solved':
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 SUM(COALESCE(pm.medium_solved, 0)) as metric_value,
                 'Medium Problems Solved' as metric_label
          FROM students s
          JOIN platform_metrics pm ON s.id = pm.student_id
          ${filter}
          GROUP BY s.id
          HAVING metric_value > 0
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;

      case 'hard_solved':
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 SUM(COALESCE(pm.hard_solved, 0)) as metric_value,
                 'Hard Problems Solved' as metric_label
          FROM students s
          JOIN platform_metrics pm ON s.id = pm.student_id
          ${filter}
          GROUP BY s.id
          HAVING metric_value > 0
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;

      case 'cp_rating':
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 MAX(COALESCE(pm.rating, 0)) as metric_value,
                 pm.platform as secondary_info,
                 'Competitive Rating (Max)' as metric_label
          FROM students s
          JOIN platform_metrics pm ON s.id = pm.student_id
          ${filter} AND pm.rating IS NOT NULL AND pm.rating > 0
          GROUP BY s.id
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;

      case 'github_activity':
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 (COALESCE(pm.github_stars, 0) * 3 + COALESCE(pm.github_repos, 0)) as metric_value,
                 pm.github_repos as repos,
                 pm.github_stars as stars,
                 'GitHub Dev Score' as metric_label
          FROM students s
          JOIN platform_metrics pm ON s.id = pm.student_id
          ${filter} AND pm.platform = 'github' AND (pm.github_repos > 0 OR pm.github_stars > 0)
          GROUP BY s.id
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;

      case 'consistency':
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 COUNT(DISTINCT pae.event_date) as metric_value,
                 'Active Days in Observation Period' as metric_label
          FROM students s
          JOIN platform_activity_events pae ON s.id = pae.student_id
          ${filter} AND pae.activity_count > 0
          GROUP BY s.id
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;

      case 'improvement_30d':
        // Calculates delta between earliest and latest snapshot in last 30d
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 (MAX(ms.total_solved) - MIN(ms.total_solved)) as metric_value,
                 'Net Observed Growth (30 Days)' as metric_label
          FROM students s
          JOIN metric_snapshots ms ON s.id = ms.student_id
          ${filter} AND ms.snapshot_date >= date('now', '-30 days')
          GROUP BY s.id
          HAVING metric_value > 0
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;

      case 'total_solved':
      default:
        query = `
          SELECT s.id, s.name, s.branch, s.batch, s.student_id,
                 SUM(COALESCE(pm.total_solved, 0)) as metric_value,
                 'Total Platform Solved' as metric_label
          FROM students s
          JOIN platform_metrics pm ON s.id = pm.student_id
          ${filter}
          GROUP BY s.id
          HAVING metric_value > 0
          ORDER BY metric_value DESC
          LIMIT ?
        `;
        break;
    }

    params.push(limit);
    const rows = db.prepare(query).all(...params);

    // Add rank numbering
    return rows.map((r, idx) => ({
      ...r,
      institutional_rank: idx + 1
    }));
  }

  getSkillsAnalytics() {
    const db = getDb();
    const rows = db.prepare('SELECT topic_stats, top_languages FROM platform_metrics WHERE topic_stats IS NOT NULL OR top_languages IS NOT NULL').all();
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;

    const topicMap = {};
    rows.forEach(r => {
      if (r.topic_stats) {
        try {
          const stats = JSON.parse(r.topic_stats);
          Object.entries(stats).forEach(([topic, count]) => {
            if (!topicMap[topic]) topicMap[topic] = { solved: 0, students: 0 };
            topicMap[topic].solved += Number(count) || 0;
            topicMap[topic].students += 1;
          });
        } catch (e) {}
      }
      if (r.top_languages) {
        try {
          const langs = JSON.parse(r.top_languages);
          if (Array.isArray(langs)) {
            langs.forEach(l => {
              const langTopic = `${l} Programming`;
              if (!topicMap[langTopic]) topicMap[langTopic] = { solved: 0, students: 0 };
              topicMap[langTopic].students += 1;
            });
          }
        } catch (e) {}
      }
    });

    return Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      totalSolved: data.solved,
      activePractitioners: data.students,
      engagementPct: totalStudents > 0 ? Math.round((data.students / totalStudents) * 100) : 0,
      difficultyRatio: { easy: 0, medium: 0, hard: 0 },
      recommendedPractice: data.students < Math.max(1, Math.round(totalStudents * 0.2)) ? 'Recommended Domain for Focus' : 'Consistent Practice'
    }));
  }

  getBranchBatchComparison() {
    const db = getDb();

    const branchQuery = `
      SELECT 
        COALESCE(s.branch, 'Unassigned') as name,
        COUNT(DISTINCT s.id) as student_count,
        SUM(COALESCE(pm.total_solved, 0)) as total_solved,
        ROUND(AVG(COALESCE(pm.total_solved, 0)), 1) as avg_solved,
        MAX(COALESCE(pm.rating, 0)) as max_rating,
        SUM(COALESCE(pm.hard_solved, 0)) as hard_solved
      FROM students s
      LEFT JOIN platform_metrics pm ON s.id = pm.student_id
      GROUP BY s.branch
      ORDER BY total_solved DESC
    `;
    const branches = db.prepare(branchQuery).all();

    const batchQuery = `
      SELECT 
        COALESCE(s.batch, 'Unassigned') as name,
        COUNT(DISTINCT s.id) as student_count,
        SUM(COALESCE(pm.total_solved, 0)) as total_solved,
        ROUND(AVG(COALESCE(pm.total_solved, 0)), 1) as avg_solved,
        MAX(COALESCE(pm.rating, 0)) as max_rating
      FROM students s
      LEFT JOIN platform_metrics pm ON s.id = pm.student_id
      GROUP BY s.batch
      ORDER BY s.batch ASC
    `;
    const batches = db.prepare(batchQuery).all();

    return { branches, batches };
  }
}

module.exports = new AnalyticsService();
