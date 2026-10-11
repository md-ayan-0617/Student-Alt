import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Layers,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSyncJobs, triggerPlatformSync } from '../services/api';

export default function Synchronization() {
  const { showToast } = useApp();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getSyncJobs();
      if (res.success) {
        setJobs(res.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRunSync = async (platform = 'all') => {
    setSyncing(true);
    showToast(`Starting synchronization for ${platform.toUpperCase()}...`, 'info');
    try {
      const res = await triggerPlatformSync(platform);
      if (res.success) {
        showToast(`Sync complete! ${res.result.synced} profiles synced, ${res.result.failed} failed.`, 'success');
        fetchJobs();
      }
    } catch (e) {
      showToast('Sync failed: ' + e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
                Data Synchronization Engine
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Automated Data Synchronization Jobs
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
              Scheduled background sync jobs pulling official statistics across linked platform handles. Creates timestamped metric snapshots to measure historical student improvement.
            </p>
          </div>

          <button
            onClick={() => handleRunSync('all')}
            disabled={syncing}
            className="px-4 py-2.5 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 shrink-0 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sync in Progress...' : 'Run Full Institution Sync'}</span>
          </button>
        </div>
      </div>

      {/* Sync Execution History */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent-blue)]" />
            <span>Recent Synchronization Jobs Log</span>
          </h3>
          <button onClick={fetchJobs} className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Log</span>
          </button>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4">Platform Scope</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Profiles Synced</th>
              <th className="py-2.5 px-4">Failed / Skipped</th>
              <th className="py-2.5 px-4">Execution Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] font-mono">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[var(--text-muted)] font-sans">
                  Loading sync execution records...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[var(--text-muted)] font-sans">
                  No background sync jobs recorded yet. Trigger one above.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-primary)] uppercase">
                    {job.platform}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`badge-base text-[10px] ${
                      job.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : (
                        job.status === 'running' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      )
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold">
                    {job.profiles_synced}
                  </td>
                  <td className="py-2.5 px-4 text-rose-400">
                    {job.profiles_failed}
                  </td>
                  <td className="py-2.5 px-4 text-[var(--text-muted)]">
                    {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
