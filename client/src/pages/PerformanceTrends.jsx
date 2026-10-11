import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOverviewMetrics } from '../services/api';
import HistoricalTrendChart from '../components/charts/HistoricalTrendChart';

export default function PerformanceTrends() {
  const { filters } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const res = await getOverviewMetrics({
          branch: filters.branch,
          batch: filters.batch,
          timeRange: filters.timeRange
        });
        if (res.success) setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [filters.branch, filters.batch, filters.timeRange]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Longitudinal Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Historical Performance & Snapshot Trends
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Longitudinal trend observation powered by timestamped database snapshots. Tracks observed rate of problem resolution and rating changes.
          </p>
        </div>
      </div>

      <div className="card-base p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Longitudinal Snapshot Observations
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Verified metric snapshots recorded at timestamped intervals
          </p>
        </div>
        <HistoricalTrendChart data={data?.historicalTrends || []} />
      </div>
    </div>
  );
}
