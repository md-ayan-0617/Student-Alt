import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Settings2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPlatformsStatus, triggerPlatformSync } from '../services/api';

export default function Integrations() {
  const { showToast } = useApp();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await getPlatformsStatus();
      if (res.success) {
        setPlatforms(res.platforms || []);
      }
    } catch (e) {
      showToast('Error loading connector status: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSyncPlatform = async (platformId) => {
    setSyncingId(platformId);
    try {
      const res = await triggerPlatformSync(platformId);
      if (res.success) {
        showToast(`Sync completed for ${platformId.toUpperCase()}: ${res.result.synced} accounts updated.`, 'success');
        fetchStatus();
      }
    } catch (e) {
      showToast('Sync trigger failed: ' + e.message, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Platform Adapters
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Coding Platform Connectors & API Health
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Multi-platform connector architecture adhering to official service terms, rate limits, and authorized data extraction methods. Credentials remain securely encapsulated on the backend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((pl) => {
          const isSyncing = syncingId === pl.id;

          return (
            <div key={pl.id} className="card-base p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{pl.name}</h3>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{pl.accessMethod}</span>
                  </div>
                  <span className="badge-base bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                    {pl.connectionStatus}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Connected Students:</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{pl.connectedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Rate Limit:</span>
                    <span className="font-mono text-[var(--accent-teal)]">{pl.rateLimit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Authentication:</span>
                    <span className="font-mono text-[var(--text-secondary)]">
                      {pl.authRequired ? 'Authorized Token' : 'Public API / Consent'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Last Verified Sync:</span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {pl.lastSync ? new Date(pl.lastSync).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)]/50 space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                    Available Verified Metrics:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(pl.metricsAvailable || []).map((m, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)] text-emerald-400">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1 space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                    Unsupported / Private Metrics:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(pl.unsupportedMetrics || []).map((m, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-muted)]">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => handleSyncPlatform(pl.id)}
                  disabled={isSyncing}
                  className="w-full py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[var(--accent-blue)]' : ''}`} />
                  <span>{isSyncing ? `Syncing ${pl.name}...` : `Run Connector Sync`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
