import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, getPlatformsStatus, triggerPlatformSync } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Theme management — Light theme is the primary default experience
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cci_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('cci_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global Analytical Filters
  const [filters, setFilters] = useState({
    branch: 'all',
    batch: 'all',
    semester: 'all',
    timeRange: '30d'
  });

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Platform Synchronization Metadata (Real backend timestamps)
  const [syncMetadata, setSyncMetadata] = useState({
    latestSyncTime: null,
    syncState: 'never', // 'synced' | 'syncing' | 'stale' | 'error' | 'never'
    platforms: [],
    isSyncing: false
  });

  const refreshSyncStatus = useCallback(async () => {
    try {
      const res = await getPlatformsStatus();
      if (res.success && Array.isArray(res.platforms)) {
        let maxSync = null;
        let hasErrors = false;

        res.platforms.forEach(p => {
          if (p.lastSync) {
            const syncDate = new Date(p.lastSync);
            if (!maxSync || syncDate > maxSync) {
              maxSync = syncDate;
            }
          }
          if (p.errorCount > 0) hasErrors = true;
        });

        let state = 'never';
        if (maxSync) {
          const ageHours = (Date.now() - maxSync.getTime()) / (1000 * 60 * 60);
          if (ageHours < 2) {
            state = 'synced';
          } else if (ageHours < 24) {
            state = 'synced';
          } else {
            state = 'stale';
          }
        } else if (hasErrors) {
          state = 'error';
        }

        setSyncMetadata(prev => ({
          ...prev,
          latestSyncTime: maxSync ? maxSync.toISOString() : null,
          syncState: prev.isSyncing ? 'syncing' : state,
          platforms: res.platforms
        }));
      }
    } catch (e) {
      console.warn('Failed to load platform synchronization status:', e);
    }
  }, []);

  const triggerGlobalSync = async (platform = 'all') => {
    setSyncMetadata(prev => ({ ...prev, isSyncing: true, syncState: 'syncing' }));
    try {
      await triggerPlatformSync(platform);
      await refreshSyncStatus();
      return { success: true };
    } catch (e) {
      setSyncMetadata(prev => ({ ...prev, isSyncing: false, syncState: 'error' }));
      return { success: false, error: e.message };
    } finally {
      setSyncMetadata(prev => ({ ...prev, isSyncing: false }));
    }
  };

  useEffect(() => {
    refreshSyncStatus();
  }, [refreshSyncStatus]);

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
        syncMetadata,
        refreshSyncStatus,
        triggerGlobalSync,
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
