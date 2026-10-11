import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Analytics API
export const getOverviewMetrics = async (params = {}) => {
  const res = await api.get('/analytics/overview', { params });
  return res.data;
};

export const getLeaderboards = async (type = 'total_solved', params = {}) => {
  const res = await api.get('/analytics/leaderboards', { params: { type, ...params } });
  return res.data;
};

export const getSkillsAnalytics = async () => {
  const res = await api.get('/analytics/skills');
  return res.data;
};

export const getBranchBatchAnalytics = async () => {
  const res = await api.get('/analytics/branch-batch');
  return res.data;
};

export const getBenchmarks = async () => {
  const res = await api.get('/analytics/benchmarks');
  return res.data;
};

// Students API
export const getStudents = async (params = {}) => {
  const res = await api.get('/students', { params });
  return res.data;
};

export const getStudentById = async (id) => {
  const res = await api.get(`/students/${id}`);
  return res.data;
};

export const updateStudent = async (id, data) => {
  const res = await api.put(`/students/${id}`, data);
  return res.data;
};

export const deleteStudent = async (id) => {
  const res = await api.delete(`/students/${id}`);
  return res.data;
};

export const syncStudentPlatform = async (id, platform) => {
  const res = await api.post(`/students/${id}/sync/${platform}`);
  return res.data;
};

// Import API
export const previewImport = async (data) => {
  const res = await api.post('/import/preview', data);
  return res.data;
};

export const commitImport = async (payload) => {
  const res = await api.post('/import/commit', payload);
  return res.data;
};

export const getImportTemplate = async () => {
  const res = await api.get('/import/template');
  return res.data;
};

export const getImportHistory = async () => {
  const res = await api.get('/import/history');
  return res.data;
};

export const getCurrentRosterJson = async () => {
  const res = await api.get('/import/current-roster');
  return res.data;
};

export const getSampleFileJson = async () => {
  const res = await api.get('/import/sample-file');
  return res.data;
};

export const getImportFiles = async () => {
  const res = await api.get('/import/files');
  return res.data;
};

export const getImportFileContent = async (filename) => {
  const res = await api.get('/import/file-content', { params: { filename } });
  return res.data;
};

export const saveImportFileJson = async (content, filename) => {
  const res = await api.post('/import/save-file', { content, filename });
  return res.data;
};

// Platforms & Sync API
export const getPlatformsStatus = async () => {
  const res = await api.get('/platforms/status');
  return res.data;
};

export const triggerPlatformSync = async (platform = 'all') => {
  const res = await api.post('/platforms/sync-all', { platform });
  return res.data;
};

export const getSyncJobs = async () => {
  const res = await api.get('/platforms/sync-jobs');
  return res.data;
};

// Settings API
export const getSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSetting = async (key, value) => {
  const res = await api.post('/settings', { key, value });
  return res.data;
};

export const seedDemoDataset = async () => {
  const res = await api.post('/settings/seed-demo');
  return res.data;
};

export const purgeAllData = async () => {
  const res = await api.post('/settings/purge-data');
  return res.data;
};

export const getAuditLogs = async () => {
  const res = await api.get('/settings/audit-logs');
  return res.data;
};

export default api;
