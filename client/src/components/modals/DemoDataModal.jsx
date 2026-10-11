import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Trash2, RefreshCw, UploadCloud, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { purgeAllData, seedDemoDataset } from '../../services/api';

export default function DemoDataModal({ isOpen, onClose }) {
  const { demoStatus, refreshSystemStatus, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePurge = async () => {
    if (!window.confirm('Are you sure you want to purge all demo data? This will clear all students and metrics so you can import your college roster.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await purgeAllData();
      if (res.success) {
        showToast('All demo student records and metrics purged cleanly.', 'success');
        await refreshSystemStatus();
        onClose();
        navigate('/import');
      }
    } catch (e) {
      showToast('Failed to purge data: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    setLoading(true);
    try {
      const res = await seedDemoDataset();
      if (res.success) {
        showToast(`Loaded ${res.studentsCount || ''} sample college student records.`, 'success');
        await refreshSystemStatus();
        onClose();
      }
    } catch (e) {
      showToast('Failed to seed demo data: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--surface-main)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--surface-elevated)]/50">
          <div className="flex items-center gap-2.5 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Demo Mode & Roster Management</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed">
          <p>
            In accordance with institutional integrity rules, <strong className="text-[var(--text-primary)]">Campus Coding Intelligence</strong> clearly demarcates synthetic preview records from official college student data.
          </p>

          <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--text-primary)]">Current Database Status:</span>
              <span className={`px-2 py-0.5 rounded font-mono font-semibold ${demoStatus.isDemoActive ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {demoStatus.isDemoActive ? 'DEMO PREVIEW ACTIVE' : 'LIVE ROSTER ACTIVE'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Total Students: <strong className="text-[var(--text-primary)] font-mono">{demoStatus.totalStudents}</strong> | Synthetic Records: <strong className="text-[var(--text-primary)] font-mono">{demoStatus.demoCount}</strong>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                navigate('/import');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-blue)] hover:opacity-90 text-white font-medium transition-opacity shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Official College JSON File</span>
            </button>

            <button
              onClick={handlePurge}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge All Demo Data (Start Fresh)</span>
            </button>

            <button
              onClick={handleReseed}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Load Sample College Students Roster</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[var(--surface-elevated)]/40 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)] flex justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
