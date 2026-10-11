import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Building2,
  Calendar,
  Users,
  Code2,
  Trophy
} from 'lucide-react';
import { getBranchBatchAnalytics } from '../services/api';

export default function BranchBatchComparison() {
  const [data, setData] = useState({ branches: [], batches: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBB = async () => {
      setLoading(true);
      try {
        const res = await getBranchBatchAnalytics();
        if (res.success) setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBB();
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Departmental Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Branch & Batch Comparative Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Cross-tabulation of problem-solving density, competitive programming ratings, and hard question counts across academic departments and graduation batches.
          </p>
        </div>
      </div>

      {/* Branch Table */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[var(--accent-blue)]" />
          <h3 className="font-semibold text-xs text-[var(--text-primary)]">
            Branch / Department Performance Breakdown
          </h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4">Department</th>
              <th className="py-2.5 px-4">Students Enrolled</th>
              <th className="py-2.5 px-4">Total Solved</th>
              <th className="py-2.5 px-4">Avg Solved / Student</th>
              <th className="py-2.5 px-4">Max CP Rating</th>
              <th className="py-2.5 px-4">Hard Solved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] font-mono">
            {data.branches.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--text-muted)] font-sans text-xs">
                  {loading ? 'Analyzing departmental metrics...' : 'No department records available in active dataset.'}
                </td>
              </tr>
            ) : (
              data.branches.map((b, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                    {b.name}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{b.student_count}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{b.total_solved?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[var(--accent-teal)]">{b.avg_solved}</td>
                  <td className="py-3 px-4 font-bold text-purple-400">{b.max_rating || '—'}</td>
                  <td className="py-3 px-4 text-rose-400">{b.hard_solved || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Batch Table */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-xs text-[var(--text-primary)]">
            Academic Graduation Batch Breakdown
          </h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4">Batch</th>
              <th className="py-2.5 px-4">Students Enrolled</th>
              <th className="py-2.5 px-4">Total Solved</th>
              <th className="py-2.5 px-4">Avg Solved / Student</th>
              <th className="py-2.5 px-4">Max Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] font-mono">
            {data.batches.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[var(--text-muted)] font-sans text-xs">
                  {loading ? 'Analyzing batch records...' : 'No graduation batch records available in active dataset.'}
                </td>
              </tr>
            ) : (
              data.batches.map((batch, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                    Batch {batch.name}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{batch.student_count}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{batch.total_solved?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[var(--accent-teal)]">{batch.avg_solved}</td>
                  <td className="py-3 px-4 font-bold text-purple-400">{batch.max_rating || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
