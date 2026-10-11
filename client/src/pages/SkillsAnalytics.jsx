import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSkillsAnalytics } from '../services/api';

export default function SkillsAnalytics() {
  const { showToast } = useApp();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const res = await getSkillsAnalytics();
        if (res.success) {
          setTopics(res.data);
        }
      } catch (e) {
        showToast('Error loading skills: ' + e.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              Curriculum & Algorithm Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Skills & DSA Topic Mastery Analysis
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Analysis of 15 core Computer Science problem-solving domains based on platform-reported tags. Missing topic tags reflect unrecorded observations, never theoretical inability.
          </p>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-xs text-[var(--text-muted)] card-base">
            Loading domain skills breakdown...
          </div>
        ) : topics.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-xs text-[var(--text-muted)] card-base space-y-2">
            <p>No domain skill tags or programming languages recorded yet.</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Synchronize student platform profiles to populate verified language and algorithmic domain breakdowns.</p>
          </div>
        ) : (
          topics.map((item, idx) => (
            <div key={idx} className="card-base p-4 space-y-3 hover:border-[var(--accent-blue)] transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {item.topic}
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {item.totalSolved?.toLocaleString()} Solved in Cohort
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
                  {item.engagementPct}% Active
                </span>
              </div>

              {/* Difficulty Ratio Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Difficulty Mix:</span>
                  <span className="font-mono">{item.difficultyRatio.easy}% E / {item.difficultyRatio.medium}% M / {item.difficultyRatio.hard}% H</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden flex">
                  <div style={{ width: `${item.difficultyRatio.easy}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${item.difficultyRatio.medium}%` }} className="bg-amber-500 h-full" />
                  <div style={{ width: `${item.difficultyRatio.hard}%` }} className="bg-rose-500 h-full" />
                </div>
              </div>

              {/* Recommendation */}
              <div className="pt-2 border-t border-[var(--border-color)]/50 text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
                <span className="truncate">{item.recommendedPractice}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
