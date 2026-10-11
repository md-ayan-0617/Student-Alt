const axios = require('axios');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class CodeChefAdapter {
  constructor(config = {}) {
    this.name = 'CodeChef';
    this.timeout = config.timeout || 10000;
  }

  validateIdentifier(username) {
    if (!username || typeof username !== 'string') return false;
    const clean = extractUsername('codechef', username);
    return /^[a-zA-Z0-9_]{2,40}$/.test(clean);
  }

  async fetchProfile(input) {
    const username = extractUsername('codechef', input);
    if (!this.validateIdentifier(username)) {
      return { success: false, error: 'Invalid CodeChef handle format', code: 'INVALID_ID' };
    }

    try {
      const profileUrl = getCanonicalProfileUrl('codechef', username);
      const response = await axios.get(profileUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const html = response.data;

      // Check if user exists on CodeChef
      if (!html || (!html.includes('user-details-container') && !html.includes('rating-header') && !html.includes('Problems Solved'))) {
        return {
          success: false,
          error: `CodeChef profile "${username}" not found or inactive`,
          code: 'USER_NOT_FOUND'
        };
      }

      // Check if 404 page content
      if (html.includes('Page Not Found') || html.includes('404 - Not Found')) {
        return {
          success: false,
          error: `CodeChef profile "${username}" not found`,
          code: 'USER_NOT_FOUND'
        };
      }

      // Rating: <div class="rating-number">3355</div>
      const ratingMatch = html.match(/<div class="rating-number">([\s\S]*?)<\/div>/i);
      let rating = null;
      if (ratingMatch) {
        const cleanRating = ratingMatch[1].replace(/<[^>]+>/g, '').trim();
        if (cleanRating && !isNaN(Number(cleanRating))) {
          rating = parseInt(cleanRating, 10);
        }
      }

      // Stars
      const starMatch = html.match(/class="rating-star">([\s\S]*?)<\/span>/i);
      let stars = null;
      if (starMatch) {
        const starCount = (starMatch[1].match(/&#9733;/g) || starMatch[1].match(/★/g) || []).length;
        if (starCount > 0) {
          stars = `${starCount}★`;
        }
      }
      if (!stars) {
        const starTextMatch = html.match(/<span class="rating">([^<]+)<\/span>/i);
        if (starTextMatch) {
          stars = starTextMatch[1].trim();
        }
      }

      // Global & Country Rank
      let globalRank = null;
      let countryRank = null;
      const grMatch = html.match(/<strong class='global-rank'>([\s\S]*?)<\/strong>/i) ||
                      html.match(/<strong>(\d+)<\/strong>\s*<small>Global Rank<\/small>/i) ||
                      html.match(/<a[^>]*href="[^"]*ratings\/all[^"]*"[^>]*>[\s\S]*?<strong>(\d+)<\/strong>[\s\S]*?Global Rank/i);
      if (grMatch) {
        const grVal = (grMatch[1] || '').trim();
        if (grVal && !isNaN(Number(grVal))) globalRank = parseInt(grVal, 10);
      }

      const crMatch = html.match(/<strong class='country-rank'>([\s\S]*?)<\/strong>/i) ||
                      html.match(/<strong>(\d+)<\/strong>\s*<small>Country Rank<\/small>/i) ||
                      html.match(/<a[^>]*href="[^"]*ratings\/country[^"]*"[^>]*>[\s\S]*?<strong>(\d+)<\/strong>[\s\S]*?Country Rank/i);
      if (crMatch) {
        const crVal = (crMatch[1] || '').trim();
        if (crVal && !isNaN(Number(crVal))) countryRank = parseInt(crVal, 10);
      }

      // Total Solved
      let totalSolved = 0;
      const solvedMatch = html.match(/<h3>Total Problems Solved:\s*(\d+)<\/h3>/i) ||
                          html.match(/Fully Solved\s*\(\s*(\d+)\s*\)/i);
      if (solvedMatch) {
        totalSolved = parseInt(solvedMatch[1], 10);
      }

      return {
        success: true,
        platform: 'codechef',
        username,
        profile_url: profileUrl,
        metrics: {
          rating,
          stars,
          global_rank: globalRank,
          country_rank: countryRank,
          total_solved: totalSolved,
          contests_attended: null
        },
        raw: {
          rating,
          stars,
          global_rank: globalRank,
          country_rank: countryRank,
          total_solved: totalSolved
        }
      };
    } catch (err) {
      if (err.response?.status === 404) {
        return { success: false, error: `CodeChef user "${username}" not found`, code: 'USER_NOT_FOUND' };
      }
      return {
        success: false,
        error: err.message || 'CodeChef connection error',
        code: 'NETWORK_ERROR'
      };
    }
  }
}

module.exports = new CodeChefAdapter();
