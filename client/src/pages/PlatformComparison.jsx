import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCompare,
  Code2,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOverviewMetrics, getPlatformsStatus } from '../services/api';
import PlatformDistributionChart from '../components/charts/PlatformDistributionChart';

export default function PlatformComparison() {
  const { filters } = useApp();
  const [data, setData] = useState(null);
  const [platformsStatus, setPlatformsStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ovRes, plRes] = await Promise.all([
          getOverviewMetrics({ branch: filters.branch, batch: filters.batch, timeRange: filters.timeRange }),
          getPlatformsStatus()
        ]);
        if (ovRes.success) setData(ovRes.data);
        if (plRes.success) setPlatformsStatus(plRes.platforms || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.branch, filters.batch, filters.timeRange]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Cross-Platform Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Coding Platform Comparison & Metric Integrity
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Side-by-side analysis of supported platforms. LeetCode ratings, CodeChef stars, and GitHub development contributions are treated as independent domains and never summed together into misleading composites.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="card-base p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Platform Adoption vs Verification Status
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Linked accounts in master roster compared against verified platform responses
          </p>
        </div>
        <PlatformDistributionChart platforms={data?.platforms || []} />
      </div>

      {/* Detailed Side-by-Side Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(platformsStatus || []).map((pl) => (
          <div key={pl.id} className="card-base p-5 space-y-4 hover:border-[var(--border-color)]/80 transition-all">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{pl.name}</h3>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{pl.accessMethod}</span>
              </div>
              <span className="badge-base bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
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
                <span className="text-[var(--text-muted)]">Auth Required:</span>
                <span className="font-mono text-[var(--text-secondary)]">{pl.authRequired ? 'Yes' : 'Public / None'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-color)]/50 space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                Supported Metrics:
              </span>
              <div className="flex flex-wrap gap-1">
                {(pl.metricsAvailable || []).map((m, mIdx) => (
                  <span
                    key={mIdx}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link
                to={`/platforms/${pl.id}`}
                className="w-full py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View {pl.name} Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
