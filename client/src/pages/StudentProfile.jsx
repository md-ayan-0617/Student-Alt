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
  Printer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudentById, syncStudentPlatform, syncAllStudentPlatforms, updateStudent } from '../services/api';
import DifficultyCard from '../components/cards/DifficultyCard';
import HistoricalTrendChart from '../components/charts/HistoricalTrendChart';

export default function StudentProfile() {
  const { id } = useParams();
  const { showToast } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

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
        showToast(`Failed to sync ${platform}: ${res.error}`, 'error');
      }
    } catch (e) {
      showToast(`Sync error: ${e.message}`, 'error');
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleSyncAllPlatforms = async () => {
    setSyncingPlatform('all');
    try {
      const res = await syncAllStudentPlatforms(id);
      if (res.success) {
        showToast('Successfully refreshed all linked platform profiles!', 'success');
        fetchStudent();
      } else {
        showToast(`Sync failed: ${res.error}`, 'error');
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
      const res = await updateStudent(id, editForm);
      if (res.success) {
        showToast('Student profile and linked platforms updated.', 'success');
        setEditModalOpen(false);
        fetchStudent();
      }
    } catch (e) {
      showToast('Update error: ' + e.message, 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-40 bg-[var(--surface-elevated)] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-60 bg-[var(--surface-elevated)] rounded-xl" />
          <div className="h-60 bg-[var(--surface-elevated)] rounded-xl" />
          <div className="h-60 bg-[var(--surface-elevated)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Student Profile Not Found</h2>
        <Link to="/students" className="text-xs text-[var(--accent-blue)] mt-2 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  const { student, accounts, metrics, snapshots, recentActivity } = data;
  const lc = metrics.leetcode || {};
  const gfg = metrics.gfg || {};
  const cc = metrics.codechef || {};
  const gh = metrics.github || {};
  const hr = metrics.hackerrank || {};

  const totalReportedSolved = (lc.total_solved || 0) + (gfg.total_solved || 0);
  const diffData = {
    easy: (lc.easy_solved || 0) + (gfg.easy_solved || 0),
    medium: (lc.medium_solved || 0) + (gfg.medium_solved || 0),
    hard: (lc.hard_solved || 0) + (gfg.hard_solved || 0)
  };
  const diffSum = diffData.easy + diffData.medium + diffData.hard;
  diffData.easyPct = diffSum > 0 ? Math.round((diffData.easy / diffSum) * 100) : 0;
  diffData.mediumPct = diffSum > 0 ? Math.round((diffData.medium / diffSum) * 100) : 0;
  diffData.hardPct = diffSum > 0 ? Math.round((diffData.hard / diffSum) * 100) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Back button & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Students Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
          <button
            onClick={handleSyncAllPlatforms}
            disabled={syncingPlatform !== null}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] hover:border-[#EA5652] text-xs text-[#EA5652] font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingPlatform === 'all' ? 'animate-spin' : ''}`} />
            <span>{syncingPlatform === 'all' ? 'Refreshing All...' : 'Refresh All Platforms'}</span>
          </button>
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] text-xs text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span>Edit Profile & Link Handles</span>
          </button>
        </div>
      </div>

      {/* Profile Header Dossier */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[#EA5652] via-[#ED8368] to-[#832008] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#EA5652]/20 shrink-0">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {student.name}
                </h2>
                {student.student_id && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {student.student_id}
                  </span>
                )}
                {student.is_demo === 1 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    DEMO STUDENT
                  </span>
                )}
              </div>

              <div className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{student.branch || 'Branch Unassigned'}</span>
                <span>•</span>
                <span>{student.batch} ({student.semester})</span>
                {student.email && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[var(--text-muted)]">{student.email}</span>
                  </>
                )}
              </div>

              {/* Data Completeness Score */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)]">Data Completeness:</span>
                <div className="w-32 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden border border-[var(--border-color)]">
                  <div
                    style={{ width: `${student.data_completeness}%` }}
                    className="h-full bg-gradient-to-r from-[#EA5652] to-[#ED8368]"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[var(--accent-teal)]">
                  {student.data_completeness}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Solved Metric Box */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[var(--border-color)] pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Combined Solved
              </div>
              <div className="text-2xl lg:text-3xl font-mono font-bold text-emerald-400 mt-1">
                {totalReportedSolved.toLocaleString()}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                LC: {lc.total_solved || 0} | GFG: {gfg.total_solved || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Accounts Bar */}
        <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Linked Platforms:
          </span>

          {['leetcode', 'gfg', 'codechef', 'github', 'hackerrank'].map((p) => {
            const acc = accounts.find(a => a.platform === p);
            const isSyncing = syncingPlatform === p;

            if (acc && acc.username) {
              return (
                <div
                  key={p}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-primary)]"
                >
                  <span className="font-semibold capitalize text-[11px] text-[var(--text-secondary)]">{p}:</span>
                  <a
                    href={acc.profile_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                  >
                    <span>@{acc.username}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <button
                    onClick={() => handleSyncPlatform(p)}
                    disabled={isSyncing}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1"
                    title={`Refresh ${p} data`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[var(--accent-blue)]' : ''}`} />
                  </button>
                </div>
              );
            }

            return (
              <span
                key={p}
                className="text-[11px] font-mono text-[var(--text-muted)] px-2 py-0.5 rounded border border-dashed border-[var(--border-color)]"
              >
                {p}: Unlinked
              </span>
            );
          })}
        </div>
      </div>

      {/* Row 2: Deep Dive Cards for each Platform */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* LeetCode Card */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">LeetCode</h3>
            </div>
            {lc.rating && (
              <span className="text-xs font-mono font-bold text-amber-400">
                {lc.rating} Contest Rating
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Total Solved</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {lc.total_solved !== undefined ? lc.total_solved : '—'}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Global Ranking</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {lc.global_rank ? `#${lc.global_rank.toLocaleString()}` : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-color)]/50 text-xs">
            <div>
              <span className="text-[10px] text-emerald-400 font-medium">Easy</span>
              <div className="font-mono font-semibold">{lc.easy_solved || 0}</div>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-medium">Medium</span>
              <div className="font-mono font-semibold">{lc.medium_solved || 0}</div>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 font-medium">Hard</span>
              <div className="font-mono font-semibold">{lc.hard_solved || 0}</div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-1 flex items-center justify-between">
            <span>Contests: <strong className="font-mono text-[var(--text-primary)]">{lc.contests_attended || 0}</strong></span>
            <span>Acceptance: <strong className="font-mono text-[var(--text-primary)]">{lc.acceptance_rate ? `${lc.acceptance_rate}%` : '—'}</strong></span>
          </div>
        </div>

        {/* GeeksforGeeks Card */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">GeeksforGeeks</h3>
            </div>
            {gfg.institutional_rank && (
              <span className="text-xs font-mono font-bold text-emerald-400">
                Inst. #{gfg.institutional_rank}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Total Problems Solved</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {gfg.total_solved !== undefined ? gfg.total_solved : '—'}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Coding Score</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {gfg.coding_score !== undefined && gfg.coding_score !== null ? gfg.coding_score : (gfg.total_solved ? gfg.total_solved * 3 : '—')}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]/50">
            Topic Practice: Arrays, Dynamic Programming, Graphs recorded in institutional logs.
          </div>
        </div>

        {/* CodeChef Card */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">CodeChef</h3>
            </div>
            {cc.stars && (
              <span className="text-xs font-mono font-bold text-purple-400">
                {cc.stars}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Current Rating</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {cc.rating ? cc.rating : 'Unrated'}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Global Rank</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {cc.global_rank ? `#${cc.global_rank.toLocaleString()}` : '—'}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]/50">
            Contests Attended: <strong className="font-mono text-[var(--text-primary)]">{cc.contests_attended || 0}</strong>
          </div>
        </div>

        {/* GitHub Card */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">GitHub</h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Public Activity
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Public Repos</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {gh.github_repos !== undefined ? gh.github_repos : '—'}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">Stars Earned</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                {gh.github_stars !== undefined ? `${gh.github_stars}★` : '—'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)]/50">
            <span className="text-[10px] text-[var(--text-muted)] block mb-1.5">Top Languages:</span>
            {gh.top_languages && gh.top_languages.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {gh.top_languages.map((lang, lIdx) => (
                  <span
                    key={lIdx}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-[var(--text-muted)] italic font-mono">No language statistics reported</span>
            )}
          </div>
        </div>

        {/* Difficulty Breakdown for this Student */}
        <div className="md:col-span-2">
          <DifficultyCard difficulty={diffData} />
        </div>
      </div>

      {/* Row 3: Snapshots Trend */}
      <div className="card-base p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Student Problem-Solving Progression (Historical Snapshots)
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Snapshot intervals recorded over time showing net observed growth
          </p>
        </div>
        <HistoricalTrendChart data={snapshots} />
      </div>

      {/* Edit Profile & Handles Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[var(--surface-main)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--surface-elevated)]/50">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Edit Student Details & Link Platform Handles
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Student Roll / ID</label>
                  <input
                    type="text"
                    value={editForm.student_id}
                    onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Branch</label>
                  <input
                    type="text"
                    value={editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Batch</label>
                  <input
                    type="text"
                    value={editForm.batch}
                    onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Semester</label>
                  <input
                    type="text"
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                  Coding Platform Identifiers
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-amber-400 block mb-1">LeetCode (Username or Profile URL)</label>
                    <input
                      type="text"
                      value={editForm.leetcode_id}
                      onChange={(e) => setEditForm({ ...editForm, leetcode_id: e.target.value })}
                      placeholder="e.g. aarav_coder or https://leetcode.com/aarav_coder/"
                      className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] font-mono text-xs focus:border-[var(--accent-blue)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-emerald-400 block mb-1">GeeksforGeeks (Username or Profile URL)</label>
                    <input
                      type="text"
                      value={editForm.gfg_id}
                      onChange={(e) => setEditForm({ ...editForm, gfg_id: e.target.value })}
                      placeholder="e.g. aarav101 or https://geeksforgeeks.org/user/aarav101/"
                      className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] font-mono text-xs focus:border-[var(--accent-blue)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-purple-400 block mb-1">CodeChef (Handle or Profile URL)</label>
                    <input
                      type="text"
                      value={editForm.codechef_id}
                      onChange={(e) => setEditForm({ ...editForm, codechef_id: e.target.value })}
                      placeholder="e.g. aarav_cc or https://codechef.com/users/aarav_cc"
                      className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] font-mono text-xs focus:border-[var(--accent-blue)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-blue-400 block mb-1">GitHub (Username or Profile URL)</label>
                    <input
                      type="text"
                      value={editForm.github_id}
                      onChange={(e) => setEditForm({ ...editForm, github_id: e.target.value })}
                      placeholder="e.g. aarav-dev or https://github.com/aarav-dev"
                      className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] font-mono text-xs focus:border-[var(--accent-blue)] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-green-400 block mb-1">HackerRank (Username or Profile URL)</label>
                    <input
                      type="text"
                      value={editForm.hackerrank_id}
                      onChange={(e) => setEditForm({ ...editForm, hackerrank_id: e.target.value })}
                      placeholder="e.g. aarav_hr or https://hackerrank.com/profile/aarav_hr"
                      className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] font-mono text-xs focus:border-[var(--accent-blue)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white font-medium hover:opacity-90"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
