import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Settings2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DemoNoticeBanner({ onOpenModal }) {
  const { demoStatus } = useApp();

  if (!demoStatus.isDemoActive) return null;

  return (
    <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 shadow-inner">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold text-amber-300">DEMO MODE ACTIVE:</strong> Showing {demoStatus.demoCount} demonstration student records.
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <button
          onClick={onOpenModal}
          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1"
        >
          <Settings2 className="w-3 h-3" />
          <span>Demo Controls</span>
        </button>
        <Link
          to="/import"
          className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium transition-colors flex items-center gap-1 shadow-sm"
        >
          <span>Import Real College JSON</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
