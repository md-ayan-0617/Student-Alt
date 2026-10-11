import React, { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOverviewMetrics } from '../services/api';
import KpiCard from '../components/cards/KpiCard';
import DifficultyCard from '../components/cards/DifficultyCard';
import HistoricalTrendChart from '../components/charts/HistoricalTrendChart';

export default function ProblemSolving() {
  const { filters } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, [filters.branch, filters.batch, filters.timeRange]);

  const ps = data?.problemSolving || {};
  const diff = data?.difficulty || {};

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Volume & Complexity Analysis
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Problem-Solving Volume & Difficulty Progression
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Institutional aggregation of Easy, Medium, and Hard solved questions. Problem complexity is calibrated to official platform definitions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Solved (Platform Reported)"
          value={ps.totalReported?.toLocaleString() || 0}
          subvalue={`Across all active platforms`}
          icon={Code2}
          badgeText="Verified Solved"
        />
        <KpiCard
          title="Average per Student"
          value={ps.avgPerStudent || 0}
          subvalue={`Median: ${ps.medianPerStudent || 0} solved`}
          icon={Award}
          badgeText="Cohort Mean"
        />
        <KpiCard
          title="Medium Problems"
          value={diff.medium?.toLocaleString() || 0}
          subvalue={`${diff.mediumPct}% intermediate mix`}
          icon={TrendingUp}
          badgeText="Target Complexity"
          badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
        />
        <KpiCard
          title="Hard Problems"
          value={diff.hard?.toLocaleString() || 0}
          subvalue={`${diff.hardPct}% high difficulty`}
          icon={Award}
          badgeText="Elite Solved"
          badgeColor="text-rose-400 bg-rose-500/10 border-rose-500/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Historical Problem-Solving Trajectory
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Accumulated observed solved volume across historical snapshot points
            </p>
          </div>
          <HistoricalTrendChart data={data?.historicalTrends || []} />
        </div>

        <div>
          <DifficultyCard difficulty={diff} />
        </div>
      </div>
    </div>
  );
}
