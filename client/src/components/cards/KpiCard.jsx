import React, { useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { animateCounter } from '../../utils/animations';

export default function KpiCard({
  title,
  value,
  subvalue,
  delta,
  deltaType = 'positive', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  badgeText,
  badgeColor = 'text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 border-[var(--accent-teal)]/30',
  description
}) {
  const valueRef = useRef(null);

  useEffect(() => {
    if (valueRef.current && value !== null && value !== undefined && value !== '—') {
      animateCounter(valueRef.current, value, 0.85);
    }
  }, [value]);

  return (
    <div className="card-base p-4 flex flex-col justify-between hover:border-[var(--border-color)]/80 transition-all group relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badgeText && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
              {badgeText}
            </span>
          )}
          {Icon && (
            <div className="w-7 h-7 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Metric Main Number */}
      <div className="my-1">
        <div
          ref={valueRef}
          className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-mono-numbers tabular-nums"
        >
          {value !== null && value !== undefined ? value : '—'}
        </div>
      </div>

      {/* Footer / Delta Info */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-color)]/50 mt-1">
        <span className="text-[11px] text-[var(--text-muted)] truncate">
          {subvalue || 'Recorded metric'}
        </span>

        {delta && (
          <div className={`flex items-center gap-0.5 text-[11px] font-medium font-mono ${
            deltaType === 'positive' ? 'text-emerald-400' : (deltaType === 'negative' ? 'text-rose-400' : 'text-[var(--text-muted)]')
          }`}>
            {deltaType === 'positive' && <ArrowUpRight className="w-3 h-3" />}
            {deltaType === 'negative' && <ArrowDownRight className="w-3 h-3" />}
            <span>{delta}</span>
          </div>
        )}
      </div>
    </div>
  );
}
