import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  UserCheck,
  Clock,
  Filter
} from 'lucide-react';
import { getAuditLogs } from '../services/api';

export default function AuditHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await getAuditLogs();
        if (res.success) setLogs(res.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Governance & Compliance
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Institutional Audit Trail & Activity Log
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Immutable log of all administrative actions, student roster imports, manual handle updates, and synchronization jobs for institutional transparency and FERPA/GDPR compliance.
          </p>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] font-semibold text-xs text-[var(--text-primary)] flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--accent-blue)]" />
          <span>Audit Records</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-elevated)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
            <tr>
              <th className="py-2.5 px-4">Action</th>
              <th className="py-2.5 px-4">Actor Role</th>
              <th className="py-2.5 px-4">Audit Payload / Details</th>
              <th className="py-2.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-[var(--text-muted)]">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-[var(--text-muted)]">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-mono font-semibold text-[var(--accent-teal)]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-primary)]">
                    {log.user_role}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-muted)] max-w-md truncate">
                    {log.details || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-[var(--text-muted)]">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
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
