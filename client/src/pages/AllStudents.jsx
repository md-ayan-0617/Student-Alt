import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  GitBranch,
  X,
  Plus,
  FileEdit
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents } from '../services/api';

export default function AllStudents() {
  const { filters, showToast } = useApp();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState(filters.branch);
  const [batch, setBatch] = useState(filters.batch);
  const [platform, setPlatform] = useState('all');
  const [minSolved, setMinSolved] = useState('');
  const [ratingMin, setRatingMin] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents({
        search,
        branch,
        batch,
        platform,
        minSolved,
        ratingMin,
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      });
      if (res.success) {
        setStudents(res.students);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast('Error loading students: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, branch, batch, platform]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStudents();
  };

  const resetFilters = () => {
    setSearch('');
    setBranch('all');
    setBatch('all');
    setPlatform('all');
    setMinSolved('');
    setRatingMin('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      search,
      branch: branch !== 'all' ? branch : '',
      batch: batch !== 'all' ? batch : '',
      platform: platform !== 'all' ? platform : '',
      minSolved,
      ratingMin
    });
    window.location.href = `/api/students/export-csv?${params.toString()}`;
    showToast('Exporting filtered student dataset as CSV...', 'info');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            All Students Directory
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Verified institutional roster with platform connectivity and cross-platform problem counts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
            <span>Export CSV</span>
          </button>
          <Link
            to="/import?tab=edit"
            className="px-3 py-2 rounded-lg bg-[#EA5652]/10 border border-[#EA5652]/40 hover:bg-[#EA5652]/20 text-[#EA5652] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FileEdit className="w-3.5 h-3.5 text-[#EA5652]" />
            <span>Edit JSON Roster</span>
          </Link>
          <Link
            to="/import"
            className="px-3.5 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-medium hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import / Add Students</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="card-base p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or platform handle..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={branch}
              onChange={(e) => { setBranch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)]"
            >
              <option value="all">All Branches</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Artificial Intelligence & Data Science">AI & DS</option>
              <option value="Electronics & Communication">ECE</option>
            </select>

            <select
              value={batch}
              onChange={(e) => { setBatch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)]"
            >
              <option value="all">All Batches</option>
              <option value="2022-2026">2022-2026</option>
              <option value="2023-2027">2023-2027</option>
              <option value="2024-2028">2024-2028</option>
            </select>

            <select
              value={platform}
              onChange={(e) => { setPlatform(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)]"
            >
              <option value="all">All Platforms</option>
              <option value="leetcode">Has LeetCode</option>
              <option value="gfg">Has GeeksforGeeks</option>
              <option value="codechef">Has CodeChef</option>
              <option value="github">Has GitHub</option>
              <option value="hackerrank">Has HackerRank</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[var(--accent-blue)] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Apply Filter
            </button>

            {(search || branch !== 'all' || batch !== 'all' || platform !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg"
                title="Reset filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium select-none">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Master</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Academic Details</th>
                <th
                  onClick={() => handleSort('leetcode_solved')}
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400">LeetCode</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <span className="text-emerald-400">GeeksforGeeks</span>
                </th>
                <th
                  onClick={() => handleSort('codechef_rating')}
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-purple-400">CodeChef</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <span className="text-blue-400">GitHub</span>
                </th>
                <th
                  onClick={() => handleSort('completeness')}
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Completeness</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--text-muted)]">
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--text-muted)]">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-[var(--surface-hover)] transition-colors group"
                  >
                    {/* Student Name & Roll */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-color)] flex items-center justify-center font-semibold text-xs text-[var(--text-primary)] shrink-0">
                          {student.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <Link
                            to={`/students/${student.id}`}
                            className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors truncate block"
                          >
                            {student.name}
                          </Link>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {student.student_id || 'ID Unassigned'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Academic */}
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-[var(--text-primary)] truncate max-w-[140px]">
                        {student.branch || 'General'}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {student.batch} • {student.semester}
                      </div>
                    </td>

                    {/* LeetCode */}
                    <td className="py-3 px-4">
                      {student.leetcode_username ? (
                        <div>
                          <div className="font-mono font-bold text-[var(--text-primary)] text-xs">
                            {student.leetcode_solved !== null ? `${student.leetcode_solved} solved` : 'Pending sync'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                            <span className="text-amber-400">@{student.leetcode_username}</span>
                            {student.leetcode_rating && (
                              <span className="text-emerald-400">★ {student.leetcode_rating}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono italic">
                          Not Linked
                        </span>
                      )}
                    </td>

                    {/* GFG */}
                    <td className="py-3 px-4">
                      {student.gfg_username ? (
                        <div>
                          <div className="font-mono font-bold text-[var(--text-primary)] text-xs">
                            {student.gfg_solved !== null ? `${student.gfg_solved} solved` : 'Pending sync'}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono truncate max-w-[120px]">
                            @{student.gfg_username}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono italic">
                          Not Linked
                        </span>
                      )}
                    </td>

                    {/* CodeChef */}
                    <td className="py-3 px-4">
                      {student.codechef_username ? (
                        <div>
                          <div className="font-mono font-bold text-[var(--text-primary)] text-xs">
                            {student.codechef_rating ? `${student.codechef_rating} (${student.codechef_stars || '—'})` : 'Unrated'}
                          </div>
                          <div className="text-[10px] text-purple-400 font-mono truncate max-w-[120px]">
                            @{student.codechef_username}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono italic">
                          Not Linked
                        </span>
                      )}
                    </td>

                    {/* GitHub */}
                    <td className="py-3 px-4">
                      {student.github_username ? (
                        <div>
                          <div className="font-mono font-bold text-[var(--text-primary)] text-xs">
                            {student.github_repos || 0} repos
                          </div>
                          <div className="text-[10px] text-blue-400 font-mono truncate max-w-[120px]">
                            @{student.github_username}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono italic">
                          Not Linked
                        </span>
                      )}
                    </td>

                    {/* Completeness */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                          <div
                            style={{ width: `${student.data_completeness}%` }}
                            className="h-full bg-gradient-to-r from-[#EA5652] to-[#ED8368]"
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                          {student.data_completeness}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/students/${student.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs text-[var(--text-primary)] transition-colors"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3 text-[var(--accent-blue)]" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-[var(--surface-elevated)]/40 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div>
            Showing <span className="font-mono font-medium text-[var(--text-primary)]">{students.length}</span> of{' '}
            <span className="font-mono font-medium text-[var(--text-primary)]">{pagination.total}</span> students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded border border-[var(--border-color)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded border border-[var(--border-color)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
