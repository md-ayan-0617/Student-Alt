import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function HistoricalTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[var(--text-muted)] card-base">
        No snapshot history recorded for this observation interval yet.
      </div>
    );
  }

  const formattedData = data.map(d => ({
    ...d,
    date: d.snapshot_date ? d.snapshot_date.slice(5) : d.date
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface-main)] border border-[var(--border-color)] p-3 rounded-lg shadow-xl text-xs space-y-1">
          <div className="font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-1 mb-1 font-mono">
            Date: {label}
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
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6B8CFF" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6B8CFF" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            fontFamily="monospace"
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
          <Area
            type="monotone"
            dataKey="total_solved"
            name="Total Solved (Observed)"
            stroke="#6B8CFF"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTotal)"
          />
          <Area
            type="monotone"
            dataKey="medium_solved"
            name="Medium Solved"
            stroke="#F59E0B"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorMedium)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
