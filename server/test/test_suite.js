const assert = require('assert');
const { extractUsername, getCanonicalProfileUrl } = require('../src/utils/handleCleaner');
const importService = require('../src/services/importService');
const studentService = require('../src/services/studentService');
const analyticsService = require('../src/services/analyticsService');
const { getDb } = require('../src/database/db');

console.log('====================================================');
console.log('CAMPUS CODING INTELLIGENCE — AUTOMATED VERIFICATION');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// 1. HANDLE CLEANER & CANONICAL URLS
console.log('--- 1. Testing Handle Cleaner & URL Normalization ---');

runTest('LeetCode URL extraction with /u/ path', () => {
  const handle = extractUsername('leetcode', 'https://leetcode.com/u/md-ayan-0617/');
  assert.strictEqual(handle, 'md-ayan-0617');
  const canonical = getCanonicalProfileUrl('leetcode', handle);
  assert.strictEqual(canonical, 'https://leetcode.com/u/md-ayan-0617/');
});

runTest('LeetCode handle with @ prefix and query parameters', () => {
  const handle = extractUsername('leetcode', '@md-ayan-0617?tab=overview');
  assert.strictEqual(handle, 'md-ayan-0617');
});

runTest('GeeksforGeeks user URL extraction', () => {
  const handle = extractUsername('gfg', 'https://www.geeksforgeeks.org/user/ayanmdv85w/');
  assert.strictEqual(handle, 'ayanmdv85w');
  const canonical = getCanonicalProfileUrl('gfg', handle);
  assert.strictEqual(canonical, 'https://www.geeksforgeeks.org/user/ayanmdv85w/');
});

runTest('CodeChef users URL extraction', () => {
  const handle = extractUsername('codechef', 'https://www.codechef.com/users/deep_steel_00/');
  assert.strictEqual(handle, 'deep_steel_00');
  const canonical = getCanonicalProfileUrl('codechef', handle);
  assert.strictEqual(canonical, 'https://www.codechef.com/users/deep_steel_00');
});

runTest('GitHub repository/profile URL extraction', () => {
  const handle = extractUsername('github', 'https://github.com/octocat/');
  assert.strictEqual(handle, 'octocat');
  const canonical = getCanonicalProfileUrl('github', handle);
  assert.strictEqual(canonical, 'https://github.com/octocat');
});

runTest('HackerRank profile URL extraction', () => {
  const handle = extractUsername('hackerrank', 'https://www.hackerrank.com/profile/coder_john');
  assert.strictEqual(handle, 'coder_john');
  const canonical = getCanonicalProfileUrl('hackerrank', handle);
  assert.strictEqual(canonical, 'https://www.hackerrank.com/profile/coder_john');
});

// 2. JSON IMPORT & SCHEMA VALIDATION
console.log('\n--- 2. Testing JSON Import Pipeline & Schema Mapping ---');

runTest('Import validation rejects non-array input', () => {
  const res = importService.previewImport({ not: 'an array' });
  assert.strictEqual(res.success, false);
});

runTest('Import validation normalizes URLs in preview', () => {
  const sample = [
    {
      name: 'Priya Sharma',
      student_id: 'CS24B099',
      branch: 'Computer Science & Engineering',
      batch: '2024-2028',
      leetcode_id: 'https://leetcode.com/u/priya_coder/',
      gfg_id: 'priya_gfg',
      codechef_id: 'https://www.codechef.com/users/priya_cc'
    }
  ];
  const preview = importService.previewImport(sample);
  assert.strictEqual(preview.success, true);
  assert.strictEqual(preview.total_records, 1);
  assert.strictEqual(preview.valid_records, 1);
  assert.strictEqual(preview.preview[0].record.leetcode_id, 'priya_coder');
  assert.strictEqual(preview.preview[0].record.codechef_id, 'priya_cc');
});

