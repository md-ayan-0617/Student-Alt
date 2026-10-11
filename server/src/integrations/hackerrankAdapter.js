const axios = require('axios');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class HackerRankAdapter {
  constructor(config = {}) {
    this.name = 'HackerRank';
    this.timeout = config.timeout || 10000;
  }

  validateIdentifier(username) {
    if (!username || typeof username !== 'string') return false;
    const clean = extractUsername('hackerrank', username);
    return /^[a-zA-Z0-9_-]{2,50}$/.test(clean);
  }

  async fetchProfile(input) {
    const username = extractUsername('hackerrank', input);
    if (!this.validateIdentifier(username)) {
      return { success: false, error: 'Invalid HackerRank username format', code: 'INVALID_ID' };
    }

    try {
      const profileUrl = getCanonicalProfileUrl('hackerrank', username);
      const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/scores_elo`, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Compute total practice points and active tracks
        let totalScore = 0;
        let activeTracks = 0;
        response.data.forEach(item => {
          if (item.practice?.score) {
            totalScore += Number(item.practice.score) || 0;
          }
          if (item.contest?.score) {
            totalScore += Number(item.contest.score) || 0;
          }
          if ((item.practice?.score > 0) || (item.contest?.score > 0)) {
            activeTracks++;
          }
        });

        return {
          success: true,
          platform: 'hackerrank',
          username,
          profile_url: profileUrl,
          metrics: {
            badges_count: response.data.length,
            active_tracks: activeTracks,
            total_score: totalScore,
            total_solved: null, // HackerRank does not disclose combined solved count publicly
            rating: null
          },
          raw: response.data
        };
      }

      return { success: false, error: `HackerRank profile "${username}" not found or has no activity`, code: 'USER_NOT_FOUND' };
    } catch (err) {
      if (err.response?.status === 404) {
        return { success: false, error: `HackerRank profile "${username}" not found`, code: 'USER_NOT_FOUND' };
      }
      return {
        success: false,
        error: err.message || 'HackerRank connection error',
        code: 'NETWORK_ERROR'
      };
    }
  }
}

module.exports = new HackerRankAdapter();
