import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Filter,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopNav({ onOpenDemoModal }) {
  const {
    theme,
    toggleTheme,
    filters,
    updateFilters,
    demoStatus,
    setSearchModalOpen,
    sidebarCollapsed,
    setMobileDrawerOpen
  } = useApp();

  const location = useLocation();

  // Route title mapping
  const routeTitles = {
    '/': 'College Overview Dashboard',
    '/students': 'All Students Directory',
    '/compare': 'Dynamic Student & Cohort Comparison',
    '/problem-solving': 'Problem-Solving Analytics',
    '/activity': 'Activity & Consistency Analytics',
    '/leaderboards': 'Rankings & Institutional Leaderboards',
    '/skills': 'DSA Skills & Topic Mastery',
    '/platforms': 'Multi-Platform Comparative Analytics',
    '/platforms/leetcode': 'LeetCode Institutional Analytics',
    '/platforms/gfg': 'GeeksforGeeks Analytics',
    '/platforms/codechef': 'CodeChef Competitive Analytics',
    '/platforms/hackerrank': 'HackerRank Assessments',
    '/platforms/github': 'GitHub Development Activity Insights',
    '/standing': 'Institutional Standing & Benchmarks',
    '/branches-batches': 'Branch & Batch Comparative Analytics',
    '/trends': 'Historical Longitudinal Trends',
    '/reports': 'Institutional Reports & Exports',
    '/import': 'JSON Student Roster Import',
    '/admin/students': 'Student Roster Administration',
    '/integrations': 'Platform Connectors & API Status',
    '/synchronization': 'Data Synchronization Jobs',
    '/audit': 'Institutional Audit Trail',
    '/settings': 'System Settings & Index Configuration'
  };

  const currentTitle = routeTitles[location.pathname] || (location.pathname.startsWith('/students/') ? 'Student Performance Profile' : 'Campus Coding Intelligence');

  return (
    <header
      className={`sticky top-0 z-30 h-16 border-b border-[var(--border-color)] bg-[var(--surface-main)]/90 backdrop-blur-md transition-all duration-300 flex items-center justify-between px-4 lg:px-6
        ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
      `}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="lg:hidden p-2 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col truncate">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <Link to="/" className="hover:text-[var(--brand-primary)] font-medium transition-colors">Rungta</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="truncate text-[var(--text-secondary)]">{currentTitle}</span>
          </div>
          <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Middle & Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search Button */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition-all text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search student, handle, or roll...</span>
          <kbd className="hidden lg:inline-block font-mono text-[10px] bg-[var(--surface-hover)] border border-[var(--border-color)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">
            ⌘K
          </kbd>
        </button>

        {/* Branch Filter */}
        <div className="hidden xl:flex items-center">
          <select
            value={filters.branch}
            onChange={(e) => updateFilters({ branch: e.target.value })}
            className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[var(--accent-blue)]"
          >
            <option value="all">All Branches</option>
            <option value="Computer Science & Engineering">CSE</option>
            <option value="Information Technology">IT</option>
            <option value="Artificial Intelligence & Data Science">AI & DS</option>
            <option value="Electronics & Communication">ECE</option>
          </select>
        </div>

        {/* Batch Filter */}
        <div className="hidden xl:flex items-center">
          <select
            value={filters.batch}
            onChange={(e) => updateFilters({ batch: e.target.value })}
            className="text-xs bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[var(--accent-blue)]"
          >
            <option value="all">All Batches</option>
            <option value="2022-2026">Batch 2022-26</option>
            <option value="2023-2027">Batch 2023-27</option>
            <option value="2024-2028">Batch 2024-28</option>
          </select>
        </div>

        {/* Time Window Pill */}
        <div className="hidden md:flex items-center border border-[var(--border-color)] rounded-md bg-[var(--surface-elevated)] p-0.5 text-[11px] font-medium">
          {['7d', '30d', '90d', 'Semester'].map((t) => (
            <button
              key={t}
              onClick={() => updateFilters({ timeRange: t })}
              className={`px-2 py-1 rounded transition-colors ${
                filters.timeRange === t
                  ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Demo Mode Badge */}
        {demoStatus.isDemoActive && (
          <button
            onClick={onOpenDemoModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
            title="Click to toggle or purge demo data"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DEMO DATA</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md border border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-[var(--border-color)]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#EA5652] to-[#ED8368] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            RC
          </div>
          <div className="hidden 2xl:flex flex-col text-left">
            <span className="text-xs font-medium text-[var(--text-primary)] leading-tight">Administrator</span>
            <span className="text-[10px] text-[var(--text-muted)]">Rungta DigiiCampus</span>
          </div>
        </div>
      </div>
    </header>
  );
}
