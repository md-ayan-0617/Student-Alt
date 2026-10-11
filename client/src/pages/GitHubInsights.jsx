import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Star,
  FolderGit2,
  ExternalLink,
  Code2,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents } from '../services/api';
import KpiCard from '../components/cards/KpiCard';

export default function GitHubInsights() {
  const { filters } = useApp();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getStudents({
          platform: 'github',
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

  const totalRepos = students.reduce((acc, s) => acc + (s.github_repos || 0), 0);
  const totalStars = students.reduce((acc, s) => acc + (s.github_stars || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)] border-blue-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
              Open Source & Software Engineering Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            GitHub Developer Activity & Repository Insights
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Software development tracking via GitHub REST API v3. Repository volume, stars earned, and language spread are distinguished from algorithmic problem solving.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Public Repositories"
          value={totalRepos}
          subvalue={`${students.length} linked GitHub developers`}
          icon={FolderGit2}
          badgeText="Open Source"
          badgeColor="text-blue-400 bg-blue-500/10 border-blue-500/30"
        />
        <KpiCard
          title="Total GitHub Stars Earned"
          value={totalStars}
          subvalue="Community Recognition"
          icon={Star}
          badgeText="Repository Stars"
          badgeColor="text-amber-400 bg-amber-500/10 border-amber-500/30"
        />
        <KpiCard
          title="Developer Cohort Adoption"
          value={`${students.length} Profiles`}
          subvalue="Authorized profile linkages"
          icon={GitBranch}
          badgeText="Linked Cohort"
        />
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] font-semibold text-xs text-[var(--text-primary)]">
          GitHub Student Developer Standings
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Student</th>
              <th className="py-2.5 px-4">GitHub Handle</th>
              <th className="py-2.5 px-4">Public Repos</th>
              <th className="py-2.5 px-4">Stars</th>
              <th className="py-2.5 px-4 text-right">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--text-muted)] text-xs">
                  {loading ? 'Fetching verified GitHub developer profiles...' : 'No student GitHub profiles matching active filters.'}
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
                  <td className="py-2.5 px-4 font-mono text-[var(--brand-primary)]">
                    <a
                      href={st.github_url || `https://github.com/${st.github_username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1"
                      title="Open GitHub Profile"
                    >
                      <span>@{st.github_username}</span>
                      <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                    </a>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                    {st.github_repos !== null && st.github_repos !== undefined ? st.github_repos : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-amber-400 font-bold">
                    {st.github_stars !== null && st.github_stars !== undefined ? `${st.github_stars}★` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Link
                      to={`/students/${st.id}`}
                      className="inline-flex items-center gap-1 text-[var(--accent-blue)] hover:underline"
                    >
                      <span>Dossier</span>
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
