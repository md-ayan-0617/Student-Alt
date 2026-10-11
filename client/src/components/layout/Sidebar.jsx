import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Code2,
  Flame,
  Trophy,
  Sparkles,
  GitCompare,
  TrendingUp,
  Building2,
  FileText,
  UploadCloud,
  Layers,
  RefreshCw,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  GitBranch
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileDrawerOpen, setMobileDrawerOpen, demoStatus } = useApp();
  const location = useLocation();

  const navigationGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'College Overview', path: '/', icon: LayoutDashboard }
      ]
    },
    {
      group: 'STUDENT ANALYTICS',
      items: [
        { name: 'All Students', path: '/students', icon: Users, badge: demoStatus.totalStudents },
        { name: 'Cohort & Student Comparison', path: '/compare', icon: GitCompare },
        { name: 'Problem-Solving Analysis', path: '/problem-solving', icon: Code2 },
        { name: 'Activity & Consistency', path: '/activity', icon: Flame },
        { name: 'Rankings & Leaderboards', path: '/leaderboards', icon: Trophy },
        { name: 'Skills & Topic Analysis', path: '/skills', icon: Sparkles }
      ]
    },
    {
      group: 'PLATFORM ANALYTICS',
      items: [
        { name: 'Platform Comparison', path: '/platforms', icon: GitCompare },
        { name: 'LeetCode Analytics', path: '/platforms/leetcode', icon: Code2, color: 'text-amber-500' },
        { name: 'GeeksforGeeks Analytics', path: '/platforms/gfg', icon: Code2, color: 'text-emerald-500' },
        { name: 'CodeChef Analytics', path: '/platforms/codechef', icon: Code2, color: 'text-purple-500' },
        { name: 'HackerRank Analytics', path: '/platforms/hackerrank', icon: Code2, color: 'text-green-500' },
        { name: 'GitHub Insights', path: '/platforms/github', icon: GitBranch, color: 'text-blue-500' }
      ]
    },
    {
      group: 'INSTITUTIONAL ANALYTICS',
      items: [
        { name: 'College Standing', path: '/standing', icon: Building2 },
        { name: 'Branch & Batch Comparison', path: '/branches-batches', icon: GitCompare },
        { name: 'Performance Trends', path: '/trends', icon: TrendingUp },
        { name: 'Insights & Reports', path: '/reports', icon: FileText }
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { name: 'Import Students', path: '/import', icon: UploadCloud, highlight: true },
        { name: 'Student Management', path: '/admin/students', icon: Users },
        { name: 'Platform Integrations', path: '/integrations', icon: Layers },
        { name: 'Data Synchronization', path: '/synchronization', icon: RefreshCw },
        { name: 'Audit History', path: '/audit', icon: History },
        { name: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Persistent / Responsive Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 border-r border-[var(--border-color)] bg-[var(--surface-main)] select-none
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
          ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-color)]">
          <NavLink to="/" className="flex items-center gap-3 overflow-hidden" onClick={() => setMobileDrawerOpen(false)}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EA5652] via-[#ED8368] to-[#832008] flex items-center justify-center shrink-0 shadow-md shadow-[#EA5652]/25">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold tracking-tight text-sm text-[var(--text-primary)] leading-tight">
                  RUNGTA CAMPUS
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--brand-primary)]">
                  Coding Intelligence Hub
                </span>
              </div>
            )}
          </NavLink>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  {group.group}
                </div>
              )}
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group relative
                      ${isActive
                        ? 'bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-semibold border-l-2 border-[var(--accent-blue)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                      }
                      ${item.highlight ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : ''}
                    `}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${item.color || ''} ${isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {!sidebarCollapsed && item.badge !== undefined && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Info & Demo State */}
        {!sidebarCollapsed ? (
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--surface-elevated)]/50">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
              <span>Institution Version</span>
              <span className="font-mono text-[10px] text-[var(--accent-teal)]">v2.4 LTS</span>
            </div>
            {demoStatus.isDemoActive && (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1 mt-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Preview Roster Loaded</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 border-t border-[var(--border-color)] flex justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
          </div>
        )}
      </aside>
    </>
  );
}
