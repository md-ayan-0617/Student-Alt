import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Trash2,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSettings, updateSetting, purgeAllData, seedDemoDataset } from '../services/api';

export default function Settings() {
  const { theme, toggleTheme, demoStatus, refreshSystemStatus, showToast } = useApp();
  const [institutionName, setInstitutionName] = useState('Institute of Engineering & Technology');
  const [weights, setWeights] = useState({
    problem_volume: 25,
    difficulty_progression: 25,
    consistency: 20,
    competitive_programming: 15,
    github_development: 15
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          if (res.settings.institution_name) {
            setInstitutionName(res.settings.institution_name.name || 'Institute of Engineering & Technology');
          }
          if (res.settings.index_weights) {
            setWeights({
              problem_volume: Math.round(res.settings.index_weights.problem_volume * 100),
              difficulty_progression: Math.round(res.settings.index_weights.difficulty_progression * 100),
              consistency: Math.round(res.settings.index_weights.consistency * 100),
              competitive_programming: Math.round(res.settings.index_weights.competitive_programming * 100),
              github_development: Math.round(res.settings.index_weights.github_development * 100)
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  const handleSaveInstitution = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSetting('institution_name', { name: institutionName, code: 'RUNGTA' });
      showToast('Institution settings updated successfully.', 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeights = async (e) => {
    e.preventDefault();
    const sum = Number(weights.problem_volume) + Number(weights.difficulty_progression) + Number(weights.consistency) + Number(weights.competitive_programming) + Number(weights.github_development);
    if (sum !== 100) {
      showToast(`Weights must sum to 100% (current total: ${sum}%)`, 'error');
      return;
    }
    setLoading(true);
    try {
      await updateSetting('index_weights', {
        problem_volume: weights.problem_volume / 100,
        difficulty_progression: weights.difficulty_progression / 100,
        consistency: weights.consistency / 100,
        competitive_programming: weights.competitive_programming / 100,
        github_development: weights.github_development / 100
      });
      showToast('Performance index weights saved.', 'success');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm('Warning: This will delete all student records, accounts, and historical snapshots. Are you sure?')) {
      return;
    }
    try {
      await purgeAllData();
      showToast('All student records purged. Live mode active.', 'success');
      await refreshSystemStatus();
    } catch (e) {
      showToast('Purge error: ' + e.message, 'error');
    }
  };

  const handleSeed = async () => {
    try {
      await seedDemoDataset();
      showToast('Reloaded demonstration college dataset.', 'success');
      await refreshSystemStatus();
    } catch (e) {
      showToast('Seed error: ' + e.message, 'error');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-[var(--surface-main)] via-[var(--surface-elevated)] to-[var(--surface-main)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-teal)] bg-[var(--accent-teal)]/10 px-2 py-0.5 rounded border border-[var(--accent-teal)]/30">
              System Administration
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Institutional Settings & Index Calibration
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
            Configure college branding, customize the transparent weights of the College Coding Performance Index, and manage student datasets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Institution Profile Form */}
        <form onSubmit={handleSaveInstitution} className="card-base p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
            <Building2 className="w-4 h-4 text-[var(--accent-blue)]" />
            <span>Institution Details</span>
          </div>

          <div>
            <label className="text-[11px] text-[var(--text-muted)] block mb-1">
              Institution / College Name
            </label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white font-medium hover:opacity-90 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Details</span>
            </button>
          </div>
        </form>

        {/* Index Weights Configuration Form */}
        <form onSubmit={handleSaveWeights} className="card-base p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Performance Index Weights</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Must sum to 100%
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Problem Solving Volume</span>
                <span className="font-mono text-emerald-400 font-bold">{weights.problem_volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.problem_volume}
                onChange={(e) => setWeights({ ...weights, problem_volume: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Difficulty Progression</span>
                <span className="font-mono text-amber-400 font-bold">{weights.difficulty_progression}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.difficulty_progression}
                onChange={(e) => setWeights({ ...weights, difficulty_progression: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Coding Consistency (Streak / Frequency)</span>
                <span className="font-mono text-purple-400 font-bold">{weights.consistency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.consistency}
                onChange={(e) => setWeights({ ...weights, consistency: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Competitive Programming Rating</span>
                <span className="font-mono text-blue-400 font-bold">{weights.competitive_programming}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.competitive_programming}
                onChange={(e) => setWeights({ ...weights, competitive_programming: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>GitHub Development Activity</span>
                <span className="font-mono text-teal-400 font-bold">{weights.github_development}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.github_development}
                onChange={(e) => setWeights({ ...weights, github_development: Number(e.target.value) })}
                className="w-full accent-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white font-medium hover:opacity-90 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Weights</span>
            </button>
          </div>
        </form>

        {/* Dataset Management Card */}
        <div className="card-base p-5 space-y-4 text-xs lg:col-span-2">
          <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Roster & Dataset Controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--surface-elevated)] space-y-2 border border-[var(--border-color)]">
              <h4 className="font-bold text-[var(--text-primary)]">Purge All Roster Data</h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Clears all loaded students, accounts, and historical snapshots to enable importing a fresh official college file.
              </p>
              <button
                onClick={handlePurge}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Entire Roster</span>
              </button>
            </div>

            <div className="p-4 rounded-lg bg-[var(--surface-elevated)] space-y-2 border border-[var(--border-color)]">
              <h4 className="font-bold text-[var(--text-primary)]">Load Sample Student Roster</h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Loads the sample college student roster from data/sample_college_students.json so you can test profile linkages and live synchronization.
              </p>
              <button
                onClick={handleSeed}
                className="px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Load Sample Student Roster</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
