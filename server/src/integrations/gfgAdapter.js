const axios = require('axios');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class GFGAdapter {
  constructor(config = {}) {
    this.name = 'GeeksforGeeks';
    this.timeout = config.timeout || 10000;
  }

  validateIdentifier(username) {
    if (!username || typeof username !== 'string') return false;
    const clean = extractUsername('gfg', username);
    return /^[a-zA-Z0-9_-]{2,50}$/.test(clean);
  }

  async fetchProfile(input) {
    const username = extractUsername('gfg', input);
    if (!this.validateIdentifier(username)) {
      return { success: false, error: 'Invalid GeeksforGeeks handle format', code: 'INVALID_ID' };
    }

    try {
      // Direct official public profile fetch
      const profileUrl = getCanonicalProfileUrl('gfg', username);
      const response = await axios.get(profileUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://www.geeksforgeeks.org/'
        }
      });

      const html = response.data;

      // Check if user exists on GFG
      if (!html || !html.includes('total_problems_solved') || html.includes('undefined   | GeeksforGeeks Profile')) {
        return {
          success: false,
          error: `GeeksforGeeks profile "${username}" not found or has no activity`,
          code: 'USER_NOT_FOUND'
        };
      }

      // Extract metrics with regex supporting escaped JSON in Next.js script tags
      const totalSolvedMatch = html.match(/\\?"total_problems_solved\\?"\s*:\s*(\d+)/i);
      const scoreMatch = html.match(/\\?"score\\?"\s*:\s*(\d+)/i);
      const instituteRankMatch = html.match(/\\?"institute_rank\\?"\s*:\s*(\\?"[^"\\]*\\?"|\d+)/i);
      const streakMatch = html.match(/\\?"pod_solved_longest_streak\\?"\s*:\s*(\d+)/i);

      const totalSolved = totalSolvedMatch ? parseInt(totalSolvedMatch[1], 10) : 0;
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      
      let instituteRank = null;
      if (instituteRankMatch) {
        const rawRank = instituteRankMatch[1].replace(/\\|"/g, '').trim();
        if (rawRank && !isNaN(Number(rawRank))) {
          instituteRank = parseInt(rawRank, 10);
        }
      }

      const streak = streakMatch ? parseInt(streakMatch[1], 10) : null;

      return {
        success: true,
        platform: 'gfg',
        username,
        profile_url: profileUrl,
        metrics: {
          total_solved: totalSolved,
          coding_score: score,
          institutional_rank: instituteRank,
          global_rank: null,
          easy_solved: null, // GFG public overview does not report difficulty breakdown
          medium_solved: null,
          hard_solved: null,
          topic_stats: null,
          streak
        },
        raw: {
          total_problems_solved: totalSolved,
          score,
          institute_rank: instituteRank,
          streak
        }
      };
    } catch (err) {
      if (err.response?.status === 404) {
        return { success: false, error: `GeeksforGeeks profile "${username}" not found`, code: 'USER_NOT_FOUND' };
      }
      return {
        success: false,
        error: err.message || 'GeeksforGeeks connection error',
        code: 'NETWORK_ERROR'
      };
    }
  }
}

module.exports = new GFGAdapter();
