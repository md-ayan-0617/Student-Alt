const axios = require('axios');
const { extractUsername, getCanonicalProfileUrl } = require('../utils/handleCleaner');

class GitHubAdapter {
  constructor(config = {}) {
    this.name = 'GitHub';
    this.timeout = config.timeout || 10000;
  }

  validateIdentifier(username) {
    if (!username || typeof username !== 'string') return false;
    const clean = extractUsername('github', username);
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(clean);
  }

  async fetchProfile(input, token = null) {
    const username = extractUsername('github', input);
    if (!this.validateIdentifier(username)) {
      return { success: false, error: 'Invalid GitHub handle format', code: 'INVALID_ID' };
    }

    try {
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CampusCodingIntelligence/1.0 (Mozilla/5.0 compatible)'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch user profile
      const userRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers,
        timeout: this.timeout
      });

      const user = userRes.data;

      // Fetch public repos for languages and star distribution (up to 30 recent)
      let repos = [];
      let totalStars = 0;
      let languageCounts = {};

      try {
        const repoRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`, {
          headers,
          timeout: this.timeout
        });
        repos = repoRes.data || [];
        repos.forEach(repo => {
          totalStars += (repo.stargazers_count || 0);
          if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
          }
        });
      } catch (repoErr) {
        // Continue with basic user info if repos rate-limited or failed
      }

      const topLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang);

      return {
        success: true,
        platform: 'github',
        username: user.login,
        profile_url: getCanonicalProfileUrl('github', user.login),
        metrics: {
          github_repos: user.public_repos || 0,
          github_stars: totalStars,
          github_commits_year: null,
          github_prs: null,
          top_languages: topLanguages,
          followers: user.followers || 0
        },
        raw: {
          avatar_url: user.avatar_url,
          bio: user.bio,
          public_gists: user.public_gists
        }
      };
    } catch (err) {
      if (err.response?.status === 404) {
        return { success: false, error: `GitHub user "${username}" not found`, code: 'USER_NOT_FOUND' };
      }
      if (err.response?.status === 403) {
        return { success: false, error: 'GitHub API rate limit exceeded. Configure personal token in settings.', code: 'RATE_LIMIT' };
      }
      return { success: false, error: err.message || 'GitHub connection error', code: 'NETWORK_ERROR' };
    }
  }
}

module.exports = new GitHubAdapter();
