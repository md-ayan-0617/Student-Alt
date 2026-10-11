const axios = require('axios');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class LeetCodeAdapter {
  constructor(config = {}) {
    this.name = 'LeetCode';
    this.timeout = config.timeout || 10000;
  }

  validateIdentifier(username) {
    if (!username || typeof username !== 'string') return false;
    const clean = extractUsername('leetcode', username);
    // LeetCode usernames: alphanumeric, hyphens, underscores, length 3-30
    return /^[a-zA-Z0-9_-]{2,40}$/.test(clean);
  }

  async fetchProfile(input) {
    const username = extractUsername('leetcode', input);
    if (!this.validateIdentifier(username)) {
      return { success: false, error: 'Invalid LeetCode identifier or URL format', code: 'INVALID_ID' };
    }

    try {
      // Official GraphQL public query endpoint
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            profile {
              ranking
              reputation
              userAvatar
            }
          }
          userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            topPercentage
          }
        }
      `;

      const response = await axios.post(
        'https://leetcode.com/graphql',
        { query, variables: { username } },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://leetcode.com/u/${username}/`
          },
          timeout: this.timeout
        }
      );

      if (response.data && response.data.data && response.data.data.matchedUser) {
        const user = response.data.data.matchedUser;
        const contest = response.data.data.userContestRanking || {};
        const acStats = user.submitStats?.acSubmissionNum || [];

        let total = 0, easy = 0, medium = 0, hard = 0;
        acStats.forEach(item => {
          if (item.difficulty === 'All') total = item.count;
          if (item.difficulty === 'Easy') easy = item.count;
          if (item.difficulty === 'Medium') medium = item.count;
          if (item.difficulty === 'Hard') hard = item.count;
        });

        return {
          success: true,
          platform: 'leetcode',
          username: user.username,
          profile_url: getCanonicalProfileUrl('leetcode', user.username),
          metrics: {
            total_solved: total,
            easy_solved: easy,
            medium_solved: medium,
            hard_solved: hard,
            rating: contest.rating ? Math.round(contest.rating) : null,
            global_rank: contest.globalRanking || user.profile?.ranking || null,
            contests_attended: contest.attendedContestsCount || 0,
            acceptance_rate: null
          },
          raw: response.data.data
        };
      }

      return {
        success: false,
        error: `LeetCode user profile "${username}" not found or private`,
        code: 'USER_NOT_FOUND'
      };
    } catch (err) {
      if (err.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded on LeetCode API. Please wait a few moments.',
          code: 'RATE_LIMIT'
        };
      }
      return {
        success: false,
        error: err.message || 'LeetCode connection error',
        code: 'NETWORK_ERROR'
      };
    }
  }
}

module.exports = new LeetCodeAdapter();
