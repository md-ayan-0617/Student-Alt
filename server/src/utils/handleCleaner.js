/**
 * Normalizes user input across all coding platforms.
 * Extracts the clean username / handle whether the input is:
 * - A raw handle: "username"
 * - An at-handle: "@username"
 * - A full profile URL: "https://leetcode.com/u/username/"
 * - A domain-only URL: "geeksforgeeks.org/user/username?tab=recent"
 * - Trailing slashes, query params, hashes, whitespace.
 */
function extractUsername(platform, input) {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim();
  if (!clean) return '';

  // Remove leading @
  if (clean.startsWith('@')) {
    clean = clean.substring(1).trim();
  }

  // Remove query string and hash fragments if present
  clean = clean.split('?')[0].split('#')[0].trim();

  // If it looks like a URL or contains domain/slashes
  if (clean.includes('/') || clean.includes('.com') || clean.includes('.org') || clean.startsWith('http')) {
    try {
      const urlStr = clean.startsWith('http://') || clean.startsWith('https://') 
        ? clean 
        : `https://${clean}`;
      const url = new URL(urlStr);
      let pathname = url.pathname.replace(/\/+$/, ''); // remove trailing slashes
      const segments = pathname.split('/').filter(Boolean);

      if (segments.length === 0) return '';

      const plat = (platform || '').toLowerCase();

      if (plat === 'gfg' || plat === 'geeksforgeeks') {
        // e.g. /user/username or /profile/username
        if (segments[0] === 'user' || segments[0] === 'profile') {
          return segments[1] || segments[0];
        }
        return segments[segments.length - 1];
      }

      if (plat === 'codechef') {
        // e.g. /users/username
        if (segments[0] === 'users') {
          return segments[1] || segments[0];
        }
        return segments[segments.length - 1];
      }

      if (plat === 'hackerrank') {
        // e.g. /profile/username or /rest/hackers/username
        if (segments[0] === 'profile') {
          return segments[1] || segments[0];
        }
        if (segments.length >= 3 && segments[0] === 'rest' && segments[1] === 'hackers') {
          return segments[2];
        }
        return segments[segments.length - 1];
      }

      if (plat === 'leetcode') {
        // e.g. /u/username or /username
        if (segments[0] === 'u') {
          return segments[1] || segments[0];
        }
        return segments[segments.length - 1];
      }

      if (plat === 'github') {
        return segments[segments.length - 1];
      }

      return segments[segments.length - 1];
    } catch (e) {
      // Fallback regex if URL parse fails
      const parts = clean.split('/').filter(Boolean);
      return parts[parts.length - 1] || clean;
    }
  }

  return clean;
}

/**
 * Returns canonical verified public profile URL for a given platform & handle.
 */
function getCanonicalProfileUrl(platform, handle) {
  const clean = extractUsername(platform, handle);
  if (!clean) return null;
  const plat = (platform || '').toLowerCase();
  switch (plat) {
    case 'leetcode':
      return `https://leetcode.com/u/${clean}/`;
    case 'gfg':
    case 'geeksforgeeks':
      return `https://www.geeksforgeeks.org/user/${clean}/`;
    case 'codechef':
      return `https://www.codechef.com/users/${clean}`;
    case 'github':
      return `https://github.com/${clean}`;
    case 'hackerrank':
      return `https://www.hackerrank.com/profile/${clean}`;
    default:
      return null;
  }
}

module.exports = { extractUsername, getCanonicalProfileUrl };
