'use client'

import React from 'react'
import { TenantProvider } from "@repo/tenant"
import { AuthProvider, AuthGuard } from "@repo/auth"
import { DashboardLoadingPage } from "../components/LoadingPage"
import type { DashboardProvidersProps } from "../types"

/**
 * Base dashboard provider composition
 * Provides essential providers for any dashboard application
 * To be extended by specific applications (core, library, ctms, cmps)
 */
export function DashboardProviders({
  children,
  initialTenant,
  initialError
}: Omit<DashboardProvidersProps, 'initialLanguage'>) {
  // Create loading fallback for AuthGuard
  // Use a simple loading component since language context isn't available during auth
  const authLoadingFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-auto p-6">
        <div className="text-center">
          {/* Loading Animation */}
          <div className="relative mb-8">
            {/* Outer ring */}
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-muted"></div>
            
            {/* Spinning ring */}
            <div className="absolute inset-0 mx-auto w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
            
            {/* Inner pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Loading Title */}
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Authenticating...
          </h1>

          {/* Loading Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Please wait while we verify your access.
          </p>

          {/* Security indicator */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3">🔒</div>
              <span>Secure Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <AuthProvider>
      <TenantProvider
        initialTenant={initialTenant}
        initialError={initialError}
      >
        <AuthGuard loadingFallback={authLoadingFallback}>
          {children}
        </AuthGuard>
      </TenantProvider>
    </AuthProvider>
  )
}

export default DashboardProviders