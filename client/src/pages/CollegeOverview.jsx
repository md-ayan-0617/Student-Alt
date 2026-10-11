import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Code2,
  Trophy,
  Flame,
  CheckCircle2,
  GitCompare,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  GitBranch,
  Star,
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOverviewMetrics } from '../services/api';
import KpiCard from '../components/cards/KpiCard';
import DifficultyCard from '../components/cards/DifficultyCard';
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
        semester: filters.semester,
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
  }, [filters.branch, filters.batch, filters.semester, filters.timeRange]);

  if (loading && !data) {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-pulse">
        <div className="h-28 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-color)]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-color)]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-color)]" />
          <div className="h-72 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-color)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="card-base p-8 text-center space-y-3 max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-[var(--brand-primary)] mx-auto" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Analytics Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-95"
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
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* =========================================================================
          SECTION 1: Filtered Cohort Scope Header
          ========================================================================= */}
      <div className="card-base p-5 lg:p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-tint)] px-2 py-0.5 rounded border border-[var(--brand-border)] font-semibold">
                Cohort Intelligence Scope
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {filters.branch === 'all' ? 'All Departments' : filters.branch} • {filters.batch === 'all' ? 'All Batches' : filters.batch}
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Student Coding Profiles & Global Standings
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Granular individual analytics tracking verified LeetCode, CodeChef, GeeksforGeeks, and GitHub profiles. Focuses on individual student achievements, head-to-head comparisons, and verified platform standings.
            </p>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              to="/student-comparison"
              className="px-3.5 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-xs"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Students</span>
            </Link>
            <Link
              to="/rankings"
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Platform Rankings</span>
            </Link>
            <Link
              to="/students"
              className="px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: Individual-First Analytical KPI Cards
          (No misleading college-wide sums; focuses on monitored students & top talent)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Cohort Size & Link Coverage */}
        <KpiCard
          title="Monitored Students"
          value={data?.totalStudents || 0}
          subvalue={`${cov.withInitialThree || 0} fully connected with 3+ platforms`}
          delta={`${cov.coveragePct || 0}% platform coverage`}
          deltaType="neutral"
          icon={Users}
          badgeText="Verified Cohort"
        />

        {/* Peak Contest Competitor (Individual rating leader) */}
        <KpiCard
          title="Peak Contest Rating"
          value={cp.maxLeetCodeRating || cp.maxCodeChefRating || '—'}
          subvalue={highlights.topRating?.name ? `${highlights.topRating.name} (${highlights.topRating.branch?.split(' ')[0] || 'Eng'})` : 'No rated competitors'}
          delta={`${cp.ratedStudents || 0} active contest competitors`}
          deltaType="positive"
          icon={Trophy}
          badgeText="CP Leader"
          badgeColor="text-purple-600 bg-purple-500/10 border-purple-500/20"
        />

        {/* Top Problem Solver (Individual lead) */}
        <KpiCard
          title="Top Problem Solver"
          value={highlights.topSolved?.total?.toLocaleString() || '0'}
          subvalue={highlights.topSolved?.name ? `${highlights.topSolved.name} (${highlights.topSolved.branch?.split(' ')[0] || 'Eng'})` : 'No solved records'}
          delta={`${act.active30d || 0} active in last 30d`}
          deltaType="positive"
          icon={Flame}
          badgeText="Most Solved"
          badgeColor="text-amber-600 bg-amber-500/10 border-amber-500/20"
        />

        {/* GitHub Open-Source Dev Engagement */}
        <KpiCard
          title="Top GitHub Developer"
          value={highlights.topGithub ? `${highlights.topGithub.github_repos || 0} Repos` : '—'}
          subvalue={highlights.topGithub?.name ? `${highlights.topGithub.name} (${highlights.topGithub.github_stars || 0}★ earned)` : 'No public repos'}
          delta="Verified Public Repos"
          deltaType="positive"
          icon={GitBranch}
          badgeText="Open Source"
          badgeColor="text-blue-600 bg-blue-500/10 border-blue-500/20"
        />
      </div>

      {/* =========================================================================
          SECTION 3: Student Comparison Spotlight & Difficulty Progression
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Center Launcher Card */}
        <div className="lg:col-span-2 card-base p-6 bg-gradient-to-br from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-tint)] px-2 py-0.5 rounded border border-[var(--brand-border)] font-semibold">
                Feature Spotlight
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                Head-to-Head Analytics
              </span>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Individual Student Comparison Center
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Compare students individually using verified platform profile statistics. Inspect side-by-side performance across LeetCode Easy/Medium/Hard distributions, CodeChef star ratings, GeeksforGeeks coding scores, and GitHub development velocity.
            </p>
          </div>

          {/* Quick Comparison Suggestions */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-main)] space-y-2.5">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Quick Compare Profiles in this Cohort:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {highlights.topRating?.name && (
                <Link
                  to={`/student-comparison?select=${highlights.topRating.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-purple-500" />
                  <span className="font-semibold">{highlights.topRating.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">(Rating: {highlights.topRating.rating})</span>
                </Link>
              )}
              {highlights.topSolved?.name && highlights.topSolved.id !== highlights.topRating?.id && (
                <Link
                  to={`/student-comparison?select=${highlights.topSolved.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold">{highlights.topSolved.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">({highlights.topSolved.total} solved)</span>
                </Link>
              )}
              {highlights.topGithub?.name && (
                <Link
                  to={`/student-comparison?select=${highlights.topGithub.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-semibold">{highlights.topGithub.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">({highlights.topGithub.github_repos} repos)</span>
                </Link>
              )}
            </div>
          </div>

          {/* Big CTA */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)]">
              Support 2, 3, or more students in simultaneous comparison
            </div>
            <Link
              to="/student-comparison"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-95 shadow-xs transition-all"
            >
              <span>Launch Comparison Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Algorithmic Rigor: Difficulty Distribution in Filtered Cohort */}
        <div className="space-y-4">
          <DifficultyCard difficulty={diff} />

          {/* Metric Distinction Card */}
          <div className="card-base p-4 bg-[var(--surface-elevated)] text-xs space-y-2 border-[var(--border-color)]">
            <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)] text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Platform Distinction Principle</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              This intelligence system strictly distinguishes <strong>Official Platform World Ranks</strong> from <strong>Institutional Cohort Ranks</strong>. Unlinked metrics are reported as unavailable rather than zero.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: Top Individual Performers Spotlight Gallery
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Top Individual Performers
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Standout students in the selected branch and batch cohort across competitive and development vectors
            </p>
          </div>
          <Link
            to="/rankings"
            className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            <span>View All Standings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Performer 1: Contest Competitor */}
          <div className="card-base p-4 space-y-3 hover:border-[var(--brand-primary)] transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono uppercase text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded font-bold">
                Competitive Rating
              </span>
              <Trophy className="w-4 h-4 text-purple-600" />
            </div>
            {highlights.topRating?.name ? (
              <>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {highlights.topRating.name}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {highlights.topRating.branch}
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Max Rating:</span>
                  <span className="text-base font-bold font-mono text-purple-600">
                    {highlights.topRating.rating}
                  </span>
                </div>
                <Link
                  to={`/students/${highlights.topRating.id}`}
                  className="block text-center py-1.5 rounded-md bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
                >
                  View Profile →
                </Link>
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-4">No rated competitors in cohort.</p>
            )}
          </div>

          {/* Performer 2: High Volume Solver */}
          <div className="card-base p-4 space-y-3 hover:border-[var(--brand-primary)] transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono uppercase text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                Problem Solver
              </span>
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            {highlights.topSolved?.name ? (
              <>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {highlights.topSolved.name}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {highlights.topSolved.branch}
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Total Solved:</span>
                  <span className="text-base font-bold font-mono text-amber-600">
                    {highlights.topSolved.total}
                  </span>
                </div>
                <Link
                  to={`/students/${highlights.topSolved.id}`}
                  className="block text-center py-1.5 rounded-md bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
                >
                  View Profile →
                </Link>
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-4">No solved records in cohort.</p>
            )}
          </div>

          {/* Performer 3: Hard Problem Specialist */}
          <div className="card-base p-4 space-y-3 hover:border-[var(--brand-primary)] transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono uppercase text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded font-bold">
                Hard Algorithmic
              </span>
              <Award className="w-4 h-4 text-rose-600" />
            </div>
            {highlights.topHard?.name ? (
              <>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {highlights.topHard.name}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {highlights.topHard.branch}
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Hard Solved:</span>
                  <span className="text-base font-bold font-mono text-rose-600">
                    {highlights.topHard.total_hard}
                  </span>
                </div>
                <Link
                  to={`/students/${highlights.topHard.id}`}
                  className="block text-center py-1.5 rounded-md bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
                >
                  View Profile →
                </Link>
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-4">No hard solved records in cohort.</p>
            )}
          </div>

          {/* Performer 4: GitHub Developer */}
          <div className="card-base p-4 space-y-3 hover:border-[var(--brand-primary)] transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono uppercase text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded font-bold">
                Open Source Dev
              </span>
              <GitBranch className="w-4 h-4 text-blue-600" />
            </div>
            {highlights.topGithub?.name ? (
              <>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {highlights.topGithub.name}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {highlights.topGithub.branch}
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">Public Repos:</span>
                  <span className="text-base font-bold font-mono text-blue-600">
                    {highlights.topGithub.github_repos} ({highlights.topGithub.github_stars || 0}★)
                  </span>
                </div>
                <Link
                  to={`/students/${highlights.topGithub.id}`}
                  className="block text-center py-1.5 rounded-md bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
                >
                  View Profile →
                </Link>
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] py-4">No public repos linked.</p>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: Platform Coverage Standings & Global Leaderboard Navigation
          ========================================================================= */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Platform Integration & Standings Breakdown
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Linked account coverage and direct access to platform-specific global ranking leaderboards
            </p>
          </div>
          <Link
            to="/rankings"
            className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            <span>Open Global Standings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* LeetCode */}
          <Link
            to="/rankings?tab=leetcode"
            className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[#FFA116] hover:bg-[var(--surface-hover)] transition-all space-y-2 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FFA116]">LeetCode</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">GraphQL API</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Contest ratings, global ranks, and Easy/Med/Hard volume.
            </p>
            <div className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              <span>View Leaderboard</span>
              <ArrowRight className="w-3 h-3 text-[#FFA116]" />
            </div>
          </Link>

          {/* CodeChef */}
          <Link
            to="/rankings?tab=codechef"
            className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[#8B5CF6] hover:bg-[var(--surface-hover)] transition-all space-y-2 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B5CF6]">CodeChef</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Official Profile</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Global and country ranks, stars (1★-7★), and contest rating.
            </p>
            <div className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              <span>View Leaderboard</span>
              <ArrowRight className="w-3 h-3 text-[#8B5CF6]" />
            </div>
          </Link>

          {/* GeeksforGeeks */}
          <Link
            to="/rankings?tab=gfg"
            className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[#2F8D46] hover:bg-[var(--surface-hover)] transition-all space-y-2 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2F8D46]">GeeksforGeeks</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Public Stats</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Verified coding scores, streak, and institutional ranks.
            </p>
            <div className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              <span>View Leaderboard</span>
              <ArrowRight className="w-3 h-3 text-[#2F8D46]" />
            </div>
          </Link>

          {/* GitHub */}
          <Link
            to="/platforms/github"
            className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)] transition-all space-y-2 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)]">GitHub Dev</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">REST API v3</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Public repos, earned stars, and language distributions.
            </p>
            <div className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              <span>View Insights</span>
              <ArrowRight className="w-3 h-3 text-[var(--brand-primary)]" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
