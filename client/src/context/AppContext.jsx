import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Theme management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cci_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('cci_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global Analytical Filters
  const [filters, setFilters] = useState({
    branch: 'all',
    batch: 'all',
    timeRange: '30d'
  });

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // System Demo Status
  const [demoStatus, setDemoStatus] = useState({
    isDemoActive: false,
    demoCount: 0,
    totalStudents: 0
  });

  const refreshSystemStatus = async () => {
    try {
      const res = await getSettings();
      if (res.success && res.stats) {
        setDemoStatus({
          isDemoActive: res.stats.isDemoActive,
          demoCount: res.stats.demoCount,
          totalStudents: res.stats.totalStudents
        });
      }
    } catch (e) {
      console.warn('Failed to load system settings', e);
    }
  };

  useEffect(() => {
    refreshSystemStatus();
  }, []);

  // Search Modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global Notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Sidebar responsive state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Keyboard shortcut Cmd/Ctrl + K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        filters,
        updateFilters,
        demoStatus,
        refreshSystemStatus,
        searchModalOpen,
        setSearchModalOpen,
        toast,
        showToast,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileDrawerOpen,
        setMobileDrawerOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
