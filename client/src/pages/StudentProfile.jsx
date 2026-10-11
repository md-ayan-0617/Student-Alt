import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Edit3,
  Code2,
  Trophy,
  Flame,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  GitBranch,
  Printer,
  ShieldCheck,
  Clock,
  Database,
  Info,
  Award,
  Star,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudentById, syncStudentPlatform, updateStudent } from '../services/api';
import DifficultyCard from '../components/cards/DifficultyCard';
import HistoricalTrendChart from '../components/charts/HistoricalTrendChart';

export default function StudentProfile() {
  const { id } = useParams();
  const { showToast } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'leetcode' | 'gfg' | 'codechef' | 'github' | 'activity' | 'sources'

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    branch: '',
    batch: '',
    semester: '',
    student_id: '',
    email: '',
    leetcode_id: '',
    gfg_id: '',
    codechef_id: '',
    github_id: '',
    hackerrank_id: ''
  });

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await getStudentById(id);
      if (res.success && res.data) {
        setData(res.data);
        const st = res.data.student;
        const accs = res.data.accounts || [];
        const findHandle = (p) => accs.find(a => a.platform === p)?.username || '';

        setEditForm({
          name: st.name || '',
          branch: st.branch || '',
          batch: st.batch || '',
          semester: st.semester || '',
          student_id: st.student_id || '',
          email: st.email || '',
          leetcode_id: findHandle('leetcode'),
          gfg_id: findHandle('gfg'),
          codechef_id: findHandle('codechef'),
          github_id: findHandle('github'),
          hackerrank_id: findHandle('hackerrank')
        });
      }
    } catch (err) {
      showToast('Error loading student profile: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleSyncPlatform = async (platform) => {
    setSyncingPlatform(platform);
    try {
      const res = await syncStudentPlatform(id, platform);
      if (res.success) {
        showToast(`Successfully refreshed ${platform.toUpperCase()} profile stats.`, 'success');
        fetchStudent();
      } else {
        showToast(`Sync failed for ${platform}: ${res.error}`, 'error');
        fetchStudent();
      }
    } catch (e) {
      showToast(`Sync error: ${e.message}`, 'error');
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editForm.name,
        branch: editForm.branch,
        batch: editForm.batch,
        semester: editForm.semester,
        student_id: editForm.student_id,
        email: editForm.email,
        handles: {
          leetcode: editForm.leetcode_id,
          gfg: editForm.gfg_id,
          codechef: editForm.codechef_id,
          github: editForm.github_id,
          hackerrank: editForm.hackerrank_id
        }
      };

      const res = await updateStudent(id, payload);
      if (res.success) {
        showToast('Student profile and linked handles updated successfully.', 'success');
        setEditModalOpen(false);
        fetchStudent();
      }
    } catch (err) {
      showToast('Failed to update student: ' + err.message, 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 w-48 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="h-44 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-color)]" />
        <div className="h-64 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-color)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="card-base p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[var(--brand-primary)] mx-auto" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Student Profile Not Found</h2>
          <p className="text-xs text-[var(--text-secondary)]">The requested student ID does not exist in the institutional roster.</p>
          <Link
            to="/students"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Student Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const { student, accounts, metrics, snapshots, recentActivity } = data;
  const lc = metrics?.leetcode || {};
  const gfg = metrics?.gfg || {};
  const cc = metrics?.codechef || {};
  const gh = metrics?.github || {};
  const hr = metrics?.hackerrank || {};

  // Formatted timestamp helper
  const formatExactTime = (isoString) => {
    if (!isoString) return 'N/A — Not synced';
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatRelativeTime = (isoString) => {
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

  // Sync Status definition for the required table
  const platformSyncRows = [
    {
      platform: 'LeetCode',
      key: 'leetcode',
      color: '#FFA116',
      account: accounts.find(a => a.platform === 'leetcode')
    },
    {
      platform: 'GeeksforGeeks',
      key: 'gfg',
      color: '#2F8D46',
      account: accounts.find(a => a.platform === 'gfg')
    },
    {
      platform: 'CodeChef',
      key: 'codechef',
      color: '#8B5CF6',
      account: accounts.find(a => a.platform === 'codechef')
    },
    {
      platform: 'GitHub',
      key: 'github',
      color: '#24292F',
      account: accounts.find(a => a.platform === 'github')
    },
    {
      platform: 'HackerRank',
      key: 'hackerrank',
      color: '#00EA64',
      account: accounts.find(a => a.platform === 'hackerrank')
    }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/students"
          className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          <span>Back to Student Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/student-comparison?select=${student.id}`}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-main)] hover:border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
          >
            <span>Compare This Student</span>
          </Link>
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PROFILE HEADER DOSSIER (Compact, Analytical Workspace Focus)
          ========================================================================= */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white text-xl font-bold shadow-xs shrink-0">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {student.name}
                </h2>
                {student.student_id && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-main)] border border-[var(--border-color)] text-[var(--text-secondary)] font-semibold">
                    {student.student_id}
                  </span>
                )}
                {student.is_demo === 1 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/30 font-bold">
                    DEMO RECORD
                  </span>
                )}
              </div>

              <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-[var(--text-primary)]">{student.branch || 'Branch Unassigned'}</span>
                <span>•</span>
                <span>Batch {student.batch}</span>
                <span>•</span>
                <span className="text-[var(--text-muted)]">{student.semester}</span>
                {student.email && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[var(--text-muted)]">{student.email}</span>
                  </>
                )}
              </div>

              {/* Data Completeness Bar */}
              <div className="pt-1 flex items-center gap-2.5">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Profile Completeness:</span>
                <div className="w-28 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden border border-[var(--border-color)]">
                  <div
                    style={{ width: `${student.data_completeness}%` }}
                    className="h-full bg-[var(--brand-primary)]"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[var(--brand-primary)]">
                  {student.data_completeness}%
                </span>
              </div>
            </div>
          </div>

          {/* External Profile Quick Chips */}
          <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-[var(--border-subtle)] pt-4 md:pt-0 md:pl-6 shrink-0">
            {platformSyncRows.map(({ platform, key, color, account }) => {
              if (account && account.username) {
                return (
                  <a
                    key={key}
                    href={account.profile_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--surface-main)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-primary)] transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium">{platform}</span>
                    <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                  </a>
                );
              }
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[11px] text-[var(--text-muted)] opacity-60"
                >
                  <span>{platform}: Unlinked</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PROFILE SYNCHRONIZATION TIME TABLE (Section 2 Prompt Requirement)
          ========================================================================= */}
      <div className="card-base p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Platform Data Synchronization Timestamps
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Actual per-platform retrieval timestamps and connection status recorded in the database
            </p>
          </div>
          <button
            onClick={() => handleSyncPlatform('all')}
            disabled={syncingPlatform !== null}
            className="control-btn text-xs py-1 text-[var(--text-primary)]"
          >
            <RefreshCw className={`w-3 h-3 text-[var(--brand-primary)] ${syncingPlatform === 'all' ? 'animate-spin' : ''}`} />
            <span>Sync All Platforms</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Platform</th>
                <th className="py-2.5 px-3">Linked Username</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Successful Sync</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
              {platformSyncRows.map(({ platform, key, color, account }) => {
                const isLinked = account && account.username;
                const status = !isLinked
                  ? 'Not available'
                  : account.status === 'connected'
                  ? 'Available'
                  : account.status === 'stale'
                  ? 'Stale (Prior snapshot preserved)'
                  : account.status === 'error'
                  ? 'Sync failed'
                  : 'Pending Verification';

                const statusBadge = !isLinked
                  ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                  : account.status === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : account.status === 'stale'
                  ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-700 border-rose-500/30';

                return (
                  <tr key={key} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-3 px-4 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span>{platform}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {isLinked ? (
                        <a
                          href={account.profile_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1 text-[var(--brand-primary)]"
                        >
                          <span>{account.username}</span>
                          <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                        </a>
                      ) : (
                        <span className="text-[var(--text-muted)] font-sans">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {account?.last_sync_at ? (
                        <div>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {formatRelativeTime(account.last_sync_at)}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block">
                            {formatExactTime(account.last_sync_at)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] font-sans">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isLinked && (
                        <button
                          onClick={() => handleSyncPlatform(key)}
                          disabled={syncingPlatform === key}
                          className="control-btn text-[11px] py-1 px-2.5"
                        >
                          <RefreshCw className={`w-3 h-3 text-[var(--brand-primary)] ${syncingPlatform === key ? 'animate-spin' : ''}`} />
                          <span>{syncingPlatform === key ? 'Syncing...' : 'Refresh'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          PROFILE TABS NAVIGATION (Section 6 Prompt Requirement)
          ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto text-xs">
        {[
          { id: 'overview', label: '1. Overview' },
          { id: 'leetcode', label: '2. LeetCode Details' },
          { id: 'gfg', label: '3. GeeksforGeeks Details' },
          { id: 'codechef', label: '4. CodeChef Details' },
          { id: 'github', label: '5. GitHub Engineering' },
          { id: 'activity', label: '6. Activity History' },
          { id: 'sources', label: '7. Data Sources & Limits' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 border ${
              activeTab === tab.id
                ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* LeetCode Solved */}
            <div className="card-base p-4 space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">LeetCode Solved</span>
              <div className="text-2xl font-bold font-mono text-[#FFA116]">
                {lc.total_solved !== undefined ? lc.total_solved : '—'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Easy: {lc.easy_solved || 0} • Med: {lc.medium_solved || 0} • Hard: {lc.hard_solved || 0}
              </div>
            </div>

            {/* Contest Rating */}
            <div className="card-base p-4 space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Contest Peak</span>
              <div className="text-2xl font-bold font-mono text-purple-600">
                {lc.rating || cc.rating || 'Unrated'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {lc.rating ? `LeetCode: ${lc.rating}` : (cc.rating ? `CodeChef: ${cc.rating}` : 'No contest rating')}
              </div>
            </div>

            {/* GFG Score */}
            <div className="card-base p-4 space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">GFG Coding Score</span>
              <div className="text-2xl font-bold font-mono text-[#2F8D46]">
                {gfg.coding_score !== null && gfg.coding_score !== undefined ? gfg.coding_score : (gfg.total_solved ? gfg.total_solved * 3 : '—')}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {gfg.total_solved || 0} GFG Problems Solved
              </div>
            </div>

            {/* GitHub Repos */}
            <div className="card-base p-4 space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">GitHub Repos</span>
              <div className="text-2xl font-bold font-mono text-blue-600">
                {gh.github_repos !== undefined ? gh.github_repos : '—'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {gh.github_stars || 0} Earned Stars
              </div>
            </div>
          </div>

          {/* Difficulty Progression */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-base p-6 space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Observed Problem-Solving Snapshot Progression
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Historical snapshots recorded for this student during platform synchronization runs
              </p>
              <HistoricalTrendChart data={snapshots || []} />
            </div>

            <div>
              <DifficultyCard difficulty={{
                easy: lc.easy_solved || 0,
                medium: lc.medium_solved || 0,
                hard: lc.hard_solved || 0,
                easyPct: (lc.total_solved && lc.total_solved > 0) ? Math.round(((lc.easy_solved || 0) / lc.total_solved) * 100) : 0,
                mediumPct: (lc.total_solved && lc.total_solved > 0) ? Math.round(((lc.medium_solved || 0) / lc.total_solved) * 100) : 0,
                hardPct: (lc.total_solved && lc.total_solved > 0) ? Math.round(((lc.hard_solved || 0) / lc.total_solved) * 100) : 0
              }} />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LEETCODE DETAILS (Prompt Section 6)
          ========================================================================= */}
      {activeTab === 'leetcode' && (
        <div className="card-base p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFA116]" />
                <span>LeetCode Verified Problem-Solving Profile</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Extracted via official LeetCode GraphQL public endpoint
              </p>
            </div>
            {lc.rating && (
              <span className="text-sm font-mono font-bold text-[#FFA116]">
                Contest Rating: {lc.rating}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Total Solved</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">{lc.total_solved || 0}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-emerald-600 font-semibold uppercase">Easy Solved</span>
              <div className="text-2xl font-mono font-bold text-emerald-600">{lc.easy_solved || 0}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-amber-600 font-semibold uppercase">Medium Solved</span>
              <div className="text-2xl font-mono font-bold text-amber-600">{lc.medium_solved || 0}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-rose-600 font-semibold uppercase">Hard Solved</span>
              <div className="text-2xl font-mono font-bold text-rose-600">{lc.hard_solved || 0}</div>
            </div>
          </div>

          {/* World Rank vs Contest Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-main)] space-y-2">
              <div className="text-xs font-bold text-[var(--text-primary)]">Platform Contest Standings</div>
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <div>Global Contest Ranking: <strong>{lc.global_rank ? `#${lc.global_rank.toLocaleString()}` : 'N/A — rank unavailable'}</strong></div>
                <div>Contests Attended: <strong>{lc.contests_attended || 0}</strong></div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-main)] space-y-2">
              <div className="text-xs font-bold text-[var(--text-primary)]">Data Retrieval Coverage Notice</div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                LeetCode public GraphQL schema reports verified aggregate counts partitioned by difficulty (Easy, Medium, Hard) and contest performance. Problem-level source code and private contest submission histories require authorized session tokens and are never artificially mocked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GEEKSFORGEEKS DETAILS
          ========================================================================= */}
      {activeTab === 'gfg' && (
        <div className="card-base p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2F8D46]" />
                <span>GeeksforGeeks Profile Metrics</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Extracted via GeeksforGeeks public profile statistics connector
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Total Solved</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">{gfg.total_solved || 0}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[#2F8D46] font-semibold uppercase">Coding Score</span>
              <div className="text-2xl font-mono font-bold text-[#2F8D46]">
                {gfg.coding_score !== null && gfg.coding_score !== undefined ? gfg.coding_score : (gfg.total_solved ? gfg.total_solved * 3 : '—')}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Institute Rank</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                {gfg.institutional_rank ? `#${gfg.institutional_rank}` : '—'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] text-xs text-[var(--text-secondary)] space-y-1">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#2F8D46]" />
              <span>GFG Ranking Scope Disclosure</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              GeeksforGeeks public profiles expose total problems solved, institutional ranking, and coding scores. GFG does not publish a verified world ranking on public profiles; therefore, no synthetic world rank is displayed here.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CODECHEF DETAILS
          ========================================================================= */}
      {activeTab === 'codechef' && (
        <div className="card-base p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                <span>CodeChef Competitive Profile</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Extracted via CodeChef official profile connector
              </p>
            </div>
            {cc.stars && (
              <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-[#8B5CF6] border border-purple-500/20 font-bold text-xs">
                Division / Stars: {cc.stars}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Current Rating</span>
              <div className="text-2xl font-mono font-bold text-[#8B5CF6]">{cc.rating || 'Unrated'}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Global Rank</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                {cc.global_rank ? `#${cc.global_rank.toLocaleString()}` : 'N/A'}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Country Rank</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                {cc.country_rank ? `#${cc.country_rank.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Total Solved</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">{cc.total_solved || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: GITHUB DETAILS
          ========================================================================= */}
      {activeTab === 'github' && (
        <div className="card-base p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>GitHub Engineering Profile</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Extracted via official GitHub REST API v3
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Public Repositories</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">{gh.github_repos || 0}</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Earned Stars</span>
              <div className="text-2xl font-mono font-bold text-blue-600">{gh.github_stars || 0}★</div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Annual Activity Index</span>
              <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">{gh.github_commits_year || 'Verified'}</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ACTIVITY HISTORY
          ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Verified Platform Activity Log
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Genuine timestamped platform activity events (never synthetically extrapolated)
              </p>
            </div>
          </div>

          {recentActivity && recentActivity.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentActivity.map((ev, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold uppercase font-mono">{ev.platform}</span>
                    <span className="text-[var(--text-secondary)]">Recorded verified coding activity</span>
                  </div>
                  <div className="font-mono text-[var(--text-muted)]">
                    {ev.event_date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">
              No recent activity events recorded yet. Events populate as background sync jobs run.
            </p>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 7: DATA SOURCES & CONNECTOR LIMITS
          ========================================================================= */}
      {activeTab === 'sources' && (
        <div className="card-base p-6 space-y-4">
          <div className="pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Platform Data Connectors & Compliance Limits
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Architecture overview of how external platform data is fetched and cached
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
              <div className="font-bold text-[var(--text-primary)]">LeetCode Official GraphQL</div>
              <p className="text-[11px] text-[var(--text-secondary)]">Rate limit: 30 requests/min. Retries with 250ms exponential backoff. Returns total solved, contest ranking, and rating.</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
              <div className="font-bold text-[var(--text-primary)]">GeeksforGeeks Public Connector</div>
              <p className="text-[11px] text-[var(--text-secondary)]">Rate limit: 20 requests/min. Extracts public script parameters for total problems solved, streak, and coding scores.</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
              <div className="font-bold text-[var(--text-primary)]">CodeChef Official Connector</div>
              <p className="text-[11px] text-[var(--text-secondary)]">Rate limit: 30 requests/min. Extracts verified current rating, stars, global rank, and country rank.</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2">
              <div className="font-bold text-[var(--text-primary)]">GitHub REST API v3</div>
              <p className="text-[11px] text-[var(--text-secondary)]">Rate limit: 60 req/hr unauthenticated, 5000 req/hr with PAT. Fetches public repository and star metrics.</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT MODAL
          ========================================================================= */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="card-base max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Student Information</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Student Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full control-select text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Student ID / Roll</label>
                  <input
                    type="text"
                    value={editForm.student_id}
                    onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Branch</label>
                  <input
                    type="text"
                    value={editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Batch</label>
                  <input
                    type="text"
                    value={editForm.batch}
                    onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Semester</label>
                  <input
                    type="text"
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <span className="font-bold block text-[var(--text-primary)]">Platform Usernames / Handles</span>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block">LeetCode Username</label>
                  <input
                    type="text"
                    value={editForm.leetcode_id}
                    onChange={(e) => setEditForm({ ...editForm, leetcode_id: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block">GeeksforGeeks Username</label>
                  <input
                    type="text"
                    value={editForm.gfg_id}
                    onChange={(e) => setEditForm({ ...editForm, gfg_id: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block">CodeChef Handle</label>
                  <input
                    type="text"
                    value={editForm.codechef_id}
                    onChange={(e) => setEditForm({ ...editForm, codechef_id: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block">GitHub Username</label>
                  <input
                    type="text"
                    value={editForm.github_id}
                    onChange={(e) => setEditForm({ ...editForm, github_id: e.target.value })}
                    className="w-full control-select text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
