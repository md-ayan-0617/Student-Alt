import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Trophy,
  ExternalLink,
  CheckCircle2,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents } from '../services/api';
import KpiCard from '../components/cards/KpiCard';

export default function GFGAnalytics() {
  const { filters } = useApp();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getStudents({
          platform: 'gfg',
          limit: 30,
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

  const totalGfgSolved = students.reduce((acc, s) => acc + (s.gfg_solved || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)] border-emerald-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              GeeksforGeeks Domain Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            GeeksforGeeks Institutional Practice & Coding Score
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Institutional coding score tracking, topic problem volume, and internal college rank on GFG portal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total GFG Solved"
          value={totalGfgSolved.toLocaleString()}
          subvalue={`${students.length} linked profiles`}
          icon={Code2}
          badgeText="Practice Problems"
          badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
        />
        <KpiCard
          title="Avg Problems / Student"
          value={students.length > 0 ? Math.round(totalGfgSolved / students.length) : 0}
          subvalue="Campus Average"
          icon={Award}
          badgeText="Institute Score"
        />
        <KpiCard
          title="Top Performer Score"
          value={students[0]?.gfg_score !== undefined && students[0]?.gfg_score !== null ? `${students[0].gfg_score} pts` : (students[0]?.gfg_solved ? `${students[0].gfg_solved} solved` : '—')}
          subvalue={students[0]?.name || 'No records'}
          icon={Trophy}
          badgeText="Campus Leader"
          badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
        />
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] font-semibold text-xs text-[var(--text-primary)]">
          GeeksforGeeks Student Standings
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Student</th>
              <th className="py-2.5 px-4">GFG Handle</th>
              <th className="py-2.5 px-4">Problems Solved</th>
              <th className="py-2.5 px-4">Coding Score</th>
              <th className="py-2.5 px-4 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--text-muted)] text-xs">
                  {loading ? 'Fetching verified GeeksforGeeks profiles...' : 'No student GeeksforGeeks profiles matching active filters.'}
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
                  <td className="py-2.5 px-4 font-mono text-emerald-400">
                    <a
                      href={st.gfg_url || `https://www.geeksforgeeks.org/user/${st.gfg_username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                      title="Open public GeeksforGeeks profile"
                    >
                      @{st.gfg_username}
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                    {st.gfg_solved !== null && st.gfg_solved !== undefined ? st.gfg_solved : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-emerald-400">
                    {st.gfg_score !== null && st.gfg_score !== undefined ? `${st.gfg_score} pts` : '—'}
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
