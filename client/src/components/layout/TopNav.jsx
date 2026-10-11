import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  Moon,
  Filter,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  User,
  LogOut,
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopNav({ onOpenDemoModal }) {
  const {
    theme,
    toggleTheme,
    filters,
    updateFilters,
    demoStatus,
    syncMetadata,
    refreshSyncStatus,
    triggerGlobalSync,
    setSearchModalOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    setMobileDrawerOpen
  } = useApp();

  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [syncHover, setSyncHover] = useState(false);

  // Friendly Route Titles & Breadcrumbs
  const routeMeta = {
    '/': { title: 'College Overview', section: 'Analytics' },
    '/students': { title: 'Student Directory', section: 'Roster' },
    '/student-comparison': { title: 'Individual Student Comparison', section: 'Comparison Center' },
    '/compare': { title: 'Individual Student Comparison', section: 'Comparison Center' },
    '/rankings': { title: 'Global Platform Rankings', section: 'Rankings' },
    '/leaderboards': { title: 'Global Platform Rankings', section: 'Rankings' },
    '/problem-solving': { title: 'Problem-Solving Analysis', section: 'Analytics' },
    '/activity': { title: 'Activity & Consistency', section: 'Analytics' },
    '/skills': { title: 'DSA Topic Mastery', section: 'Skill Intelligence' },
    '/platforms': { title: 'Platform Distribution', section: 'Platforms' },
    '/platforms/leetcode': { title: 'LeetCode Platform Analytics', section: 'Platforms' },
    '/platforms/gfg': { title: 'GeeksforGeeks Analytics', section: 'Platforms' },
    '/platforms/codechef': { title: 'CodeChef Analytics', section: 'Platforms' },
    '/platforms/hackerrank': { title: 'HackerRank Assessments', section: 'Platforms' },
    '/platforms/github': { title: 'GitHub Engineering Insights', section: 'Platforms' },
    '/standing': { title: 'Institutional Standing', section: 'Benchmarking' },
    '/branches-batches': { title: 'Branch & Batch Analysis', section: 'Cohorts' },
    '/trends': { title: 'Performance Trends', section: 'Longitudinal' },
    '/reports': { title: 'Executive Reports', section: 'Exports' },
    '/import': { title: 'Import Student Roster', section: 'Administration' },
    '/admin/students': { title: 'Student Administration', section: 'Administration' },
    '/integrations': { title: 'Platform Connectors', section: 'Settings' },
    '/synchronization': { title: 'Synchronization Hub', section: 'Data Jobs' },
    '/audit': { title: 'Audit Trail', section: 'Governance' },
    '/settings': { title: 'Platform Settings', section: 'Configuration' }
  };

  const currentMeta = routeMeta[location.pathname] || {
    title: location.pathname.startsWith('/students/') ? 'Student Performance Profile' : 'Campus Coding Intelligence',
    section: location.pathname.startsWith('/students/') ? 'Profile Workspace' : 'Dashboard'
  };

  // Compute Relative Sync Label
  const getSyncLabel = () => {
    if (syncMetadata.isSyncing) return 'Syncing...';
    if (!syncMetadata.latestSyncTime) return 'Never synced';

    const syncDate = new Date(syncMetadata.latestSyncTime);
    const diffMs = Date.now() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Synced < 1 min ago';
    if (diffMins < 60) return `Synced ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last synced ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Last synced ${diffDays}d ago`;
  };

  const getSyncStatusColor = () => {
    if (syncMetadata.isSyncing) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    if (!syncMetadata.latestSyncTime) return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/30';
    if (syncMetadata.syncState === 'stale') return 'text-amber-600 bg-amber-500/10 border-amber-500/30';
    if (syncMetadata.syncState === 'error') return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30';
  };

  const activeFilterCount = [
    filters.branch !== 'all',
    filters.batch !== 'all',
    filters.semester !== 'all',
    filters.timeRange !== '30d'
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    updateFilters({ branch: 'all', batch: 'all', semester: 'all', timeRange: '30d' });
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--surface-main)] border-b border-[var(--border-color)] shadow-xs">
      {/* =========================================================================
          PRIMARY ROW: Navigation, Unclipped Title, Global Search, Actions
          ========================================================================= */}
      <div className="h-14 lg:h-16 px-4 lg:px-6 flex items-center justify-between gap-3 lg:gap-6">
        {/* Left: Sidebar Toggles & Breadcrumb / Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Page Hierarchy: Section Breadcrumb & Unclipped Page Title */}
          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] leading-none mb-0.5">
              <Link to="/" className="hover:text-[var(--brand-primary)] transition-colors">
                Rungta Intelligence
              </Link>
              <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{currentMeta.section}</span>
            </div>
            <h1 className="text-sm lg:text-base font-bold text-[var(--text-primary)] tracking-tight leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
              {currentMeta.title}
            </h1>
          </div>
        </div>

        {/* Right: Search, Global Sync, Theme, Filter Drawer Trigger, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Student Search Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)] transition-all text-xs"
            title="Global Student Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden md:inline font-normal">Search student, roll, or handle...</span>
            <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] font-medium bg-[var(--surface-main)] border border-[var(--border-color)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Sync Status Badge (Desktop) with Hover Tooltip */}
          <div className="relative hidden md:block">
            <button
              onClick={() => triggerGlobalSync('all')}
              disabled={syncMetadata.isSyncing}
              onMouseEnter={() => setSyncHover(true)}
              onMouseLeave={() => setSyncHover(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${getSyncStatusColor()} ${
                syncMetadata.isSyncing ? 'cursor-wait opacity-80' : 'cursor-pointer hover:border-[var(--brand-primary)]'
              }`}
              title="Click to trigger data refresh across all platforms"
            >
              <span className={`w-2 h-2 rounded-full ${
                syncMetadata.isSyncing ? 'bg-amber-500 animate-sync-pulse' : (syncMetadata.latestSyncTime ? 'bg-emerald-500' : 'bg-zinc-400')
              }`} />
              <span className="text-[11px] font-mono whitespace-nowrap">{getSyncLabel()}</span>
              <RefreshCw className={`w-3 h-3 text-[var(--text-secondary)] ${syncMetadata.isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Sync Timestamp Popover Tooltip */}
            {syncHover && (
              <div className="absolute top-full right-0 mt-1.5 w-64 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-main)] shadow-lg text-left z-50 pointer-events-none">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)] mb-1">
                  <span>Platform Data Sync</span>
                  <span className="text-[10px] text-[var(--brand-primary)] font-mono">LIVE API</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {syncMetadata.latestSyncTime
                    ? `Latest sync: ${new Date(syncMetadata.latestSyncTime).toLocaleString()}`
                    : 'No synchronization jobs have been executed yet.'}
                </p>
                <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Click badge to refresh live platform profiles.</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Filter Button (Tablet & Mobile only) */}
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className={`xl:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              activeFilterCount > 0
                ? 'bg-[var(--brand-tint)] border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Filter cohort by branch, batch, and semester"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shrink-0"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Administrator Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--surface-hover)] transition-colors focus:outline-none"
              aria-label="Administrator profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                RC
              </div>
              <div className="hidden 2xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">Admin Console</span>
                <span className="text-[10px] text-[var(--text-muted)]">Rungta DigiiCampus</span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border-color)] bg-[var(--surface-main)] shadow-xl p-2 z-50"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[var(--border-subtle)] mb-1">
                  <p className="text-xs font-bold text-[var(--text-primary)]">Rungta Coding Hub</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">admin@rungta.edu.in</p>
                </div>
                <Link
                  to="/student-comparison"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Student Comparison</span>
                </Link>
                <Link
                  to="/rankings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Global Platform Rankings</span>
                </Link>
                <Link
                  to="/import"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Import Student JSON</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>System Settings</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECONDARY TOOLBAR: Cohort Filtering & Verification Status
          ========================================================================= */}
      <div className="hidden xl:flex h-11 px-6 items-center justify-between gap-4 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 text-xs">
        {/* Left: Consistent Select Controls */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Cohort Scope:
          </span>

          {/* Branch Filter */}
          <select
            value={filters.branch}
            onChange={(e) => updateFilters({ branch: e.target.value })}
            className="control-select py-1 text-xs"
            aria-label="Filter by Branch"
          >
            <option value="all">All Academic Branches</option>
            <option value="Computer Science & Engineering">CSE (Computer Science)</option>
            <option value="Information Technology">IT (Information Tech)</option>
            <option value="Artificial Intelligence & Data Science">AI & DS</option>
            <option value="Electronics & Communication">ECE</option>
          </select>

          {/* Batch Filter */}
          <select
            value={filters.batch}
            onChange={(e) => updateFilters({ batch: e.target.value })}
            className="control-select py-1 text-xs"
            aria-label="Filter by Graduation Batch"
          >
            <option value="all">All Batches</option>
            <option value="2022-2026">Batch 2022-26</option>
            <option value="2023-2027">Batch 2023-27</option>
            <option value="2024-2028">Batch 2024-28</option>
          </select>

          {/* Semester Filter */}
          <select
            value={filters.semester}
            onChange={(e) => updateFilters({ semester: e.target.value })}
            className="control-select py-1 text-xs"
            aria-label="Filter by Current Semester"
          >
            <option value="all">All Semesters</option>
            <option value="1st Sem">1st Semester</option>
            <option value="2nd Sem">2nd Semester</option>
            <option value="3rd Sem">3rd Semester</option>
            <option value="4th Sem">4th Semester</option>
            <option value="5th Sem">5th Semester</option>
            <option value="6th Sem">6th Semester</option>
            <option value="7th Sem">7th Semester</option>
            <option value="8th Sem">8th Semester</option>
          </select>

          {/* Reset Filters action */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] hover:underline ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Right: Time Range & Quick Sync Action */}
        <div className="flex items-center gap-3">
          {/* Time Window Selector */}
          <div className="flex items-center border border-[var(--border-color)] rounded-lg bg-[var(--surface-main)] p-0.5">
            {['7d', '30d', '90d', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => updateFilters({ timeRange: t })}
                className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] transition-colors ${
                  filters.timeRange === t
                    ? 'bg-[var(--brand-primary)] text-white font-bold shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => triggerGlobalSync('all')}
            disabled={syncMetadata.isSyncing}
            className="control-btn py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Trigger platform synchronization"
          >
            <RefreshCw className={`w-3 h-3 text-[var(--brand-primary)] ${syncMetadata.isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncMetadata.isSyncing ? 'Refreshing...' : 'Refresh Profiles'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE / TABLET FILTER DRAWER
          ========================================================================= */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm h-full bg-[var(--surface-main)] border-l border-[var(--border-color)] p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[var(--brand-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Cohort Filters</h3>
                </div>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Branch Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Department / Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => updateFilters({ branch: e.target.value })}
                  className="w-full control-select text-xs"
                >
                  <option value="all">All Academic Branches</option>
                  <option value="Computer Science & Engineering">CSE (Computer Science)</option>
                  <option value="Information Technology">IT (Information Tech)</option>
                  <option value="Artificial Intelligence & Data Science">AI & DS</option>
                  <option value="Electronics & Communication">ECE</option>
                </select>
              </div>

              {/* Batch Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Graduation Batch</label>
                <select
                  value={filters.batch}
                  onChange={(e) => updateFilters({ batch: e.target.value })}
                  className="w-full control-select text-xs"
                >
                  <option value="all">All Batches</option>
                  <option value="2022-2026">Batch 2022-2026</option>
                  <option value="2023-2027">Batch 2023-2027</option>
                  <option value="2024-2028">Batch 2024-2028</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Semester</label>
                <select
                  value={filters.semester}
                  onChange={(e) => updateFilters({ semester: e.target.value })}
                  className="w-full control-select text-xs"
                >
                  <option value="all">All Semesters</option>
                  <option value="1st Sem">1st Semester</option>
                  <option value="2nd Sem">2nd Semester</option>
                  <option value="3rd Sem">3rd Semester</option>
                  <option value="4th Sem">4th Semester</option>
                  <option value="5th Sem">5th Semester</option>
                  <option value="6th Sem">6th Semester</option>
                  <option value="7th Sem">7th Semester</option>
                  <option value="8th Sem">8th Semester</option>
                </select>
              </div>

              {/* Time Window */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Observation Window</label>
                <div className="grid grid-cols-4 gap-2">
                  {['7d', '30d', '90d', 'all'].map((t) => (
                    <button
                      key={t}
                      onClick={() => updateFilters({ timeRange: t })}
                      className={`py-1.5 rounded-lg border font-mono text-xs font-medium transition-colors ${
                        filters.timeRange === t
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] font-bold'
                          : 'border-[var(--border-color)] bg-[var(--surface-main)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sync Status Info in Mobile Drawer */}
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                  <span>Synchronization Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${getSyncStatusColor()}`}>
                    {getSyncLabel()}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {syncMetadata.latestSyncTime
                    ? `Last completed: ${new Date(syncMetadata.latestSyncTime).toLocaleString()}`
                    : 'Profiles not yet synchronized with external platforms.'}
                </p>
                <button
                  onClick={() => triggerGlobalSync('all')}
                  disabled={syncMetadata.isSyncing}
                  className="w-full mt-1 py-1.5 rounded-lg bg-[var(--surface-main)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[var(--brand-primary)] ${syncMetadata.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncMetadata.isSyncing ? 'Syncing...' : 'Sync Platform Profiles'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[var(--border-color)] flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--surface-elevated)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Reset All
              </button>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:opacity-95 shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
