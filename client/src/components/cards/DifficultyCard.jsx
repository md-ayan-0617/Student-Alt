import React from 'react';

export default function DifficultyCard({ difficulty = { easy: 0, medium: 0, hard: 0, easyPct: 0, mediumPct: 0, hardPct: 0 } }) {
  const total = (difficulty.easy || 0) + (difficulty.medium || 0) + (difficulty.hard || 0);

  return (
    <div className="card-base p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Difficulty Progression
        </span>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {total.toLocaleString()} Solved Total
        </span>
      </div>

      {/* Progress Multi-Segment Bar */}
      <div className="w-full h-3 rounded-full bg-[var(--surface-elevated)] overflow-hidden flex my-2 border border-[var(--border-color)]">
        <div
          style={{ width: `${difficulty.easyPct || 0}%` }}
          className="bg-emerald-500 h-full transition-all duration-500"
          title={`Easy: ${difficulty.easy} (${difficulty.easyPct}%)`}
        />
        <div
          style={{ width: `${difficulty.mediumPct || 0}%` }}
          className="bg-amber-500 h-full transition-all duration-500"
          title={`Medium: ${difficulty.medium} (${difficulty.mediumPct}%)`}
        />
        <div
          style={{ width: `${difficulty.hardPct || 0}%` }}
          className="bg-rose-500 h-full transition-all duration-500"
          title={`Hard: ${difficulty.hard} (${difficulty.hardPct}%)`}
        />
      </div>

      {/* 3 Metrics breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-color)]/50 mt-1">
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">Easy</span>
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] font-mono-numbers mt-0.5">
            {difficulty.easy?.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">
            {difficulty.easyPct || 0}%
          </div>
        </div>

        <div className="text-left border-l border-[var(--border-color)] pl-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">Medium</span>
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] font-mono-numbers mt-0.5">
            {difficulty.medium?.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">
            {difficulty.mediumPct || 0}%
          </div>
        </div>

        <div className="text-left border-l border-[var(--border-color)] pl-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">Hard</span>
          </div>
          <div className="text-sm font-bold text-[var(--text-primary)] font-mono-numbers mt-0.5">
            {difficulty.hard?.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">
            {difficulty.hardPct || 0}%
          </div>
        </div>
      </div>
    </div>
  );
}
