import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  Plus,
  Clock,
  Layers,
  Award,
  GitBranch,
  ShieldCheck,
  Check
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

export default function StudentComparison() {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();

  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [platformAvailability, setPlatformAvailability] = useState('all');
  const [activePlatformTab, setActivePlatformTab] = useState('all'); // 'all' | 'leetcode' | 'gfg' | 'codechef' | 'github'

  // Table sorting & pagination
  const [sortBy, setSortBy] = useState('reported_solved_total');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Format relative sync timestamp
  const formatSyncTime = (isoString) => {
    if (!isoString) return 'Never synced';
    const d = new Date(isoString);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return '< 1 min ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Fetch all students for comparison pool
  useEffect(() => {
    const fetchPool = async () => {
      setLoading(true);
      try {
        const res = await getStudents({ limit: 2500, sortBy: 'name', sortOrder: 'asc' });
        if (res.success) {
          const list = res.students || [];
          setAllStudents(list);

          // Check if specific student requested via URL ?select=<id>
          const requestedId = searchParams.get('select');
          if (requestedId && list.some(s => s.id === requestedId)) {
            const partner = list.find(s => s.id !== requestedId);
            setSelectedIds(new Set([requestedId, ...(partner ? [partner.id] : [])]));
          } else if (list.length >= 2) {
            setSelectedIds(new Set([list[0].id, list[1].id]));
          } else if (list.length === 1) {
            setSelectedIds(new Set([list[0].id]));
          }
        }
      } catch (err) {
        showToast('Failed to load student roster: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPool();
  }, [searchParams]);

  // Filtered pool for selection picker
  const filteredPool = useMemo(() => {
    return allStudents.filter(st => {
      const matchSearch = !searchQuery.trim() ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.student_id && st.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (st.leetcode_username && st.leetcode_username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (st.codechef_username && st.codechef_username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (st.gfg_username && st.gfg_username.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBranch = branchFilter === 'all' || st.branch === branchFilter;
      const matchBatch = batchFilter === 'all' || st.batch === batchFilter;
      const matchSemester = semesterFilter === 'all' || st.semester === semesterFilter;
      const matchPlatform = platformAvailability === 'all' ||
        (platformAvailability === 'leetcode' && st.leetcode_username) ||
        (platformAvailability === 'gfg' && st.gfg_username) ||
        (platformAvailability === 'codechef' && st.codechef_username) ||
        (platformAvailability === 'github' && st.github_username) ||
        (platformAvailability === 'hackerrank' && st.hackerrank_username);

      return matchSearch && matchBranch && matchBatch && matchSemester && matchPlatform;
    });
  }, [allStudents, searchQuery, branchFilter, batchFilter, semesterFilter, platformAvailability]);

  // Selected students array
  const selectedStudents = useMemo(() => {
    return allStudents.filter(st => selectedIds.has(st.id));
  }, [allStudents, selectedIds]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 6) {
          showToast('Up to 6 students can be compared simultaneously for visual clarity.', 'info');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const toSelect = filteredPool.slice(0, 6).map(s => s.id);
    setSelectedIds(new Set(toSelect));
    showToast(`Selected top ${toSelect.length} filtered students for comparison.`, 'info');
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Preset comparative cohorts
  const applyPreset = (type) => {
    if (type === 'top_solvers') {
      const sorted = [...allStudents].sort((a, b) => (b.reported_solved_total || 0) - (a.reported_solved_total || 0));
      setSelectedIds(new Set(sorted.slice(0, 3).map(s => s.id)));
    } else if (type === 'contest_leaders') {
      const rated = [...allStudents]
        .filter(s => s.leetcode_rating || s.codechef_rating)
        .sort((a, b) => Math.max(b.leetcode_rating || 0, b.codechef_rating || 0) - Math.max(a.leetcode_rating || 0, a.codechef_rating || 0));
      setSelectedIds(new Set(rated.slice(0, 3).map(s => s.id)));
    } else if (type === 'github_devs') {
      const gh = [...allStudents]
        .filter(s => s.github_username)
        .sort((a, b) => (b.github_repos || 0) - (a.github_repos || 0));
      setSelectedIds(new Set(gh.slice(0, 3).map(s => s.id)));
    }
  };

  // Recharts Chart Data for selected students
  const comparisonChartData = useMemo(() => {
    return selectedStudents.map(s => ({
      name: s.name.split(' ')[0],
      fullName: s.name,
      LeetCode: s.leetcode_solved || 0,
      GFG: s.gfg_solved || 0,
      CodeChef: s.codechef_solved || 0,
      Easy: s.leetcode_easy || 0,
      Medium: s.leetcode_medium || 0,
      Hard: s.leetcode_hard || 0,
      Rating: Math.max(s.leetcode_rating || 0, s.codechef_rating || 0),
      Repos: s.github_repos || 0
    }));
  }, [selectedStudents]);

  // Sortable and Paginated Cohort Table
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

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortOrder('desc');
    }
  };

  // Export comparison as CSV
  const handleExportComparison = () => {
    if (selectedStudents.length === 0) {
      showToast('No students selected to export.', 'error');
      return;
    }
    const headers = [
      'Name', 'Student ID', 'Branch', 'Batch', 'Semester',
      'LeetCode Handle', 'LeetCode Solved', 'LeetCode Easy', 'LeetCode Medium', 'LeetCode Hard', 'LeetCode Rating', 'LeetCode Global Rank',
      'GFG Handle', 'GFG Solved', 'GFG Score', 'GFG Institute Rank',
      'CodeChef Handle', 'CodeChef Rating', 'CodeChef Stars', 'CodeChef Global Rank',
      'GitHub Handle', 'GitHub Repos', 'GitHub Stars'
    ];
    const rows = selectedStudents.map(s => [
      `"${s.name}"`,
      `"${s.student_id || ''}"`,
      `"${s.branch || ''}"`,
      `"${s.batch || ''}"`,
      `"${s.semester || ''}"`,
      `"${s.leetcode_username || ''}"`,
      s.leetcode_solved ?? '',
      s.leetcode_easy ?? '',
      s.leetcode_medium ?? '',
      s.leetcode_hard ?? '',
      s.leetcode_rating ?? '',
      s.leetcode_global_rank ?? '',
      `"${s.gfg_username || ''}"`,
      s.gfg_solved ?? '',
      s.gfg_score ?? '',
      s.gfg_institute_rank ?? '',
      `"${s.codechef_username || ''}"`,
      s.codechef_rating ?? '',
      `"${s.codechef_stars || ''}"`,
      s.codechef_global_rank ?? '',
      `"${s.github_username || ''}"`,
      s.github_repos ?? '',
      s.github_stars ?? ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `individual_student_comparison_${selectedStudents.length}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported comparison dataset for ${selectedStudents.length} students.`, 'success');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-tint)] px-2 py-0.5 rounded border border-[var(--brand-border)] font-semibold">
                Direct Analytics
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {selectedStudents.length} Students in Comparison Set
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Individual Student Comparison Center
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl mt-1 leading-relaxed">
              Compare individual students side-by-side using verified platform statistics. Distinguishes LeetCode difficulty breakdowns, CodeChef star ratings, GeeksforGeeks coding scores, and GitHub development engagement.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleExportComparison}
              disabled={selectedStudents.length === 0}
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Export Comparison CSV</span>
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTROLS: Student Multi-Selector, Branch, Batch, Semester Filters
          ========================================================================= */}
      <div className="card-base p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--brand-primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Select Students for Side-by-Side Comparison
            </h3>
          </div>

          {/* Quick Cohort Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Quick Presets:</span>
            <button
              onClick={() => applyPreset('top_solvers')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              Top Solvers
            </button>
            <button
              onClick={() => applyPreset('contest_leaders')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              Contest Competitors
            </button>
            <button
              onClick={() => applyPreset('github_devs')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] transition-colors"
            >
              GitHub Developers
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, roll, or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full control-select pl-8 text-xs"
            />
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="control-select text-xs"
          >
            <option value="all">All Branches</option>
            <option value="Computer Science & Engineering">CSE</option>
            <option value="Information Technology">IT</option>
            <option value="Artificial Intelligence & Data Science">AI & DS</option>
            <option value="Electronics & Communication">ECE</option>
          </select>

          {/* Batch Filter */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="control-select text-xs"
          >
            <option value="all">All Batches</option>
            <option value="2022-2026">Batch 2022-26</option>
            <option value="2023-2027">Batch 2023-27</option>
            <option value="2024-2028">Batch 2024-28</option>
          </select>

          {/* Semester Filter */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="control-select text-xs"
          >
            <option value="all">All Semesters</option>
            <option value="1st Sem">1st Semester</option>
            <option value="2nd Sem">2nd Semester</option>
            <option value="3rd Sem">3rd Semester</option>
            <option value="4th Sem">4th Semester</option>
            <option value="5th Sem">5th Semester</option>
            <option value="6th Sem">6th Semester</option>
            <option value="7th Sem">7th Semester</option>
            <option value="8th Sem">8th Semester</option>
          </select>

          {/* Platform Availability */}
          <select
            value={platformAvailability}
            onChange={(e) => setPlatformAvailability(e.target.value)}
            className="control-select text-xs"
          >
            <option value="all">Any Platform Linked</option>
            <option value="leetcode">LeetCode Active</option>
            <option value="codechef">CodeChef Active</option>
            <option value="gfg">GFG Active</option>
            <option value="github">GitHub Active</option>
          </select>
        </div>

        {/* Selected Student Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Active Set ({selectedStudents.length}/6):
          </span>
          {selectedStudents.length === 0 ? (
            <span className="text-xs text-[var(--text-muted)] italic">
              No students selected. Click any student chip below to add them to comparison.
            </span>
          ) : (
            selectedStudents.map(st => (
              <div
                key={st.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--brand-primary)] bg-[var(--brand-tint)] text-xs text-[var(--text-primary)] font-medium shadow-2xs"
              >
                <span>{st.name}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">({st.branch?.split(' ')[0] || 'Eng'})</span>
                <button
                  onClick={() => toggleSelect(st.id)}
                  className="hover:text-[var(--brand-primary)] text-[var(--text-secondary)] ml-1"
                  title="Remove from comparison"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Selection Pool Chips */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Filtered Roster ({filteredPool.length} students): Click to add/remove
            </span>
            <button
              onClick={handleSelectAllFiltered}
              className="text-[11px] text-[var(--brand-primary)] font-semibold hover:underline"
            >
              Select Top 6 Filtered
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-[var(--border-color)] rounded-lg bg-[var(--surface-elevated)]/50">
            {filteredPool.slice(0, 40).map(st => {
              const isSelected = selectedIds.has(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => toggleSelect(st.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-white shadow-2xs font-semibold'
                      : 'bg-[var(--surface-main)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-[var(--text-muted)]" />}
                  <span>{st.name}</span>
                  {st.student_id && <span className="font-mono text-[10px] opacity-75">[{st.student_id}]</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PLATFORM TABS: Compare Mode Navigation
          ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto text-xs">
        {[
          { id: 'all', label: 'Cross-Platform Overview' },
          { id: 'leetcode', label: 'LeetCode Problem-Solving' },
          { id: 'gfg', label: 'GeeksforGeeks Scoring' },
          { id: 'codechef', label: 'CodeChef CP Ratings' },
          { id: 'github', label: 'GitHub Dev Engagement' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePlatformTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 border ${
              activePlatformTab === tab.id
                ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          SIDE-BY-SIDE COMPARISON CARDS (Student A vs Student B vs Student C)
          ========================================================================= */}
      {selectedStudents.length === 0 ? (
        <div className="card-base p-12 text-center space-y-3">
          <GitCompare className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Select At Least 2 Students to Begin Comparison
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Choose from the roster above or use quick presets like "Top Solvers" or "Contest Competitors" to compare individual metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedStudents.map(st => (
            <div
              key={st.id}
              className="card-base p-5 flex flex-col justify-between space-y-4 hover:border-[var(--brand-primary)] transition-all bg-[var(--surface-main)]"
            >
              {/* Student Header Dossier */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {st.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                        {st.name}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        {st.student_id || 'ID Unassigned'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSelect(st.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--brand-primary)] rounded"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-2 gap-y-1">
                  <span className="font-medium text-[var(--text-primary)]">{st.branch || 'Branch Unassigned'}</span>
                  <span>•</span>
                  <span>{st.batch}</span>
                  <span>•</span>
                  <span className="text-[var(--text-muted)]">{st.semester}</span>
                </div>
              </div>

              {/* Dynamic Platform Metric Breakdown */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                {/* LeetCode Section */}
                {(activePlatformTab === 'all' || activePlatformTab === 'leetcode') && (
                  <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#FFA116]">
                        <span className="w-2 h-2 rounded-full bg-[#FFA116]" />
                        <span>LeetCode</span>
                      </div>
                      {st.leetcode_username ? (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {formatSyncTime(st.leetcode_sync)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono">Unlinked</span>
                      )}
                    </div>

                    {st.leetcode_username ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)]">Total Solved</span>
                            <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                              {st.leetcode_solved || 0}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)]">Contest Rating</span>
                            <div className="font-mono font-bold text-sm text-[#FFA116]">
                              {st.leetcode_rating || 'Unrated'}
                            </div>
                          </div>
                        </div>

                        {/* Difficulty Bars */}
                        <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] font-mono">
                          <div className="p-1 rounded bg-[var(--surface-main)] text-center border border-[var(--border-color)]">
                            <span className="text-[10px] text-emerald-600 font-semibold block">EASY</span>
                            <span className="font-bold">{st.leetcode_easy || 0}</span>
                          </div>
                          <div className="p-1 rounded bg-[var(--surface-main)] text-center border border-[var(--border-color)]">
                            <span className="text-[10px] text-amber-600 font-semibold block">MED</span>
                            <span className="font-bold">{st.leetcode_medium || 0}</span>
                          </div>
                          <div className="p-1 rounded bg-[var(--surface-main)] text-center border border-[var(--border-color)]">
                            <span className="text-[10px] text-rose-600 font-semibold block">HARD</span>
                            <span className="font-bold">{st.leetcode_hard || 0}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                          <span>Global Rank:</span>
                          <span className="font-mono font-semibold text-[var(--text-primary)]">
                            {st.leetcode_global_rank ? `#${st.leetcode_global_rank.toLocaleString()}` : 'N/A — rank unavailable'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] italic py-1">
                        N/A — LeetCode profile not linked
                      </p>
                    )}
                  </div>
                )}

                {/* CodeChef Section */}
                {(activePlatformTab === 'all' || activePlatformTab === 'codechef') && (
                  <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#8B5CF6]">
                        <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                        <span>CodeChef</span>
                      </div>
                      {st.codechef_username ? (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {formatSyncTime(st.codechef_sync)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono">Unlinked</span>
                      )}
                    </div>

                    {st.codechef_username ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Current Rating</span>
                          <div className="font-mono font-bold text-sm text-[#8B5CF6]">
                            {st.codechef_rating ? `${st.codechef_rating} (${st.codechef_stars || '★'})` : 'Unrated'}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Global Rank</span>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                            {st.codechef_global_rank ? `#${st.codechef_global_rank.toLocaleString()}` : 'N/A — rank unavailable'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] italic py-1">
                        N/A — CodeChef handle not linked
                      </p>
                    )}
                  </div>
                )}

                {/* GeeksforGeeks Section */}
                {(activePlatformTab === 'all' || activePlatformTab === 'gfg') && (
                  <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#2F8D46]">
                        <span className="w-2 h-2 rounded-full bg-[#2F8D46]" />
                        <span>GeeksforGeeks</span>
                      </div>
                      {st.gfg_username ? (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {formatSyncTime(st.gfg_sync)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono">Unlinked</span>
                      )}
                    </div>

                    {st.gfg_username ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Total Solved</span>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                            {st.gfg_solved || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Coding Score</span>
                          <div className="font-mono font-bold text-sm text-[#2F8D46]">
                            {st.gfg_score !== null && st.gfg_score !== undefined ? st.gfg_score : (st.gfg_solved ? st.gfg_solved * 3 : '—')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] italic py-1">
                        N/A — GFG handle not linked
                      </p>
                    )}
                  </div>
                )}

                {/* GitHub Section */}
                {(activePlatformTab === 'all' || activePlatformTab === 'github') && (
                  <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                        <GitBranch className="w-3.5 h-3.5 text-blue-500" />
                        <span>GitHub Engineering</span>
                      </div>
                      {st.github_username ? (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {formatSyncTime(st.github_sync)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono">Unlinked</span>
                      )}
                    </div>

                    {st.github_username ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Public Repos</span>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                            {st.github_repos || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Stars Earned</span>
                          <div className="font-mono font-bold text-sm text-blue-600">
                            {st.github_stars || 0}★
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] italic py-1">
                        N/A — GitHub handle not linked
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Link Action */}
              <div className="pt-3 border-t border-[var(--border-subtle)]">
                <Link
                  to={`/students/${st.id}`}
                  className="w-full py-2 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Full Analytics Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          COMPARATIVE METRICS TABLE & CHART
          ========================================================================= */}
      {selectedStudents.length > 0 && (
        <div className="card-base p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Comparative Platform Metrics Table
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Sortable individual student metrics across verified platform snapshots
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Showing {sortedCohort.length} students
            </span>
          </div>

          <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Branch / Batch</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('leetcode_solved')}
                  >
                    <div className="flex items-center gap-1">
                      <span>LC Solved</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('leetcode_rating')}
                  >
                    <div className="flex items-center gap-1">
                      <span>LC Rating</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">LC Difficulty (E / M / H)</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('gfg_solved')}
                  >
                    <div className="flex items-center gap-1">
                      <span>GFG Solved</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('codechef_rating')}
                  >
                    <div className="flex items-center gap-1">
                      <span>CC Rating</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                    onClick={() => handleSort('github_repos')}
                  >
                    <div className="flex items-center gap-1">
                      <span>GitHub Repos</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {sortedCohort.map(st => (
                  <tr key={st.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold">{st.name}</div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">{st.student_id || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <div>{st.branch || '—'}</div>
                      <div className="text-[var(--text-muted)] font-mono">{st.batch} • {st.semester}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {st.leetcode_solved !== null && st.leetcode_solved !== undefined ? st.leetcode_solved : <span className="text-[var(--text-muted)] font-normal">N/A</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#FFA116] font-bold">
                      {st.leetcode_rating || <span className="text-[var(--text-muted)] font-normal font-sans">Unrated</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {st.leetcode_username ? (
                        <span className="text-emerald-600 font-bold">{st.leetcode_easy || 0}</span>
                      ) : null}
                      {st.leetcode_username ? ' / ' : null}
                      {st.leetcode_username ? (
                        <span className="text-amber-600 font-bold">{st.leetcode_medium || 0}</span>
                      ) : null}
                      {st.leetcode_username ? ' / ' : null}
                      {st.leetcode_username ? (
                        <span className="text-rose-600 font-bold">{st.leetcode_hard || 0}</span>
                      ) : <span className="text-[var(--text-muted)] font-sans">N/A</span>}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#2F8D46]">
                      {st.gfg_solved !== null && st.gfg_solved !== undefined ? st.gfg_solved : <span className="text-[var(--text-muted)] font-normal font-sans">N/A</span>}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#8B5CF6]">
                      {st.codechef_rating ? `${st.codechef_rating} (${st.codechef_stars || '★'})` : <span className="text-[var(--text-muted)] font-normal font-sans">Unrated</span>}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {st.github_repos !== null && st.github_repos !== undefined ? `${st.github_repos} (${st.github_stars || 0}★)` : <span className="text-[var(--text-muted)] font-sans">N/A</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/students/${st.id}`}
                        className="text-xs font-semibold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
