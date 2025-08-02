'use client'

import React from 'react'
import { DashboardProviders } from '../providers/DashboardProviders'
import { DashboardLayout } from '../components/DashboardLayout'
import { DashboardErrorBoundary } from '../components/ErrorBoundary'
import type { DashboardLayoutProps, DashboardProvidersProps, DashboardConfig } from '../types'

interface FullDashboardLayoutProps extends 
  Omit<DashboardLayoutProps, 'children'>,
  Pick<DashboardProvidersProps, 'initialTenant' | 'initialError'> {
  children: React.ReactNode
  config?: DashboardConfig
  LanguageProvider?: React.ComponentType<{ children: React.ReactNode; initialLanguage: string }>
  ErrorProvider?: React.ComponentType<{ children: React.ReactNode }>
  initialLanguage?: string
}

/**
 * Complete dashboard layout composition
 * Combines providers, error boundaries, and layout structure
 * Can be extended by specific applications with additional providers
 */
export function FullDashboardLayout({
  children,
  tenant,
  appSchemaData,
  initialTenant,
  initialError,
  config,
  LanguageProvider,
  ErrorProvider,
  initialLanguage = 'en'
}: FullDashboardLayoutProps) {
  const layoutContent = (
    <DashboardLayout config={config} tenant={tenant} appSchemaData={appSchemaData}>
      {children}
    </DashboardLayout>
  )

  const withErrorBoundary = config?.enableErrorBoundaries !== false ? (
    <DashboardErrorBoundary>
      {layoutContent}
    </DashboardErrorBoundary>
  ) : layoutContent

  const withProviders = (
    <DashboardProviders
      initialTenant={initialTenant}
      initialError={initialError}
    >
      {withErrorBoundary}
    </DashboardProviders>
  )

  // Add language provider if provided
  const withLanguageProvider = LanguageProvider ? (
    <LanguageProvider initialLanguage={initialLanguage}>
      {withProviders}
    </LanguageProvider>
  ) : withProviders

  // Add error provider if provided (usually wraps everything else)
  const withErrorProvider = ErrorProvider ? (
    <ErrorProvider>
      {withLanguageProvider}
    </ErrorProvider>
  ) : withLanguageProvider

  return withErrorProvider
}

export default FullDashboardLayout