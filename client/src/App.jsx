import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import DemoNoticeBanner from './components/layout/DemoNoticeBanner';
import GlobalSearchModal from './components/layout/GlobalSearchModal';
import DemoDataModal from './components/modals/DemoDataModal';

// Pages
import CollegeOverview from './pages/CollegeOverview';
import AllStudents from './pages/AllStudents';
import StudentProfile from './pages/StudentProfile';
import StudentComparison from './pages/StudentComparison';
import ProblemSolving from './pages/ProblemSolving';
import ActivityAnalytics from './pages/ActivityAnalytics';
import RankingsLeaderboards from './pages/RankingsLeaderboards';
import SkillsAnalytics from './pages/SkillsAnalytics';
import PlatformComparison from './pages/PlatformComparison';
import LeetCodeAnalytics from './pages/LeetCodeAnalytics';
import GFGAnalytics from './pages/GFGAnalytics';
import CodeChefAnalytics from './pages/CodeChefAnalytics';
import HackerRankAnalytics from './pages/HackerRankAnalytics';
import GitHubInsights from './pages/GitHubInsights';
import CollegeStanding from './pages/CollegeStanding';
import BranchBatchComparison from './pages/BranchBatchComparison';
import PerformanceTrends from './pages/PerformanceTrends';
import Reports from './pages/Reports';
import ImportStudents from './pages/ImportStudents';
import AdminStudents from './pages/AdminStudents';
import Integrations from './pages/Integrations';
import Synchronization from './pages/Synchronization';
import AuditHistory from './pages/AuditHistory';
import Settings from './pages/Settings';

function AppLayout() {
  const { sidebarCollapsed, toast } = useApp();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
        `}
      >
        {/* Sticky Top Navigation */}
        <TopNav onOpenDemoModal={() => setDemoModalOpen(true)} />

        {/* Demo Notification Notice */}
        <DemoNoticeBanner onOpenModal={() => setDemoModalOpen(true)} />

        {/* Page Content Body */}
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<CollegeOverview />} />
            <Route path="/students" element={<AllStudents />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/compare" element={<StudentComparison />} />
            <Route path="/problem-solving" element={<ProblemSolving />} />
            <Route path="/activity" element={<ActivityAnalytics />} />
            <Route path="/leaderboards" element={<RankingsLeaderboards />} />
            <Route path="/skills" element={<SkillsAnalytics />} />
            <Route path="/platforms" element={<PlatformComparison />} />
            <Route path="/platforms/leetcode" element={<LeetCodeAnalytics />} />
            <Route path="/platforms/gfg" element={<GFGAnalytics />} />
            <Route path="/platforms/codechef" element={<CodeChefAnalytics />} />
            <Route path="/platforms/hackerrank" element={<HackerRankAnalytics />} />
            <Route path="/platforms/github" element={<GitHubInsights />} />
            <Route path="/standing" element={<CollegeStanding />} />
            <Route path="/branches-batches" element={<BranchBatchComparison />} />
            <Route path="/trends" element={<PerformanceTrends />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/import" element={<ImportStudents />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/synchronization" element={<Synchronization />} />
            <Route path="/audit" element={<AuditHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-[var(--border-color)] bg-[var(--surface-main)] text-xs text-[var(--text-muted)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-secondary)]">CAMPUS CODING INTELLIGENCE</span>
            <span>•</span>
            <span>College Coding Performance & Analytics</span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)]">
            Verified Academic Data Systems • All Connectors Encapsulated
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal />
      <DemoDataModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />

      {/* Global Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--surface-main)] border border-[var(--border-color)] shadow-2xl text-xs font-medium text-[var(--text-primary)] animate-in slide-in-from-bottom-3 duration-200">
          <span className={`w-2 h-2 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-400' : (toast.type === 'error' ? 'bg-rose-400' : 'bg-blue-400')
          }`} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
