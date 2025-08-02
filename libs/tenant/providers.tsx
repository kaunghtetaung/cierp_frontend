// Tenant context providers with enhanced functionality
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { TenantSettings, TenantContextValue, TenantProviderProps } from '@repo/types';
import { getLocalizedText } from '@repo/utils';


// Tenant Context
const TenantContext = createContext<TenantContextValue | undefined>(undefined);

/**
 * Tenant Provider Component
 */
export function TenantProvider({ 
  children, 
  initialTenant = null, 
  initialError = null 
}: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantSettings | null>(initialTenant);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  // Refresh tenant data - only used for manual refresh, not initial load
  const refreshTenant = useCallback(async () => {
    // Since tenant is provided by server-side layout, 
    // refresh would require a full page reload to get updated server data
    window.location.reload();
  }, []);

  // No initialization needed - tenant is provided by server-side layout

  // Listen for tenant changes (e.g., from cookie updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tenant-updated') {
        refreshTenant();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshTenant]);

  const contextValue: TenantContextValue = {
    tenant,
    isLoading,
    error,
    refreshTenant,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to use tenant context
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
}

/**
 * Hook to get current tenant (convenience)
 */
export function useCurrentTenant(): TenantSettings | null {
  const { tenant } = useTenant();
  return tenant;
}

/**
 * Hook to check if tenant is loading
 */
export function useTenantLoading(): boolean {
  const { isLoading } = useTenant();
  return isLoading;
}

/**
 * Hook to get tenant error
 */
export function useTenantError(): string | null {
  const { error } = useTenant();
  return error;
}

/**
 * Hook to refresh tenant data
 */
export function useRefreshTenant(): () => Promise<void> {
  const { refreshTenant } = useTenant();
  return refreshTenant;
}

/**
 * Higher-order component to require tenant
 */
export function withTenant<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WithTenantComponent = (props: P) => {
    const { tenant, isLoading, error } = useTenant();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (error || !tenant) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tenant Not Available
            </h2>
            <p className="text-gray-600">
              {error || 'Unable to load tenant information'}
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  WithTenantComponent.displayName = `withTenant(${Component.displayName || Component.name})`;
  return WithTenantComponent;
}

/**
 * Component to display tenant information
 */
export function TenantInfo({ className = '' }: { className?: string }) {
  const { tenant, isLoading, error } = useTenant();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Tenant unavailable
      </div>
    );
  }

  return (
    <div className={className}>
      <span className="text-sm font-medium">{getLocalizedText(tenant.displayName)}</span>
      {getLocalizedText(tenant.displayShortName) && (
        <span className="text-xs text-gray-500 ml-2">
          {getLocalizedText(tenant.displayShortName)}
        </span>
      )}
    </div>
  );
}

/**
 * Component to display tenant logo
 */
export function TenantLogo({ 
  className = '',
  size = 'md',
  showFallback = true 
}: { 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFallback?: boolean;
}) {
  const { tenant } = useTenant();

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };


  if (!tenant?.brandInfo.logoUrl) {
    if (!showFallback) return null;
    
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded flex items-center justify-center ${className}`}>
        <span className="text-gray-500 font-semibold text-xs">
          {getLocalizedText(tenant?.displayName)?.charAt(0) || '?'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={tenant.brandInfo.logoUrl}
      alt={`${getLocalizedText(tenant.displayName)} logo`}
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={(e) => {
        if (showFallback) {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          // Could replace with fallback div here
        }
      }}
    />
  );
}

/**
 * Tenant selector component (for switching between tenants)
 */
export function TenantSelector({ 
  onTenantChange,
  className = '' 
}: {
  onTenantChange?: (tenantId: string) => void;
  className?: string;
}) {
  const { tenant } = useTenant();
  const [availableTenants, setAvailableTenants] = useState<TenantSettings[]>([]);
  const [isOpen, setIsOpen] = useState(false);


  useEffect(() => {
    // Fetch available tenants for the current user
    // This would typically come from an API
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/user/tenants');
        if (response.ok) {
          const tenants = await response.json();
          setAvailableTenants(tenants);
        }
      } catch (error) {
        console.error('Failed to fetch available tenants:', error);
      }
    };

    fetchTenants();
  }, []);

  const handleTenantSelect = (tenantId: string) => {
    setIsOpen(false);
    onTenantChange?.(tenantId);
    
    // Navigate to new tenant domain or update state
    // This would depend on your routing strategy
    window.location.href = `/switch-tenant?id=${encodeURIComponent(tenantId)}`;
  };

  if (!tenant || availableTenants.length <= 1) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
      >
        <TenantLogo size="sm" />
        <span>{getLocalizedText(tenant.displayName)}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50">
          {availableTenants.map((availableTenant) => (
            <button
              type="button"
              key={availableTenant.id}
              onClick={() => handleTenantSelect(availableTenant.id)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
            >
              <div className="h-4 w-4 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs">
                  {getLocalizedText(availableTenant.displayName).charAt(0)}
                </span>
              </div>
              <span>{getLocalizedText(availableTenant.displayName)}</span>
              {availableTenant.id === tenant.id && (
                <span className="ml-auto text-green-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}