import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Code2,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  ShieldCheck,
  Info,
  Clock,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents } from '../services/api';

export default function RankingsLeaderboards() {
  const { filters, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active platform tab: 'leetcode' | 'gfg' | 'codechef'
  const initialTab = searchParams.get('tab') || 'leetcode';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters within rankings page
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState(filters.branch || 'all');
  const [batchFilter, setBatchFilter] = useState(filters.batch || 'all');
  const [semesterFilter, setSemesterFilter] = useState(filters.semester || 'all');
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Platform-specific sorting
  const [sortField, setSortField] = useState(() => {
    if (activeTab === 'leetcode') return 'leetcode_rating';
    if (activeTab === 'gfg') return 'gfg_score';
    return 'codechef_rating';
  });

  // Track tab changes in URL & reset sort field
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    if (tab === 'leetcode') setSortField('leetcode_rating');
    if (tab === 'gfg') setSortField('gfg_score');
    if (tab === 'codechef') setSortField('codechef_rating');
  };

  // Format relative sync time
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

  // Fetch all students for leaderboard sorting
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await getStudents({ limit: 2500, sortBy: 'name', sortOrder: 'asc' });
        if (res.success) {
          setStudents(res.students || []);
        }
      } catch (e) {
        showToast('Error loading platform rankings: ' + e.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Filter cohort based on selected parameters
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      // Must have handle on current platform if onlyVerified
      if (activeTab === 'leetcode') {
        if (!st.leetcode_username) return false;
        if (onlyVerified && st.leetcode_status !== 'connected') return false;
      }
      if (activeTab === 'gfg') {
        if (!st.gfg_username) return false;
        if (onlyVerified && st.gfg_status !== 'connected') return false;
      }
      if (activeTab === 'codechef') {
        if (!st.codechef_username) return false;
        if (onlyVerified && st.codechef_status !== 'connected') return false;
      }

      const matchSearch = !searchQuery.trim() ||
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.student_id && st.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (st.leetcode_username && st.leetcode_username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (st.codechef_username && st.codechef_username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (st.gfg_username && st.gfg_username.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBranch = branchFilter === 'all' || st.branch === branchFilter;
      const matchBatch = batchFilter === 'all' || st.batch === batchFilter;
      const matchSemester = semesterFilter === 'all' || st.semester === semesterFilter;

      return matchSearch && matchBranch && matchBatch && matchSemester;
    });
  }, [students, activeTab, searchQuery, branchFilter, batchFilter, semesterFilter, onlyVerified]);

  // Sort students according to selected platform metric and directional rules
  // Ranks (e.g. global rank, institute rank): ASCENDING (1 is better than 100)
  // Ratings / Solved / Scores: DESCENDING (higher is better)
  const isAscendingSort = sortField.includes('rank');

  const rankedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls: unranked or missing values pushed to the bottom
      if (valA === null || valA === undefined || valA === '') {
        return 1;
      }
      if (valB === null || valB === undefined || valB === '') {
        return -1;
      }

      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return isAscendingSort ? numA - numB : numB - numA;
      }

      return String(valA).localeCompare(String(valB));
    });
  }, [filteredStudents, sortField, isAscendingSort]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--brand-primary)] bg-[var(--brand-tint)] px-2 py-0.5 rounded border border-[var(--brand-border)] font-semibold">
                Official Platform Standings
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {rankedStudents.length} Students in Leaderboard
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Global Platform Rankings & Competitive Standings
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl mt-1 leading-relaxed">
              Verified standings retrieved directly from real external platform profiles. Distinguishes verified <strong>Platform World Rank</strong> from <strong>Institutional Student Rank</strong>. Unavailable rankings are never fabricated.
            </p>
          </div>

          <Link
            to="/student-comparison"
            className="px-3.5 py-2 rounded-lg bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Compare Top Students</span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          PLATFORM TABS: LeetCode | GeeksforGeeks | CodeChef
          ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
        <button
          onClick={() => handleTabChange('leetcode')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
            activeTab === 'leetcode'
              ? 'bg-[#FFA116] text-white border-[#FFA116] shadow-xs'
              : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white/80" />
          <span>LeetCode Rankings</span>
        </button>

        <button
          onClick={() => handleTabChange('gfg')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
            activeTab === 'gfg'
              ? 'bg-[#2F8D46] text-white border-[#2F8D46] shadow-xs'
              : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white/80" />
          <span>GeeksforGeeks Rankings</span>
        </button>

        <button
          onClick={() => handleTabChange('codechef')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
            activeTab === 'codechef'
              ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-xs'
              : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white/80" />
          <span>CodeChef Rankings</span>
        </button>
      </div>

      {/* =========================================================================
          FILTERS & SORTING CONTROLS
          ========================================================================= */}
      <div className="card-base p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or handle..."
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
            <option value="all">All Academic Branches</option>
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

          {/* Sort Metric Selector */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="control-select text-xs font-semibold"
          >
            {activeTab === 'leetcode' && (
              <>
                <option value="leetcode_rating">Sort by Contest Rating (High → Low)</option>
                <option value="leetcode_rank">Sort by Platform Global Rank (#1 → Top)</option>
                <option value="leetcode_solved">Sort by Problems Solved (High → Low)</option>
                <option value="leetcode_hard">Sort by Hard Problems (High → Low)</option>
              </>
            )}
            {activeTab === 'gfg' && (
              <>
                <option value="gfg_score">Sort by Coding Score (High → Low)</option>
                <option value="gfg_solved">Sort by Problems Solved (High → Low)</option>
                <option value="gfg_institute_rank">Sort by Institute Rank (#1 → Top)</option>
              </>
            )}
            {activeTab === 'codechef' && (
              <>
                <option value="codechef_rating">Sort by Contest Rating (High → Low)</option>
                <option value="codechef_rank">Sort by Global Rank (#1 → Top)</option>
                <option value="codechef_solved">Sort by Problems Solved (High → Low)</option>
              </>
            )}
          </select>
        </div>

        {/* Verification & Methodology Notice */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              <strong>Platform World Rank</strong> reflects official platform position. <strong>Institutional Rank</strong> is the student's relative rank within the filtered college cohort.
            </span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="rounded text-[var(--brand-primary)]"
            />
            <span>Show Only Verified Profiles</span>
          </label>
        </div>
      </div>

      {/* =========================================================================
          RANKINGS TABLE
          ========================================================================= */}
      <div className="card-base p-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Loading platform rankings...
          </div>
        ) : rankedStudents.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No students found with {activeTab.toUpperCase()} profiles for current filters.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Try adjusting the branch, batch, or semester filter above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-14 text-center">Inst. Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Handle & URL</th>

                  {/* Tab-Specific Columns */}
                  {activeTab === 'leetcode' && (
                    <>
                      <th className="py-3 px-3">Platform World Rank</th>
                      <th className="py-3 px-3">Contest Rating</th>
                      <th className="py-3 px-3">Total Solved</th>
                      <th className="py-3 px-3">Difficulty (E / M / H)</th>
                      <th className="py-3 px-3">Contests</th>
                    </>
                  )}

                  {activeTab === 'gfg' && (
                    <>
                      <th className="py-3 px-3">Coding Score</th>
                      <th className="py-3 px-3">Total Solved</th>
                      <th className="py-3 px-3">Institute Rank</th>
                      <th className="py-3 px-3">Platform Global Rank</th>
                    </>
                  )}

                  {activeTab === 'codechef' && (
                    <>
                      <th className="py-3 px-3">Global Rank</th>
                      <th className="py-3 px-3">Country Rank</th>
                      <th className="py-3 px-3">Rating & Stars</th>
                      <th className="py-3 px-3">Total Solved</th>
                    </>
                  )}

                  <th className="py-3 px-3">Last Sync</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {rankedStudents.map((st, index) => {
                  const instRank = index + 1;

                  return (
                    <tr key={st.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Institutional Rank Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs ${
                          instRank === 1 ? 'bg-amber-500 text-white shadow-xs' :
                          instRank === 2 ? 'bg-slate-400 text-white' :
                          instRank === 3 ? 'bg-amber-700 text-white' :
                          'bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                        }`}>
                          {instRank}
                        </span>
                      </td>

                      {/* Student Dossier */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--text-primary)]">
                          <Link to={`/students/${st.id}`} className="hover:text-[var(--brand-primary)]">
                            {st.name}
                          </Link>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {st.branch?.split(' ')[0]} • {st.batch} ({st.semester})
                        </div>
                      </td>

                      {/* Platform Handle Link */}
                      <td className="py-3 px-3 font-mono text-xs">
                        {activeTab === 'leetcode' && (
                          st.leetcode_username ? (
                            <a
                              href={st.leetcode_url || `https://leetcode.com/u/${st.leetcode_username}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FFA116] hover:underline flex items-center gap-1"
                            >
                              <span>{st.leetcode_username}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-[var(--text-muted)] font-sans">Unlinked</span>
                        )}
                        {activeTab === 'gfg' && (
                          st.gfg_username ? (
                            <a
                              href={st.gfg_url || `https://auth.geeksforgeeks.org/user/${st.gfg_username}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2F8D46] hover:underline flex items-center gap-1"
                            >
                              <span>{st.gfg_username}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-[var(--text-muted)] font-sans">Unlinked</span>
                        )}
                        {activeTab === 'codechef' && (
                          st.codechef_username ? (
                            <a
                              href={st.codechef_url || `https://www.codechef.com/users/${st.codechef_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8B5CF6] hover:underline flex items-center gap-1"
                            >
                              <span>{st.codechef_username}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-[var(--text-muted)] font-sans">Unlinked</span>
                        )}
                      </td>

                      {/* LeetCode Columns */}
                      {activeTab === 'leetcode' && (
                        <>
                          <td className="py-3 px-3 font-mono font-bold text-xs">
                            {st.leetcode_global_rank ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                #{st.leetcode_global_rank.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)] font-normal font-sans">
                                N/A — rank unavailable
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-sm text-[#FFA116]">
                            {st.leetcode_rating || <span className="text-[var(--text-muted)] font-normal text-xs font-sans">Unrated</span>}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-xs">
                            {st.leetcode_solved || 0}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]">
                            <span className="text-emerald-600 font-bold">{st.leetcode_easy || 0}</span>
                            {' / '}
                            <span className="text-amber-600 font-bold">{st.leetcode_medium || 0}</span>
                            {' / '}
                            <span className="text-rose-600 font-bold">{st.leetcode_hard || 0}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">
                            {st.leetcode_contests || 0}
                          </td>
                        </>
                      )}

                      {/* GFG Columns */}
                      {activeTab === 'gfg' && (
                        <>
                          <td className="py-3 px-3 font-mono font-bold text-sm text-[#2F8D46]">
                            {st.gfg_score !== null && st.gfg_score !== undefined ? st.gfg_score : (st.gfg_solved ? st.gfg_solved * 3 : '—')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-xs">
                            {st.gfg_solved || 0}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            {st.gfg_institute_rank ? `#${st.gfg_institute_rank}` : '—'}
                          </td>
                          <td className="py-3 px-3 font-sans text-xs text-[var(--text-muted)]">
                            <span className="px-2 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)]">
                              N/A — Not provided by public GFG
                            </span>
                          </td>
                        </>
                      )}

                      {/* CodeChef Columns */}
                      {activeTab === 'codechef' && (
                        <>
                          <td className="py-3 px-3 font-mono font-bold text-xs">
                            {st.codechef_global_rank ? (
                              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 border border-purple-500/20">
                                #{st.codechef_global_rank.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)] font-normal font-sans">
                                N/A — rank unavailable
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">
                            {st.codechef_country_rank ? `#${st.codechef_country_rank.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-xs text-[#8B5CF6]">
                            {st.codechef_rating ? `${st.codechef_rating} (${st.codechef_stars || '★'})` : <span className="text-[var(--text-muted)] font-normal font-sans">Unrated</span>}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-xs">
                            {st.codechef_solved || 0}
                          </td>
                        </>
                      )}

                      {/* Last Sync */}
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        {activeTab === 'leetcode' && formatSyncTime(st.leetcode_sync)}
                        {activeTab === 'gfg' && formatSyncTime(st.gfg_sync)}
                        {activeTab === 'codechef' && formatSyncTime(st.codechef_sync)}
                      </td>

                      {/* Profile Link */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/students/${st.id}`}
                          className="text-xs font-semibold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
