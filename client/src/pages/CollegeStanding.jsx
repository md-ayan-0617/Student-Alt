import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Info,
  Award,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getBenchmarks, getOverviewMetrics } from '../services/api';
import KpiCard from '../components/cards/KpiCard';

export default function CollegeStanding() {
  const { filters } = useApp();
  const [benchmarks, setBenchmarks] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bRes, oRes] = await Promise.all([
          getBenchmarks(),
          getOverviewMetrics({ branch: filters.branch, batch: filters.batch })
        ]);
        if (bRes.success) setBenchmarks(bRes.data);
        if (oRes.success) setOverview(oRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.branch, filters.batch]);

  const hasPartners = (benchmarks?.comparisonPartners || []).length > 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Institutional Benchmarks
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            College Standing & Inter-Institutional Benchmarks
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Institutional standing evaluated against internal historical baselines and verified authorized contest league datasets. No synthetic external rankings or national percentiles are fabricated.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Internal Growth Index"
          value={benchmarks?.internalProgressIndex ? `${benchmarks.internalProgressIndex} / 100` : 'No Baseline Yet'}
          subvalue="Progression vs Previous Semester"
          icon={TrendingUp}
          badgeText="Internal Baseline"
        />
        <KpiCard
          title="Platform Adoption Rate"
          value={`${overview?.coverage?.coveragePct || 0}%`}
          subvalue={`${overview?.coverage?.withAnyPlatform || 0} active students`}
          icon={CheckCircle2}
          badgeText="Campus Coverage"
          badgeColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
        />
        <KpiCard
          title="Benchmark Dataset Status"
          value={hasPartners ? 'Verified Partners' : 'No External Datasets'}
          subvalue={hasPartners ? 'Authorized event cohorts' : 'Upload contest roster to compare'}
          icon={Award}
          badgeText="Authorized Data"
          badgeColor="text-purple-400 bg-purple-500/10 border-purple-500/30"
        />
      </div>

      {/* Methodology and External Comparison Disclosure */}
      <div className="card-base p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[var(--accent-teal)] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Institutional Transparency & Benchmarking Disclosure
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {benchmarks?.methodologyNotice || 'External benchmarking requires authorized inter-institutional contest datasets.'}
            </p>
          </div>
        </div>

        <div className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--surface-elevated)]/40 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
            Verified External Partner Datasets:
          </div>
          {hasPartners ? (
            (benchmarks?.comparisonPartners || []).map((cp, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[var(--surface-main)] rounded-lg border border-[var(--border-color)]">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{cp.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">
                    Status: {cp.status} • Participating Students: {cp.activeStudentsContributed}
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge-base bg-emerald-500/10 text-emerald-400 font-mono text-xs">
                    Cohort: {cp.rankCohort}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-[var(--text-muted)]">
              No external partner datasets uploaded yet. Inter-institutional rankings will only display with authorized contest data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