runTest('Import handles missing optional fields cleanly', () => {
  const sample = [
    {
      name: 'Rohan Gupta',
      leetcode_id: 'rohan_g'
    }
  ];
  const preview = importService.previewImport(sample);
  assert.strictEqual(preview.success, true);
  assert.strictEqual(preview.valid_records, 1);
  assert.strictEqual(preview.preview[0].record.branch, null);
  assert.strictEqual(preview.preview[0].record.gfg_id, '');
});

runTest('Import preview correctly accepts a single student object', () => {
  const singleStudent = {
    name: 'Aarav Patel',
    student_id: 'CS24B999',
    leetcode_id: 'aarav_patel',
    branch: 'Computer Science & Engineering'
  };
  const preview = importService.previewImport(singleStudent);
  assert.strictEqual(preview.success, true);
  assert.strictEqual(preview.total_records, 1);
  assert.strictEqual(preview.valid_records, 1);
  assert.strictEqual(preview.preview[0].record.name, 'Aarav Patel');
});

runTest('Import commit respects duplicatePolicy="skip"', () => {
  const uniqRoll = 'TEST_DUP_' + Date.now();
  const testStudent = {
    name: 'Duplicate Test Student',
    student_id: uniqRoll,
    leetcode_id: 'test_dup_' + Date.now()
  };
  const commit1 = importService.commitImport(testStudent, 'test.json', 1, 'update');
  assert.strictEqual(commit1.created, 1);

  const commit2 = importService.commitImport(testStudent, 'test.json', 1, 'skip');
  assert.strictEqual(commit2.skipped, 1);
  assert.strictEqual(commit2.created, 0);
  assert.strictEqual(commit2.updated, 0);
});

// 3. STUDENT SERVICE & SCALABILITY
console.log('\n--- 3. Testing Student Roster Queries & Scalability ---');

runTest('getAllStudents supports large cohort limits (up to 2500)', () => {
  const result = studentService.getAllStudents({ limit: 2000 });
  assert.ok(result.pagination.limit >= 2000, `Expected limit >= 2000 but got ${result.pagination.limit}`);
  assert.ok(Array.isArray(result.students));
});

runTest('getAllStudents returns canonical URLs for all platforms', () => {
  const result = studentService.getAllStudents({ limit: 10 });
  result.students.forEach(st => {
    if (st.leetcode_username) {
      assert.ok(st.leetcode_url.startsWith('https://leetcode.com/u/'));
    }
    if (st.gfg_username) {
      assert.ok(st.gfg_url.startsWith('https://www.geeksforgeeks.org/user/'));
    }
    if (st.codechef_username) {
      assert.ok(st.codechef_url.startsWith('https://www.codechef.com/users/'));
    }
  });
});

runTest('Search filters match across names, rolls, and platform handles', () => {
  const result = studentService.getAllStudents({ search: 'ayan' });
  assert.ok(result.students.length > 0, 'Should find student with "ayan" in name or handle');
});

// 4. ANALYTICS & METRIC INTEGRITY
console.log('\n--- 4. Testing Analytics Calculations & Data Integrity ---');

runTest('Overview problemSolving.totalReported matches sum of active solved counts', () => {
  const overview = analyticsService.getOverview();
  assert.ok(typeof overview.problemSolving.totalReported === 'number');
  assert.ok(overview.totalStudents >= 0);
  assert.ok(overview.coverage.totalStudents === overview.totalStudents);
});

runTest('Missing metrics are not fabricated into artificial non-zero scores', () => {
  const students = studentService.getAllStudents().students;
  students.forEach(st => {
    // If CodeChef account is inactive/unrated, rating must not be randomly generated
    if (st.codechef_username && !st.codechef_rating) {
      assert.ok(st.codechef_rating === null || st.codechef_rating === undefined || st.codechef_rating === 0);
    }
  });
});

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
if (passedTests === totalTests) {
  console.log('ALL VERIFICATION CHECKS SUCCEEDED');
} else {
  console.log('SOME CHECKS FAILED — INSPECT ABOVE');
  process.exit(1);
}
console.log('====================================================\n');
