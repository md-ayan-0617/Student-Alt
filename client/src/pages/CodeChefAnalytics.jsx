import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Star,
  ExternalLink,
  Award,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents } from '../services/api';
import KpiCard from '../components/cards/KpiCard';

export default function CodeChefAnalytics() {
  const { filters } = useApp();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getStudents({
          platform: 'codechef',
          limit: 30,
          sortBy: 'codechef_rating',
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

  const maxRating = students.length > 0 ? Math.max(...students.map(s => s.codechef_rating || 0)) : 0;
  const fourStars = students.filter(s => (s.codechef_rating || 0) >= 1800).length;
  const threeStars = students.filter(s => (s.codechef_rating || 0) >= 1600 && (s.codechef_rating || 0) < 1800).length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)] border-purple-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
              CodeChef Competitive Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            CodeChef Competitive Programming Ratings & Star Cohorts
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Division rating analysis, contest stars (1★ to 7★), and global rank progression.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Peak CodeChef Rating"
          value={maxRating || '—'}
          subvalue="Institutional Record"
          icon={Trophy}
          badgeText="Div 1 / Div 2"
          badgeColor="text-purple-400 bg-purple-500/10 border-purple-500/30"
        />
        <KpiCard
          title="4-Star Competitors (1800+)"
          value={fourStars}
          subvalue="Elite Competitive Programmers"
          icon={Star}
          badgeText="4★ Cohort"
          badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
        />
        <KpiCard
          title="3-Star Competitors (1600+)"
          value={threeStars}
          subvalue="Strong Problem Solvers"
          icon={Award}
          badgeText="3★ Cohort"
        />
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] font-semibold text-xs text-[var(--text-primary)]">
          CodeChef Rated Competitors
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Student</th>
              <th className="py-2.5 px-4">Handle</th>
              <th className="py-2.5 px-4">Rating</th>
              <th className="py-2.5 px-4">Star Category</th>
              <th className="py-2.5 px-4">Problems Solved</th>
              <th className="py-2.5 px-4 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--text-muted)] text-xs">
                  {loading ? 'Fetching verified CodeChef profiles...' : 'No student CodeChef profiles matching active filters.'}
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
                  <td className="py-2.5 px-4 font-mono text-purple-400">
                    <a
                      href={st.codechef_url || `https://www.codechef.com/users/${st.codechef_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                      title="Open public CodeChef profile"
                    >
                      @{st.codechef_username}
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                    {st.codechef_rating ? st.codechef_rating : 'Unrated'}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-amber-400">
                    {st.codechef_stars || '—'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[var(--text-primary)]">
                    {st.codechef_solved !== null && st.codechef_solved !== undefined ? st.codechef_solved : '—'}
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
