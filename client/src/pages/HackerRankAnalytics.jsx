import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents } from '../services/api';
import KpiCard from '../components/cards/KpiCard';

export default function HackerRankAnalytics() {
  const { filters } = useApp();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getStudents({
          platform: 'hackerrank',
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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)] border-green-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
              HackerRank Assessment Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            HackerRank Verified Skill Badges & Certifications
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Administrator-linked HackerRank profiles with problem-solving domain badges and algorithmic assessments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Linked HackerRank Profiles"
          value={students.length}
          subvalue="Admin-linked student handles"
          icon={Award}
          badgeText="Verified Link"
          badgeColor="text-green-400 bg-green-500/10 border-green-500/30"
        />
        <KpiCard
          title="Assessment Coverage"
          value={`${students.length > 0 ? 'Active' : 'Pending'}`}
          subvalue="Verified score records"
          icon={CheckCircle2}
          badgeText="Domain Badges"
        />
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] font-semibold text-xs text-[var(--text-primary)]">
          HackerRank Linked Student Cohort
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Student</th>
              <th className="py-2.5 px-4">HackerRank Username</th>
              <th className="py-2.5 px-4">Department</th>
              <th className="py-2.5 px-4">Solved / Rating</th>
              <th className="py-2.5 px-4 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-[var(--text-muted)]">
                  {loading ? 'Fetching verified HackerRank profiles...' : 'No HackerRank profiles linked yet. Link them via Student Directory or Import.'}
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
                  <td className="py-2.5 px-4 font-mono text-green-400">
                    <a
                      href={st.hackerrank_url || `https://www.hackerrank.com/profile/${st.hackerrank_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                      title="Open public HackerRank profile"
                    >
                      @{st.hackerrank_username}
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>
                  </td>
                  <td className="py-2.5 px-4 text-[var(--text-muted)]">
                    {st.branch || 'General'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[var(--text-primary)]">
                    {st.hackerrank_solved !== null && st.hackerrank_solved !== undefined ? `${st.hackerrank_solved} solved` : (st.hackerrank_rating ? `${st.hackerrank_rating} pts` : '—')}
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
