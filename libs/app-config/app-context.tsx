"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAppFromHostname, getAppConfig, switchToApp } from './hostname-utils';
import { getAvailableApps } from './configs';
import type { AppConfig, AppSwitchOptions } from './types';

interface AppContextType {
  // Current app state
  currentApp: string;
  appConfig: AppConfig;
  hostname: string;
  isLoading: boolean;
  
  // Available apps
  availableApps: AppConfig[];
  
  // App switching
  switchApp: (appId: string, options?: AppSwitchOptions) => void;
  
  // Utilities
  isCurrentApp: (appId: string) => boolean;
  canSwitchToApp: (appId: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
  // Allow server-side provided initial values
  initialAppId?: string;
  initialHostname?: string;
}

export function AppProvider({ 
  children, 
  initialAppId,
  initialHostname 
}: AppProviderProps) {
  const [currentApp, setCurrentApp] = useState<string>(initialAppId || 'core');
  const [hostname, setHostname] = useState<string>(initialHostname || '');
  const [isLoading, setIsLoading] = useState(true);
  const [availableApps] = useState<AppConfig[]>(getAvailableApps());

  // Initialize app context from hostname and path
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const windowHostname = window.location.hostname;
      const windowPathname = window.location.pathname;
      const detectedAppId = getAppFromHostname(windowHostname, windowPathname);
      
      setHostname(windowHostname);
      
      // Only update if different from initial or current
      if (detectedAppId !== currentApp) {
        setCurrentApp(detectedAppId);
        console.log(`🔧 App context initialized: ${detectedAppId} from hostname: ${windowHostname}, path: ${windowPathname}`);
      }
    } catch (error) {
      console.error('Failed to initialize app context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentApp]);

  // Update when hostname or path changes (for SPA navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      const newHostname = window.location.hostname;
      const newPathname = window.location.pathname;
      const newAppId = getAppFromHostname(newHostname, newPathname);
      
      if (newAppId !== currentApp) {
        setCurrentApp(newAppId);
        setHostname(newHostname);
        console.log(`🔧 App context updated: ${newAppId} from hostname: ${newHostname}, path: ${newPathname}`);
      }
    };

    // Listen for navigation changes
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [hostname, currentApp]);

  const appConfig = getAppConfig(currentApp);

  const contextValue: AppContextType = {
    currentApp,
    appConfig,
    hostname,
    isLoading,
    availableApps,
    
    switchApp: (appId: string, options?: AppSwitchOptions) => {
      if (appId === currentApp) return;
      
      try {
        switchToApp(appId, options);
      } catch (error) {
        console.error('Failed to switch app:', error);
      }
    },
    
    isCurrentApp: (appId: string) => appId === currentApp,
    
    canSwitchToApp: (appId: string) => {
      return availableApps.some(app => app.id === appId) && appId !== currentApp;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Additional hooks for specific use cases
export function useCurrentApp(): string {
  return useApp().currentApp;
}

export function useAppConfig(): AppConfig {
  return useApp().appConfig;
}

export function useAppSwitcher() {
  const { switchApp, availableApps, isCurrentApp, canSwitchToApp } = useApp();
  
  return {
    switchApp,
    availableApps,
    isCurrentApp,
    canSwitchToApp
  };
}