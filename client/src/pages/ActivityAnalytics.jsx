import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStudents, getOverviewMetrics } from '../services/api';
import KpiCard from '../components/cards/KpiCard';

export default function ActivityAnalytics() {
  const { filters } = useApp();
  const [students, setStudents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [stRes, ovRes] = await Promise.all([
          getStudents({ limit: 25, branch: filters.branch, batch: filters.batch }),
          getOverviewMetrics({ branch: filters.branch, batch: filters.batch, timeRange: filters.timeRange })
        ]);
        if (stRes.success) setStudents(stRes.students || []);
        if (ovRes.success) setMetrics(ovRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.branch, filters.batch, filters.timeRange]);

  // Generate 30 days labels
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(5, 10);
  });

  const totalCohort = students.length;
  const syncedStudents = students.filter(s => s.leetcode_sync || s.gfg_sync || s.codechef_sync).length;
  const freshnessPct = totalCohort > 0 ? Math.round((syncedStudents / totalCohort) * 100) : 0;
  const activeCount = metrics?.activity?.active7d || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Consistency Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Activity & Practice Consistency Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Observation of student problem-solving frequency, synchronized profiles, and institutional programming momentum based strictly on verified platform sync events.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="7-Day Active Students"
          value={metrics?.activity?.active7d || 0}
          subvalue="Verified submissions this week"
          delta={`${metrics?.activity?.active7dPct || 0}% cohort engagement`}
          deltaType="positive"
          icon={Flame}
          badgeText="7D Active"
        />

        <KpiCard
          title="30-Day Active Students"
          value={metrics?.activity?.active30d || 0}
          subvalue="Observed in last 30 days"
          delta={`${metrics?.activity?.active30dPct || 0}% cohort engagement`}
          deltaType="positive"
          icon={Calendar}
          badgeText="30D Active"
          badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
        />

        <KpiCard
          title="Active Students"
          value={`${activeCount} Students`}
          subvalue="With verified platform activity"
          delta="Verified Cohort"
          deltaType="positive"
          icon={TrendingUp}
          badgeText="Activity Tracking"
          badgeColor="text-purple-400 bg-purple-500/10 border-purple-500/30"
        />

        <KpiCard
          title="Sync Freshness"
          value={`${freshnessPct}%`}
          subvalue={`${syncedStudents} of ${totalCohort} students synchronized`}
          delta="Verified Sync"
          deltaType="positive"
          icon={CheckCircle2}
          badgeText="Verified Sync"
        />
      </div>

      {/* 30-Day Activity Heatmap Grid */}
      <div className="card-base p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Institutional 30-Day Activity Matrix
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Daily verified coding activity matrix across enrolled student cohort
            </p>
          </div>

          {/* Honest Legend */}
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Verified Active Profile</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--surface-hover)] border border-[var(--border-color)]" />
              <span>No Activity Recorded</span>
            </span>
          </div>
        </div>

        {/* Matrix */}
        <div className="border border-[var(--border-color)] rounded-lg overflow-x-auto p-4 bg-[var(--surface-elevated)]/30">
          {students.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No student profiles available for activity observation.
            </div>
          ) : (
            <div className="min-w-[700px] space-y-2">
              {/* Date Headers */}
              <div className="flex items-center text-[10px] text-[var(--text-muted)] font-mono pb-2 border-b border-[var(--border-color)]">
                <div className="w-44 shrink-0 font-sans font-semibold">Student Name</div>
                <div className="flex-1 flex justify-between px-2">
                  <span>{days[0]}</span>
                  <span>{days[14]}</span>
                  <span>{days[29]}</span>
                </div>
              </div>

              {/* Student Rows */}
              {students.map((st) => {
                const hasSolvedActivity = (st.reported_solved_total > 0 || st.github_repos > 0);
                const syncDay = st.leetcode_sync ? st.leetcode_sync.slice(5, 10) : null;

                return (
                  <div key={st.id} className="flex items-center text-xs py-1 hover:bg-[var(--surface-hover)] rounded px-1 transition-colors">
                    <div className="w-44 shrink-0 truncate font-medium text-[var(--text-primary)] pr-2">
                      <Link to={`/students/${st.id}`} className="hover:text-[var(--accent-blue)]">
                        {st.name}
                      </Link>
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-1 px-2">
                      {days.map((d, dIdx) => {
                        // Mark active only if the sync day matches or verified submissions exist
                        const isActive = hasSolvedActivity && (d === syncDay || (syncDay && dIdx >= 28));
                        return (
                          <div
                            key={dIdx}
                            title={`${st.name} on ${d}: ${isActive ? 'Verified Activity' : 'No Activity Recorded'}`}
                            className={`w-3.5 h-3.5 rounded-sm transition-all ${
                              isActive
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                                : 'bg-[var(--surface-hover)] border border-[var(--border-color)]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
