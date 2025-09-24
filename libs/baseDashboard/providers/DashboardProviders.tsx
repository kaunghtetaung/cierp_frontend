'use client'

import React from 'react'
import { TenantProvider } from "@repo/tenant"
import { AuthProvider } from "@repo/auth"
import type { DashboardProvidersProps } from "../types"

/**
 * Base dashboard provider composition
 * Provides essential providers for any dashboard application
 * To be extended by specific applications (core, library, ctms, cmps)
 */
export function DashboardProviders({
  children,
  initialTenant,
  initialError,
  initialAuth
}: Omit<DashboardProvidersProps, 'initialLanguage'>) {

  return (
    <AuthProvider
      initialUser={initialAuth?.user || null}
      initialSession={initialAuth?.session || null}
    >
      <TenantProvider
        initialTenant={initialTenant}
        initialError={initialError}
      >
        {/* No AuthGuard needed - auth already validated by middleware/layout */}
        {children}
      </TenantProvider>
    </AuthProvider>
  )
}

export default DashboardProviders