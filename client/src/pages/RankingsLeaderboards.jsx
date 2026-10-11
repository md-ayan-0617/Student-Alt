import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Code2,
  TrendingUp,
  GitBranch,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getLeaderboards } from '../services/api';

export default function RankingsLeaderboards() {
  const { filters, showToast } = useApp();
  const [activeLeaderboard, setActiveLeaderboard] = useState('total_solved');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const leaderboardTypes = [
    { id: 'total_solved', label: '1. Total Solved', icon: Code2, desc: 'Sum of platform-reported problems' },
    { id: 'easy_solved', label: '2. Easy Solved', icon: Medal, desc: 'Foundation problem solving volume' },
    { id: 'medium_solved', label: '3. Medium Solved', icon: Trophy, desc: 'Intermediate algorithmic complexity' },
    { id: 'hard_solved', label: '4. Hard Solved', icon: Award, desc: 'Advanced algorithmic mastery' },
    { id: 'cp_rating', label: '5. CP Rating', icon: Trophy, desc: 'Highest verified platform rating' },
    { id: 'consistency', label: '6. Consistency', icon: Flame, desc: 'Verified active practice days' },
    { id: 'improvement_30d', label: '7. 30D Growth', icon: TrendingUp, desc: 'Net observed snapshot progression' },
    { id: 'github_activity', label: '8. GitHub Dev', icon: GitBranch, desc: 'Repositories and earned stars' },
    { id: 'topic_coverage', label: '9. Topic Breadth', icon: Sparkles, desc: 'DSA domain variety practice' }
  ];

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const res = await getLeaderboards(activeLeaderboard, {
        branch: filters.branch,
        batch: filters.batch,
        limit: 50
      });
      if (res.success) {
        setLeaderboardData(res.data || []);
      }
    } catch (e) {
      showToast('Error loading leaderboard: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [activeLeaderboard, filters.branch, filters.batch]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
                Institutional Standings
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Rankings & Student Leaderboards
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl mt-1">
              Strictly distinct rankings for each verifiable domain. Never combines unlike metrics into one misleading platform ranking. Institutional ranks are separated from global platform ranks.
            </p>
          </div>

          <button
            onClick={() => setShowFormulaModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <Info className="w-4 h-4 text-[var(--accent-blue)]" />
            <span>Coding Performance Index Formula</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border-color)] text-xs">
        {leaderboardTypes.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeLeaderboard === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveLeaderboard(tab.id)}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 border ${
                isActive
                  ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] font-semibold shadow-sm'
                  : 'bg-[var(--surface-main)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="card-base overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Department & Batch</th>
              <th className="py-3 px-4 text-right">Metric Value</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-[var(--text-muted)]">
                  Loading leaderboard data...
                </td>
              </tr>
            ) : leaderboardData.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-[var(--text-muted)]">
                  No verified records available for this leaderboard category yet.
                </td>
              </tr>
            ) : (
              leaderboardData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-[var(--surface-hover)] transition-colors group">
                  <td className="py-3 px-4 text-center">
                    <span className={`font-mono font-bold text-xs ${
                      idx === 0 ? 'text-amber-400' : (idx === 1 ? 'text-slate-300' : (idx === 2 ? 'text-amber-600' : 'text-[var(--text-muted)]'))
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-color)] flex items-center justify-center font-semibold text-xs text-[var(--text-primary)] shrink-0">
                        {row.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          to={`/students/${row.id}`}
                          className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors"
                        >
                          {row.name}
                        </Link>
                        {row.student_id && (
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">
                            {row.student_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-[var(--text-secondary)]">
                    <div>{row.branch || 'General'}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{row.batch}</div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {row.metric_value?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {row.metric_label}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/students/${row.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] hover:border-[var(--accent-blue)]"
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

      {/* Index Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--surface-main)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Campus Coding Performance Index Specification
              </h3>
              <button onClick={() => setShowFormulaModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                ✕
              </button>
            </div>

            <p className="text-[var(--text-secondary)] leading-relaxed">
              The optional institutional composite index normalizes student performance across 5 transparent dimensions on a 0-100 scale:
            </p>

            <div className="bg-[var(--surface-elevated)] p-4 rounded-lg space-y-2 font-mono text-[11px] border border-[var(--border-color)]">
              <div className="text-[var(--accent-blue)] font-bold">Composite Formula:</div>
              <div>• Problem Volume (25% weight)</div>
              <div>• Difficulty Progression (25% weight)</div>
              <div>• Coding Consistency (20% weight)</div>
              <div>• Competitive Rating (15% weight)</div>
              <div>• GitHub Development (15% weight)</div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] leading-relaxed">
              <strong>Institutional Integrity Notice:</strong> Composite rankings are provisional when a student has fewer than 2 linked platforms. Missing data is never treated as zero ability.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
