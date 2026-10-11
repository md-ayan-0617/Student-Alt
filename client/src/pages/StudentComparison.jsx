import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCompare,
  Users,
  Search,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Code2,
  Flame,
  Star,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Sparkles,
  BarChart2,
  X,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getStudents } from '../services/api';
import { useApp } from '../context/AppContext';
import KpiCard from '../components/cards/KpiCard';

export default function StudentComparison() {
  const { showToast } = useApp();

  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Cohort table pagination & sorting
  const [sortBy, setSortBy] = useState('reported_solved_total');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Fetch all students for the comparison pool (up to 2500)
  useEffect(() => {
    const fetchPool = async () => {
      setLoading(true);
      try {
        const res = await getStudents({ limit: 2500, sortBy: 'name', sortOrder: 'asc' });
        if (res.success) {
          setAllStudents(res.students || []);
          // By default, if at least 2 students exist, select the top 2 as initial comparison
          if (res.students.length >= 2) {
            setSelectedIds(new Set([res.students[0].id, res.students[1].id]));
          } else if (res.students.length === 1) {
            setSelectedIds(new Set([res.students[0].id]));
          }
        }
      } catch (err) {
        showToast('Failed to load student roster: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPool();
  }, []);

  // Filtered pool for selection
  const filteredPool = useMemo(() => {
    return allStudents.filter(st => {
      const matchSearch = !searchQuery.trim() ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.student_id && st.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (st.leetcode_username && st.leetcode_username.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBranch = branchFilter === 'all' || st.branch === branchFilter;
      const matchBatch = batchFilter === 'all' || st.batch === batchFilter;
      const matchPlatform = platformFilter === 'all' ||
        (platformFilter === 'leetcode' && st.leetcode_username) ||
        (platformFilter === 'gfg' && st.gfg_username) ||
        (platformFilter === 'codechef' && st.codechef_username) ||
        (platformFilter === 'github' && st.github_username) ||
        (platformFilter === 'hackerrank' && st.hackerrank_username);

      return matchSearch && matchBranch && matchBatch && matchPlatform;
    });
  }, [allStudents, searchQuery, branchFilter, batchFilter, platformFilter]);

  // Selected students array
  const selectedStudents = useMemo(() => {
    return allStudents.filter(st => selectedIds.has(st.id));
  }, [allStudents, selectedIds]);

  // Unique branches and batches from dataset
  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(allStudents.map(s => s.branch).filter(Boolean)));
  }, [allStudents]);

  const uniqueBatches = useMemo(() => {
    return Array.from(new Set(allStudents.map(s => s.batch).filter(Boolean)));
  }, [allStudents]);

  // Toggle selection
  const toggleStudent = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk actions
  const selectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredPool.forEach(st => next.add(st.id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Presets
  const applyPreset = (type) => {
    if (type === 'all') {
      setSelectedIds(new Set(allStudents.map(s => s.id)));
    } else if (type === 'top10') {
      const top = [...allStudents].sort((a, b) => (b.reported_solved_total || 0) - (a.reported_solved_total || 0)).slice(0, 10);
      setSelectedIds(new Set(top.map(s => s.id)));
    } else if (type === 'rated') {
      const rated = allStudents.filter(s => s.leetcode_rating || s.codechef_rating);
      setSelectedIds(new Set(rated.map(s => s.id)));
    } else if (type === 'github') {
      const gh = allStudents.filter(s => s.github_username);
      setSelectedIds(new Set(gh.map(s => s.id)));
    }
  };

  // Cohort Aggregations
  const cohortMetrics = useMemo(() => {
    const totalSelected = selectedStudents.length;
    if (totalSelected === 0) return null;

    const totalSolved = selectedStudents.reduce((acc, s) => acc + (s.reported_solved_total || 0), 0);
    const avgSolved = Math.round(totalSolved / totalSelected);

    // Median
    const sortedSolved = [...selectedStudents].map(s => s.reported_solved_total || 0).sort((a, b) => a - b);
    const mid = Math.floor(sortedSolved.length / 2);
    const medianSolved = sortedSolved.length % 2 !== 0 ? sortedSolved[mid] : Math.round((sortedSolved[mid - 1] + sortedSolved[mid]) / 2);

    // Top solver
    const topSolver = [...selectedStudents].sort((a, b) => (b.reported_solved_total || 0) - (a.reported_solved_total || 0))[0];

    // Max CP rating
    const maxLcRating = Math.max(0, ...selectedStudents.map(s => s.leetcode_rating || 0));
    const maxCcRating = Math.max(0, ...selectedStudents.map(s => s.codechef_rating || 0));
    const peakRating = Math.max(maxLcRating, maxCcRating);

    // Difficulty breakdown
    const easyTotal = selectedStudents.reduce((acc, s) => acc + (s.leetcode_easy || 0), 0);
    const medTotal = selectedStudents.reduce((acc, s) => acc + (s.leetcode_medium || 0), 0);
    const hardTotal = selectedStudents.reduce((acc, s) => acc + (s.leetcode_hard || 0), 0);

    return {
      totalSelected,
      totalSolved,
      avgSolved,
      medianSolved,
      topSolver,
      peakRating: peakRating > 0 ? peakRating : '—',
      easyTotal,
      medTotal,
      hardTotal
    };
  }, [selectedStudents]);

  // Sorted and Paginated Cohort Table
  const sortedCohort = useMemo(() => {
    return [...selectedStudents].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === null || valA === undefined) valA = -Infinity;
      if (valB === null || valB === undefined) valB = -Infinity;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [selectedStudents, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedCohort.length / pageSize) || 1;
  const paginatedCohort = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedCohort.slice(start, start + pageSize);
  }, [sortedCohort, page, pageSize]);

  // Export selected comparison as CSV
  const handleExportComparison = () => {
    if (selectedStudents.length === 0) {
      showToast('No students selected for comparison.', 'error');
      return;
    }
    const headers = ['Name', 'Student ID', 'Branch', 'Batch', 'LeetCode Solved', 'LeetCode Rating', 'GFG Solved', 'GFG Score', 'CodeChef Rating', 'GitHub Repos', 'Total Verified Solved'];
    const rows = selectedStudents.map(s => [
      `"${s.name}"`,
      `"${s.student_id || ''}"`,
      `"${s.branch || ''}"`,
      `"${s.batch || ''}"`,
      s.leetcode_solved ?? '',
      s.leetcode_rating ?? '',
      s.gfg_solved ?? '',
      s.gfg_score ?? '',
      s.codechef_rating ?? '',
      s.github_repos ?? '',
      s.reported_solved_total ?? ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cohort_comparison_${selectedStudents.length}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported comparison dataset for ${selectedStudents.length} students.`, 'success');
  };

  // Recharts Chart Data for Side-by-Side (2 to 4 students)
  const sideBySideChartData = useMemo(() => {
    if (selectedStudents.length < 2 || selectedStudents.length > 4) return [];
    return [
      {
        platform: 'LeetCode',
        ...selectedStudents.reduce((acc, s) => ({ ...acc, [s.name]: s.leetcode_solved || 0 }), {})
      },
      {
        platform: 'GeeksforGeeks',
        ...selectedStudents.reduce((acc, s) => ({ ...acc, [s.name]: s.gfg_solved || 0 }), {})
      },
      {
        platform: 'CodeChef',
        ...selectedStudents.reduce((acc, s) => ({ ...acc, [s.name]: s.codechef_solved || 0 }), {})
      },
      {
        platform: 'GitHub Repos',
        ...selectedStudents.reduce((acc, s) => ({ ...acc, [s.name]: s.github_repos || 0 }), {})
      }
    ];
  }, [selectedStudents]);

  const barColors = ['#EA5652', '#ED8368', '#42D6C3', '#FFA116'];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2 py-0.5 rounded border border-[var(--brand-primary)]/30">
                Cohort Analytics Engine
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                2 to 2,000 Dynamic Multi-Student Comparison
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Dynamic Student & Cohort Comparison
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
              Compare any arbitrary selection of students across algorithmic volume, contest ratings, problem difficulty, and development output. Scale seamlessly from 2-student side-by-side dossiers up to 2,000-student cohort distributions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportComparison}
              disabled={selectedStudents.length === 0}
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] disabled:opacity-50 text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Export Cohort CSV</span>
            </button>
            <button
              onClick={clearSelection}
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel: Student Selector, Filters & Presets */}
      <div className="card-base p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-1">
              Quick Presets:
            </span>
            <button
              onClick={() => applyPreset('top10')}
              className="px-2.5 py-1 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs text-[var(--text-primary)] transition-colors"
            >
              Top 10 Solvers
            </button>
            <button
              onClick={() => applyPreset('rated')}
              className="px-2.5 py-1 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs text-[var(--text-primary)] transition-colors"
            >
              Rated Competitors
            </button>
            <button
              onClick={() => applyPreset('github')}
              className="px-2.5 py-1 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs text-[var(--text-primary)] transition-colors"
            >
              GitHub Developers
            </button>
            <button
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs text-[var(--text-primary)] transition-colors font-medium text-[var(--brand-primary)]"
            >
              All Students ({allStudents.length})
            </button>
          </div>

          {/* Active Selection Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              Selected:{' '}
              <span className="font-mono text-[var(--brand-primary)] font-bold">
                {selectedIds.size}
              </span>{' '}
              / {allStudents.length} students
            </span>
            <button
              onClick={selectAllFiltered}
              className="text-[11px] text-[var(--brand-primary)] hover:underline ml-2"
            >
              Select All Filtered ({filteredPool.length})
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll, or handle..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="all">All Departments</option>
            {uniqueBranches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Batch Filter */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="all">All Batches</option>
            {uniqueBatches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="all">All Platforms Linked</option>
            <option value="leetcode">LeetCode Active</option>
            <option value="gfg">GeeksforGeeks Active</option>
            <option value="codechef">CodeChef Active</option>
            <option value="github">GitHub Active</option>
            <option value="hackerrank">HackerRank Active</option>
          </select>
        </div>

        {/* Scrollable Student Selection Chips / Pool */}
        <div className="pt-2">
          <div className="text-[11px] font-medium text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Click to toggle individual student inclusion:</span>
            <span>Showing {filteredPool.length} candidates</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[var(--surface-elevated)]/40 rounded-lg border border-[var(--border-color)]">
            {filteredPool.length === 0 ? (
              <div className="text-xs text-[var(--text-muted)] py-2 px-1">
                No students match current search or filters.
              </div>
            ) : (
              filteredPool.map(st => {
                const isSelected = selectedIds.has(st.id);
                return (
                  <button
                    key={st.id}
                    onClick={() => toggleStudent(st.id)}
                    className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] font-medium shadow-sm'
                        : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]/80'
                    }`}
                  >
                    <span className="truncate max-w-[130px]">{st.name}</span>
                    {isSelected ? (
                      <X className="w-3 h-3 opacity-80" />
                    ) : (
                      <span className="font-mono text-[10px] opacity-70">+{st.reported_solved_total || 0}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Comparison Display */}
      {selectedStudents.length === 0 ? (
        <div className="card-base p-12 text-center space-y-3">
          <GitCompare className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            No Students Selected for Comparison
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Select at least 2 students from the roster selector above or use one of the quick presets to analyze performance side-by-side or as a cohort.
          </p>
          <div className="pt-2">
            <button
              onClick={() => applyPreset('top10')}
              className="px-4 py-2 bg-[var(--brand-primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Compare Top 10 Solvers
            </button>
          </div>
        </div>
      ) : selectedStudents.length === 1 ? (
        <div className="card-base p-8 text-center space-y-2">
          <GitCompare className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Single Student Selected ({selectedStudents[0].name})
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Comparison requires at least 2 students. Please click one more student above to begin side-by-side analysis.
          </p>
        </div>
      ) : selectedStudents.length >= 2 && selectedStudents.length <= 4 ? (
        /* MODE A: Detailed Side-by-Side Cards (2 to 4 students) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Side-by-Side Detailed Dossier Comparison ({selectedStudents.length} Students)
            </h3>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Direct Metric Contrast
            </span>
          </div>

          {/* Direct Comparison Cards Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-${selectedStudents.length} gap-4`}>
            {selectedStudents.map((st, idx) => (
              <div
                key={st.id}
                className="card-base p-5 space-y-4 hover:border-[var(--brand-primary)]/70 transition-all flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-[var(--text-primary)] truncate">
                      {st.name}
                    </h4>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                      {st.student_id || 'ID Unassigned'} • {st.branch || 'General'}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStudent(st.id)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Metric Summary Rows */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Total Solved:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                      {st.reported_solved_total?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">LeetCode:</span>
                    <span className="font-mono text-amber-400 tabular-nums">
                      {st.leetcode_solved !== null && st.leetcode_solved !== undefined ? `${st.leetcode_solved} (${st.leetcode_easy || 0}E / ${st.leetcode_medium || 0}M / ${st.leetcode_hard || 0}H)` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">LeetCode Rating:</span>
                    <span className="font-mono text-purple-400 font-bold tabular-nums">
                      {st.leetcode_rating || 'Unrated'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">GeeksforGeeks:</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      {st.gfg_solved !== null && st.gfg_solved !== undefined ? `${st.gfg_solved} (${st.gfg_score ? `${st.gfg_score} pts` : 'Score unlisted'})` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">CodeChef:</span>
                    <span className="font-mono text-purple-400 tabular-nums">
                      {st.codechef_rating ? `${st.codechef_rating} (${st.codechef_stars || '—'})` : (st.codechef_username ? 'Unrated' : '—')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">GitHub Repos:</span>
                    <span className="font-mono text-blue-400 tabular-nums">
                      {st.github_repos !== null && st.github_repos !== undefined ? `${st.github_repos} repos (${st.github_stars || 0}★)` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Data Completeness:</span>
                    <span className="font-mono text-[var(--accent-teal)] tabular-nums">
                      {st.data_completeness || 0}%
                    </span>
                  </div>
                </div>

                {/* View Dossier Action */}
                <div className="pt-3 border-t border-[var(--border-color)]">
                  <Link
                    to={`/students/${st.id}`}
                    className="w-full py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Open Full Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Platform Comparison Bar Chart */}
          <div className="card-base p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">
              Side-by-Side Platform Distribution Contrast
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sideBySideChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                  <XAxis dataKey="platform" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-main)',
                      borderColor: 'var(--border-color)',
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  {selectedStudents.map((st, sIdx) => (
                    <Bar
                      key={st.id}
                      dataKey={st.name}
                      fill={barColors[sIdx % barColors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* MODE B: Scalable Cohort Analysis (5 to 2,000 students) */
        <div className="space-y-6">
          {/* Cohort KPI Summary Cards */}
          {cohortMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                title="Cohort Size"
                value={cohortMetrics.totalSelected}
                subvalue="Active selected cohort"
                icon={Users}
                badgeText="Sample Pool"
              />
              <KpiCard
                title="Total Solved"
                value={cohortMetrics.totalSolved.toLocaleString()}
                subvalue={`Avg: ${cohortMetrics.avgSolved} / student`}
                icon={Code2}
                badgeText="Cohort Solved"
                badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              />
              <KpiCard
                title="Median Solved"
                value={cohortMetrics.medianSolved}
                subvalue="Robust cohort baseline"
                icon={BarChart2}
                badgeText="50th Percentile"
              />
              <KpiCard
                title="Top Solver"
                value={cohortMetrics.topSolver?.reported_solved_total || 0}
                subvalue={cohortMetrics.topSolver?.name || '—'}
                icon={Trophy}
                badgeText="Cohort Leader"
                badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
              />
              <KpiCard
                title="Peak CP Rating"
                value={cohortMetrics.peakRating}
                subvalue="Highest observed contest rating"
                icon={Star}
                badgeText="Elite Tier"
                badgeColor="text-purple-400 bg-purple-500/10 border-purple-500/30"
              />
            </div>
          )}

          {/* High-Density Cohort Matrix Table */}
          <div className="card-base overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                  Cohort Performance Matrix ({selectedStudents.length} Students)
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Ranked, sortable multi-platform comparison for large student cohorts
                </p>
              </div>

              <div className="text-xs font-mono text-[var(--text-muted)]">
                Showing {Math.min((page - 1) * pageSize + 1, sortedCohort.length)} - {Math.min(page * pageSize, sortedCohort.length)} of {sortedCohort.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th
                      onClick={() => {
                        if (sortBy === 'name') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('name'); setSortOrder('asc'); }
                      }}
                      className="py-2.5 px-4 cursor-pointer hover:text-[var(--text-primary)]"
                    >
                      <div className="flex items-center gap-1">
                        <span>Student</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-2.5 px-4">Department & Batch</th>
                    <th
                      onClick={() => {
                        if (sortBy === 'reported_solved_total') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        else { setSortBy('reported_solved_total'); setSortOrder('desc'); }
                      }}
                      className="py-2.5 px-4 cursor-pointer hover:text-[var(--text-primary)]"
                    >
                      <div className="flex items-center gap-1">
                        <span>Total Solved</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-2.5 px-4">LeetCode</th>
                    <th className="py-2.5 px-4">GFG</th>
                    <th className="py-2.5 px-4">CodeChef</th>
                    <th className="py-2.5 px-4">GitHub</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {paginatedCohort.map((st, idx) => {
                    const globalRank = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr key={st.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-[var(--text-muted)]">
                          {globalRank}
                        </td>
                        <td className="py-2.5 px-4">
                          <Link
                            to={`/students/${st.id}`}
                            className="font-medium text-[var(--text-primary)] hover:text-[var(--brand-primary)] block truncate max-w-[160px]"
                          >
                            {st.name}
                          </Link>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {st.student_id || 'ID unassigned'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="text-[11px] text-[var(--text-primary)] truncate max-w-[140px]">
                            {st.branch || 'General'}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">
                            {st.batch || 'Batch unlisted'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-400 tabular-nums">
                          {st.reported_solved_total?.toLocaleString() || 0}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums">
                          {st.leetcode_username ? (
                            <div>
                              <span className="text-[var(--text-primary)] font-bold">{st.leetcode_solved || 0}</span>
                              {st.leetcode_rating && (
                                <span className="text-purple-400 ml-1">({st.leetcode_rating}★)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">Not Linked</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums">
                          {st.gfg_username ? (
                            <div>
                              <span className="text-emerald-400 font-bold">{st.gfg_solved || 0}</span>
                              {st.gfg_score && (
                                <span className="text-[var(--text-muted)] ml-1">({st.gfg_score} pts)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">Not Linked</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums">
                          {st.codechef_username ? (
                            <div>
                              <span className="text-purple-400 font-bold">{st.codechef_rating || 'Unrated'}</span>
                              {st.codechef_stars && (
                                <span className="text-amber-400 ml-1">{st.codechef_stars}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">Not Linked</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums">
                          {st.github_username ? (
                            <div>
                              <span className="text-blue-400 font-bold">{st.github_repos || 0} repos</span>
                              {st.github_stars > 0 && (
                                <span className="text-amber-400 ml-1">({st.github_stars}★)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] italic">Not Linked</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Link
                            to={`/students/${st.id}`}
                            className="inline-flex items-center gap-1 text-[var(--brand-primary)] hover:underline"
                          >
                            <span>Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] disabled:opacity-40 flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="font-mono text-[var(--text-muted)]">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] disabled:opacity-40 flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
