import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getOverviewMetrics } from '../services/api';

export default function Reports() {
  const { filters, showToast } = useApp();
  const [metrics, setMetrics] = useState(null);
  const [reportType, setReportType] = useState('executive'); // 'executive' | 'departmental' | 'platform'

  useEffect(() => {
    const fetchO = async () => {
      try {
        const res = await getOverviewMetrics({ branch: filters.branch, batch: filters.batch });
        if (res.success) setMetrics(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchO();
  }, [filters.branch, filters.batch]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    window.location.href = `/api/students/export-csv?branch=${filters.branch}&batch=${filters.batch}`;
    showToast('Exporting comprehensive institution dataset as CSV...', 'info');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Banner (hidden during print) */}
      <div className="print:hidden card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
                Institutional Documentation
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Institutional Reports & Verified Exports
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl mt-1">
              Generate audit-ready reports, executive briefings, and official dataset exports with timestamped data verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-[var(--accent-teal)]" />
              <span>Export Roster CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="card-base p-8 space-y-6 bg-[var(--surface-main)] border border-[var(--border-color)] shadow-xl print:border-none print:shadow-none print:p-0">
        {/* Official Header */}
        <div className="border-b-2 border-[var(--border-color)] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-mono tracking-widest text-[var(--accent-teal)] font-bold">
              OFFICIAL INSTITUTIONAL INTELLIGENCE DOSSIER
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              Campus Coding Performance Audit Report
            </h1>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              Rungta Group of Institutions • Office of Academic Computing & DigiiCampus
            </div>
          </div>
          <div className="text-right text-xs font-mono text-[var(--text-muted)] space-y-0.5">
            <div>Report Ref: CCI-REP-{new Date().getFullYear()}</div>
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>Timeframe: {filters.timeRange.toUpperCase()}</div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            1. Institutional Executive Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="card-base p-3 bg-[var(--surface-elevated)]/50">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Total Enrolled Cohort</span>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                {metrics?.totalStudents || 0}
              </div>
            </div>
            <div className="card-base p-3 bg-[var(--surface-elevated)]/50">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Platform Reported Solved</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {metrics?.problemSolving?.totalReported?.toLocaleString() || 0}
              </div>
            </div>
            <div className="card-base p-3 bg-[var(--surface-elevated)]/50">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">30D Active Students</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {metrics?.activity?.active30d || 0}
              </div>
            </div>
            <div className="card-base p-3 bg-[var(--surface-elevated)]/50">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Peak LeetCode Rating</span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                {metrics?.competitiveProgramming?.maxLeetCodeRating || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            2. Algorithmic Difficulty Distribution
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <div className="text-emerald-400 font-bold">Easy Questions Solved</div>
              <div className="text-lg text-[var(--text-primary)] mt-1">{metrics?.difficulty?.easy?.toLocaleString() || 0} ({metrics?.difficulty?.easyPct}%)</div>
            </div>
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <div className="text-amber-400 font-bold">Medium Questions Solved</div>
              <div className="text-lg text-[var(--text-primary)] mt-1">{metrics?.difficulty?.medium?.toLocaleString() || 0} ({metrics?.difficulty?.mediumPct}%)</div>
            </div>
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10">
              <div className="text-rose-400 font-bold">Hard Questions Solved</div>
              <div className="text-lg text-[var(--text-primary)] mt-1">{metrics?.difficulty?.hard?.toLocaleString() || 0} ({metrics?.difficulty?.hardPct}%)</div>
            </div>
          </div>
        </div>

        {/* Platform Adoption */}
        <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            3. Platform Adoption & Verification Breakdown
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] font-medium text-[var(--text-secondary)]">
              <tr>
                <th className="py-2 px-3">Platform</th>
                <th className="py-2 px-3">Linked Accounts</th>
                <th className="py-2 px-3">Verified Profiles</th>
                <th className="py-2 px-3">Platform Solved Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-mono">
              {(metrics?.platforms || []).map((pl, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-sans font-semibold text-[var(--text-primary)]">{pl.name}</td>
                  <td className="py-2 px-3">{pl.accountsLinked}</td>
                  <td className="py-2 px-3 text-emerald-400">{pl.accountsVerified}</td>
                  <td className="py-2 px-3 font-bold">{pl.totalSolved !== null ? pl.totalSolved.toLocaleString() : `${pl.reposCount} repos`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Sign-off Note */}
        <div className="pt-6 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-teal)]" />
            <span>Institutional Audit Certification</span>
          </div>
          <p>
            Generated automatically by Campus Coding Intelligence. External platform metrics reflect official public responses or verified exports. Individual platform values are preserved as independent metrics and not arbitrarily aggregated.
          </p>
        </div>
      </div>
    </div>
  );
}
