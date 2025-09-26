"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ModuleSchema } from '@repo/types';

/**
 * Sidebar state interface
 */
interface SidebarState {
  currentAppId: string | null;
  modules: ModuleSchema[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

/**
 * Sidebar actions interface
 */
interface SidebarActions {
  refreshSidebar: (appId: string, modules: ModuleSchema[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Combined sidebar context type
 */
interface SidebarContextType extends SidebarState, SidebarActions {}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Initial sidebar state
 */
const initialState: SidebarState = {
  currentAppId: null,
  modules: [],
  isLoading: false,
  error: null,
  lastUpdated: 0
};

/**
 * SidebarProvider component props
 */
interface SidebarProviderProps {
  children: React.ReactNode;
  initialAppId?: string;
  initialModules?: ModuleSchema[];
}

/**
 * SidebarProvider - Manages sidebar state for dynamic module updates
 */
export function SidebarProvider({
  children,
  initialAppId,
  initialModules = []
}: SidebarProviderProps) {
  const [state, setState] = useState<SidebarState>(() => ({
    ...initialState,
    currentAppId: initialAppId || null,
    modules: initialModules,
    lastUpdated: initialAppId ? Date.now() : 0
  }));

  // Refresh sidebar with new app modules
  const refreshSidebar = useCallback((appId: string, modules: ModuleSchema[]) => {
    console.log(`[SIDEBAR_PROVIDER] Refreshing sidebar for app: ${appId} with ${modules.length} modules`);

    setState(prevState => ({
      ...prevState,
      currentAppId: appId,
      modules,
      isLoading: false,
      error: null,
      lastUpdated: Date.now()
    }));
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prevState => ({
      ...prevState,
      isLoading: loading
    }));
  }, []);

  // Set error state
  const setError = useCallback((error: string | null) => {
    setState(prevState => ({
      ...prevState,
      error,
      isLoading: false
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      error: null
    }));
  }, []);

  // Reset sidebar to initial state
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SIDEBAR_PROVIDER] State changed:', {
        appId: state.currentAppId,
        moduleCount: state.modules.length,
        isLoading: state.isLoading,
        error: state.error,
        lastUpdated: new Date(state.lastUpdated).toLocaleTimeString()
      });
    }
  }, [state]);

  const contextValue: SidebarContextType = {
    // State
    currentAppId: state.currentAppId,
    modules: state.modules,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Actions
    refreshSidebar,
    setLoading,
    setError,
    clearError,
    reset
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook to use sidebar context
 */
export function useSidebarContext(): SidebarContextType {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }

  return context;
}

/**
 * Hook for sidebar refresh functionality
 * Provides optimized refresh with loading states and error handling
 */
export function useSidebarRefresh() {
  const {
    refreshSidebar,
    setLoading,
    setError,
    clearError,
    currentAppId,
    isLoading
  } = useSidebarContext();

  const refreshWithLoadingState = useCallback(async (
    appId: string,
    modulesFetcher: () => Promise<ModuleSchema[]>
  ) => {
    // Don't refresh if already loading or if it's the same app
    if (isLoading || currentAppId === appId) {
      console.log(`[SIDEBAR_REFRESH] Skipping refresh - loading: ${isLoading}, same app: ${currentAppId === appId}`);
      return;
    }

    try {
      clearError();
      setLoading(true);

      console.log(`[SIDEBAR_REFRESH] Fetching modules for app: ${appId}`);
      const modules = await modulesFetcher();

      refreshSidebar(appId, modules);

      console.log(`[SIDEBAR_REFRESH] Successfully refreshed sidebar for app: ${appId}`);
    } catch (error) {
      console.error(`[SIDEBAR_REFRESH] Error refreshing sidebar for app ${appId}:`, error);
      setError(error instanceof Error ? error.message : 'Failed to refresh sidebar');
    }
  }, [refreshSidebar, setLoading, setError, clearError, currentAppId, isLoading]);

  return {
    refreshWithLoadingState,
    isLoading,
    currentAppId
  };
}

/**
 * Hook to check if sidebar is ready for a specific app
 */
export function useSidebarReady(appId: string): boolean {
  const { currentAppId, modules, isLoading } = useSidebarContext();

  return !isLoading && currentAppId === appId && modules.length > 0;
}

export default SidebarProvider;