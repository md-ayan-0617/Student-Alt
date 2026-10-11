import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Trophy,
  ExternalLink,
  Flame,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents, getOverviewMetrics } from '../services/api';
import KpiCard from '../components/cards/KpiCard';
import DifficultyCard from '../components/cards/DifficultyCard';

export default function LeetCodeAnalytics() {
  const { filters } = useApp();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getStudents({
          platform: 'leetcode',
          limit: 30,
          sortBy: 'leetcode_solved',
          sortOrder: 'desc',
          branch: filters.branch,
          batch: filters.batch
        });
        if (res.success) setStudents(res.students);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.branch, filters.batch]);

  const totalSolved = students.reduce((acc, s) => acc + (s.leetcode_solved || 0), 0);
  const easyTotal = students.reduce((acc, s) => acc + (s.leetcode_easy || 0), 0);
  const medTotal = students.reduce((acc, s) => acc + (s.leetcode_medium || 0), 0);
  const hardTotal = students.reduce((acc, s) => acc + (s.leetcode_hard || 0), 0);

  const diffSum = easyTotal + medTotal + hardTotal;
  const diffData = {
    easy: easyTotal,
    medium: medTotal,
    hard: hardTotal,
    easyPct: diffSum > 0 ? Math.round((easyTotal / diffSum) * 100) : 0,
    mediumPct: diffSum > 0 ? Math.round((medTotal / diffSum) * 100) : 0,
    hardPct: diffSum > 0 ? Math.round((hardTotal / diffSum) * 100) : 0
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)] border-amber-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              LeetCode Domain Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            LeetCode Algorithmic Problem-Solving Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Verified GraphQL public profile observations including Easy/Medium/Hard distribution, weekly contest ratings, and cohort progression.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total LeetCode Solved"
          value={totalSolved.toLocaleString()}
          subvalue={`${students.length} linked profiles`}
          icon={Code2}
          badgeText="Platform Solved"
          badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
        />
        <KpiCard
          title="Medium Problems Solved"
          value={medTotal.toLocaleString()}
          subvalue={`${diffData.mediumPct}% of all solved`}
          icon={Trophy}
          badgeText="Intermediate DSA"
          badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
        />
        <KpiCard
          title="Hard Problems Solved"
          value={hardTotal.toLocaleString()}
          subvalue={`${diffData.hardPct}% advanced mastery`}
          icon={Trophy}
          badgeText="Advanced DSA"
          badgeColor="text-rose-400 bg-rose-500/10 border-rose-500/30"
        />
      </div>

      <DifficultyCard difficulty={diffData} />

      {/* Top LeetCode Solvers Table */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] font-semibold text-xs text-[var(--text-primary)]">
          Top LeetCode Problem Solvers in Institution
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Student</th>
              <th className="py-2.5 px-4">Handle</th>
              <th className="py-2.5 px-4">Total Solved</th>
              <th className="py-2.5 px-4">Easy / Med / Hard</th>
              <th className="py-2.5 px-4">Contest Rating</th>
              <th className="py-2.5 px-4 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--text-muted)] text-xs">
                  {loading ? 'Fetching verified LeetCode profiles...' : 'No student LeetCode profiles matching active filters.'}
                </td>
              </tr>
            ) : (
              students.map((st, idx) => (
                <tr key={st.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-[var(--text-muted)]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">
                    <Link to={`/students/${st.id}`} className="hover:text-[var(--accent-blue)]">
                      {st.name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-amber-400">
                    <a
                      href={st.leetcode_url || `https://leetcode.com/u/${st.leetcode_username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                      title="Open LeetCode Public Profile"
                    >
                      @{st.leetcode_username}
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                    {st.leetcode_solved || 0}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--text-muted)]">
                    <span className="text-emerald-400">{st.leetcode_easy || 0}</span> /{' '}
                    <span className="text-amber-400">{st.leetcode_medium || 0}</span> /{' '}
                    <span className="text-rose-400">{st.leetcode_hard || 0}</span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-purple-400">
                    {st.leetcode_rating || '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Link
                      to={`/students/${st.id}`}
                      className="inline-flex items-center gap-1 text-[var(--accent-blue)] hover:underline"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
