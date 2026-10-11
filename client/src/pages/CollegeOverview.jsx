import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Code2,
  Trophy,
  Flame,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOverviewMetrics } from '../services/api';
import KpiCard from '../components/cards/KpiCard';
import DifficultyCard from '../components/cards/DifficultyCard';
import HistoricalTrendChart from '../components/charts/HistoricalTrendChart';
import PlatformDistributionChart from '../components/charts/PlatformDistributionChart';

export default function CollegeOverview() {
  const { filters } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOverviewMetrics({
        branch: filters.branch,
        batch: filters.batch,
        timeRange: filters.timeRange
      });
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch overview metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [filters.branch, filters.batch, filters.timeRange]);

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-28 bg-[var(--surface-elevated)] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-[var(--surface-elevated)] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-[var(--surface-elevated)] rounded-xl" />
          <div className="h-72 bg-[var(--surface-elevated)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card-base p-6 border-rose-500/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Analytics Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const cov = data?.coverage || {};
  const ps = data?.problemSolving || {};
  const act = data?.activity || {};
  const cp = data?.competitiveProgramming || {};
  const diff = data?.difficulty || {};
  const highlights = data?.highlights || {};

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Institutional Headline Banner */}
      <div className="card-base p-5 lg:p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)] border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
                Institutional Analytics Executive Brief
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {filters.timeRange.toUpperCase()} Window
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Campus Programming Intelligence Overview
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
              Multi-platform tracking of competitive programming ratings, algorithmic consistency, difficulty progression, and GitHub development engagement across all academic departments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/students"
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>Student Directory</span>
            </Link>
            <Link
              to="/import"
              className="px-3.5 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-medium hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              <span>Import Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 1: Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Student Coverage"
          value={data?.totalStudents || 0}
          subvalue={`${cov.withAnyPlatform || 0} linked (${cov.coveragePct || 0}%)`}
          delta={`${cov.withInitialThree || 0} with all 3 identifiers`}
          deltaType="neutral"
          icon={Users}
          badgeText="Verified Master"
        />

        <KpiCard
          title="Problems Solved"
          value={ps.totalReported?.toLocaleString() || 0}
          subvalue={`Avg: ${ps.avgPerStudent || 0} | Median: ${ps.medianPerStudent || 0}`}
          delta="Platform Reported"
          deltaType="positive"
          icon={Code2}
          badgeText="Combined Total"
          badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
        />

        <KpiCard
          title="Active Students (30D)"
          value={act.active30d || 0}
          subvalue={`7-Day Active: ${act.active7d || 0} students`}
          delta={`${act.active30dPct || 0}% activity rate`}
          deltaType="positive"
          icon={Flame}
          badgeText="Verified Active"
          badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
        />

        <KpiCard
          title="Peak CP Rating"
          value={cp.maxLeetCodeRating || cp.maxCodeChefRating || '—'}
          subvalue={`${cp.ratedStudents || 0} rated competitors`}
          delta={cp.maxLeetCodeRating ? `LC: ${cp.maxLeetCodeRating}` : (cp.maxCodeChefRating ? `CC: ${cp.maxCodeChefRating}` : 'Unrated')}
          deltaType="positive"
          icon={Trophy}
          badgeText="Contest Peak"
          badgeColor="text-purple-400 bg-purple-500/10 border-purple-500/30"
        />
      </div>

      {/* Row 2: Charts (Historical Snapshots & Difficulty Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Snapshots Chart */}
        <div className="lg:col-span-2 card-base p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Observed Problem-Solving Growth (Historical Snapshots)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Measured differences between recorded timestamped observations (no synthetic interpolation)
              </p>
            </div>
            <Link to="/trends" className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1">
              <span>View Trends</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <HistoricalTrendChart data={data?.historicalTrends || []} />
        </div>

        {/* Difficulty Breakdown Progression Card */}
        <div className="flex flex-col gap-4">
          <DifficultyCard difficulty={diff} />

          {/* Quick Institutional Integrity Note */}
          <div className="card-base p-4 bg-[var(--surface-elevated)]/40 text-xs text-[var(--text-secondary)] space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)] text-xs">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-teal)]" />
              <span>Institutional Metric Integrity</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              All metrics strictly separate platform-reported totals from unique cross-platform counts. Unsupported or private profiles are displayed as unverified, never assumed as zero.
            </p>
          </div>
        </div>
      </div>

      {/* Row 3: Platform Comparison & Adoption Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Platform Adoption & Verification
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Comparison of linked handles versus verified and synchronized accounts
              </p>
            </div>
            <Link to="/platforms" className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1">
              <span>Full Comparison</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <PlatformDistributionChart platforms={data?.platforms || []} />
        </div>

        {/* Platform Summary Pills */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Platform Breakdown
          </div>
          {(data?.platforms || []).map((p) => (
            <div
              key={p.platform}
              className="card-base p-3.5 hover:border-[var(--accent-blue)] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {p.accountsLinked} linked ({p.coveragePct}%)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                  {p.totalSolved !== null ? `${p.totalSolved.toLocaleString()} solved` : `${p.reposCount || 0} repos`}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  {p.accountsVerified} verified
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Student Highlights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Departmental Leaders & Student Highlights
          </div>
          <Link to="/leaderboards" className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1">
            <span>Explore All 10 Leaderboards</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Top Solved */}
          {highlights.topSolved && (
            <Link
              to={`/students/${highlights.topSolved.id}`}
              className="card-base p-4 hover:border-[var(--accent-blue)] transition-all group block"
            >
              <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--accent-teal)] mb-1">
                Most Problems Solved
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                {highlights.topSolved.name}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate mb-2">
                {highlights.topSolved.branch}
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {highlights.topSolved.total?.toLocaleString()} Solved
              </div>
            </Link>
          )}

          {/* Top Rating */}
          {highlights.topRating && (
            <Link
              to={`/students/${highlights.topRating.id}`}
              className="card-base p-4 hover:border-[var(--accent-blue)] transition-all group block"
            >
              <div className="text-[10px] uppercase font-mono tracking-wider text-purple-400 mb-1">
                Highest CP Rating
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                {highlights.topRating.name}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate mb-2">
                {highlights.topRating.branch}
              </div>
              <div className="text-lg font-mono font-bold text-purple-400">
                {highlights.topRating.rating} Rating ({highlights.topRating.platform?.toUpperCase()})
              </div>
            </Link>
          )}

          {/* Top Hard Problems */}
          {highlights.topHard && (
            <Link
              to={`/students/${highlights.topHard.id}`}
              className="card-base p-4 hover:border-[var(--accent-blue)] transition-all group block"
            >
              <div className="text-[10px] uppercase font-mono tracking-wider text-rose-400 mb-1">
                Hard Problems Leader
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                {highlights.topHard.name}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate mb-2">
                {highlights.topHard.branch}
              </div>
              <div className="text-lg font-mono font-bold text-rose-400">
                {highlights.topHard.total_hard?.toLocaleString()} Hard Solved
              </div>
            </Link>
          )}

          {/* Top GitHub */}
          {highlights.topGithub && (
            <Link
              to={`/students/${highlights.topGithub.id}`}
              className="card-base p-4 hover:border-[var(--accent-blue)] transition-all group block"
            >
              <div className="text-[10px] uppercase font-mono tracking-wider text-blue-400 mb-1">
                GitHub Dev Champion
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                {highlights.topGithub.name}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate mb-2">
                {highlights.topGithub.branch}
              </div>
              <div className="text-lg font-mono font-bold text-blue-400">
                {highlights.topGithub.github_repos} Repos | {highlights.topGithub.github_stars}★
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
