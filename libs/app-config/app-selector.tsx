"use client";

import React from 'react';
import { useAppSwitcher, useApp } from './app-context';
import type { AppSwitchOptions } from './types';

interface AppSelectorProps {
  className?: string;
  showHostname?: boolean;
  variant?: 'dropdown' | 'pills' | 'minimal';
  onAppSwitch?: (appId: string) => void;
  switchOptions?: AppSwitchOptions;
}

export function AppSelector({ 
  className = '',
  showHostname = true,
  variant = 'dropdown',
  onAppSwitch,
  switchOptions = { preservePath: true, preserveQuery: true }
}: AppSelectorProps) {
  const { currentApp, appConfig, isLoading } = useApp();
  const { availableApps, switchApp, canSwitchToApp } = useAppSwitcher();

  const handleAppSwitch = (appId: string) => {
    if (canSwitchToApp(appId)) {
      onAppSwitch?.(appId);
      switchApp(appId, switchOptions);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-muted rounded-md w-48"></div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-2xl">{appConfig.icon}</span>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{appConfig.name}</span>
          {showHostname && (
            <span className="text-xs text-muted-foreground">
              {appConfig.hostname}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {availableApps.map((app) => (
          <button
            key={app.id}
            onClick={() => handleAppSwitch(app.id)}
            disabled={app.id === currentApp}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors
              ${app.id === currentApp 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }
              disabled:cursor-not-allowed
            `}
            style={{
              backgroundColor: app.id === currentApp ? app.primaryColor : undefined
            }}
          >
            <span>{app.icon}</span>
            <span>{app.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <select
        value={currentApp}
        onChange={(e) => handleAppSwitch(e.target.value)}
        className="
          w-full px-3 py-2 bg-background border border-border rounded-md
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          text-sm font-medium
        "
        style={{
          color: appConfig.primaryColor
        }}
      >
        {availableApps.map((app) => (
          <option key={app.id} value={app.id}>
            {app.icon} {app.name}
            {showHostname ? ` - ${app.hostname}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// Advanced app selector with custom UI
interface AdvancedAppSelectorProps {
  className?: string;
  onAppSwitch?: (appId: string) => void;
  switchOptions?: AppSwitchOptions;
}

export function AdvancedAppSelector({
  className = '',
  onAppSwitch,
  switchOptions = { preservePath: true, preserveQuery: true }
}: AdvancedAppSelectorProps) {
  const { currentApp, appConfig, isLoading } = useApp();
  const { availableApps, switchApp, canSwitchToApp } = useAppSwitcher();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAppSwitch = (appId: string) => {
    if (canSwitchToApp(appId)) {
      setIsOpen(false);
      onAppSwitch?.(appId);
      switchApp(appId, switchOptions);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 bg-muted rounded-lg w-48"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between px-3 py-2 
          bg-card border border-border rounded-lg
          hover:bg-accent hover:text-accent-foreground
          focus:outline-none focus:ring-2 focus:ring-ring
          transition-colors
        "
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{appConfig.icon}</span>
          <div className="flex flex-col items-start">
            <span className="font-medium text-sm">{appConfig.name}</span>
            <span className="text-xs text-muted-foreground">
              {appConfig.hostname}
            </span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="
            absolute top-full left-0 right-0 mt-1 z-50
            bg-popover border border-border rounded-lg shadow-lg
            max-h-96 overflow-y-auto
          ">
            {availableApps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleAppSwitch(app.id)}
                disabled={app.id === currentApp}
                className={`
                  w-full flex items-center gap-3 px-3 py-3
                  text-left transition-colors
                  ${app.id === currentApp 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                  }
                  disabled:cursor-not-allowed
                  first:rounded-t-lg last:rounded-b-lg
                `}
              >
                <span className="text-xl">{app.icon}</span>
                <div className="flex flex-col flex-1">
                  <span className="font-medium text-sm">{app.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {app.description}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {app.hostname}
                  </span>
                </div>
                {app.id === currentApp && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Quick app switcher for navigation
export function AppSwitcherNav({ className = '' }: { className?: string }) {
  const { availableApps, switchApp, isCurrentApp } = useAppSwitcher();

  return (
    <nav className={`flex items-center gap-1 ${className}`}>
      {availableApps.map((app) => (
        <button
          key={app.id}
          onClick={() => !isCurrentApp(app.id) && switchApp(app.id)}
          disabled={isCurrentApp(app.id)}
          className={`
            flex items-center justify-center w-8 h-8 rounded-md
            transition-colors text-sm
            ${isCurrentApp(app.id)
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
            }
            disabled:cursor-not-allowed
          `}
          title={`Switch to ${app.name}`}
          style={{
            backgroundColor: isCurrentApp(app.id) ? app.primaryColor : undefined
          }}
        >
          {app.icon}
        </button>
      ))}
    </nav>
  );
}