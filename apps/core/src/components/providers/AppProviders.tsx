'use client'

import React from 'react'
import { createStandardDashboardProviders } from "@repo/base-dashboard"
import { LanguageProvider } from "@repo/language"
import ErrorProvider from "@/components/error/ErrorProvider"
import { QueryProvider } from "@/lib/query-client"
import { ThemeProvider } from "@/components/providers/theme-provider"
import type { AppProvidersProps } from "@/types/layout"

/**
 * Core application providers using baseDashboard architecture
 * Extends the base dashboard providers with core-specific providers
 */
const CoreDashboardProviders = createStandardDashboardProviders(
  LanguageProvider,
  ErrorProvider
)

export function AppProviders({
  children,
  initialLanguage,
  initialTenant,
  initialError,
  initialAuth,
  filteredApps
}: AppProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system">
        <CoreDashboardProviders
          initialLanguage={initialLanguage}
          initialTenant={initialTenant}
          initialError={initialError}
          initialAuth={initialAuth}
          filteredApps={filteredApps}
        >
          {children}
        </CoreDashboardProviders>
      </ThemeProvider>
    </QueryProvider>
  )
}

export default AppProviders