import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function PlatformDistributionChart({ platforms = [] }) {
  if (!platforms || platforms.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[var(--text-muted)] card-base">
        No platform distribution data available.
      </div>
    );
  }

  const chartData = platforms.map(p => ({
    name: p.name,
    linked: p.accountsLinked || 0,
    verified: p.accountsVerified || 0,
    solved: p.totalSolved || (p.reposCount ? p.reposCount * 10 : 0),
    color: p.color
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface-main)] border border-[var(--border-color)] p-3 rounded-lg shadow-xl text-xs space-y-1">
          <div className="font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-1 mb-1">
            {label}
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 font-mono">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {entry.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
          <XAxis
            dataKey="name"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            fontFamily="monospace"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span className="text-xs text-[var(--text-secondary)]">{value}</span>}
          />
          <Bar dataKey="linked" name="Profiles Linked" fill="#42D6C3" radius={[4, 4, 0, 0]} />
          <Bar dataKey="verified" name="Profiles Verified" fill="#6B8CFF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
