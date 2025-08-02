'use client'

import React from 'react'
import { DashboardErrorBoundary } from '../components/ErrorBoundary'
import type { DashboardConfig } from '../types'

interface MinimalDashboardLayoutProps {
  children: React.ReactNode
  config?: DashboardConfig
  showErrorBoundary?: boolean
}

/**
 * Minimal dashboard layout for simple applications
 * Provides basic structure without heavy provider setup
 * Useful for lightweight dashboard pages or embedded components
 */
export function MinimalDashboardLayout({
  children,
  config,
  showErrorBoundary = true
}: MinimalDashboardLayoutProps) {
  const content = (
    <div className="min-h-screen bg-background">
      {config?.headerTitle && (
        <header className="border-b border-border bg-card">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold">{config.headerTitle}</h1>
          </div>
        </header>
      )}
      
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )

  if (showErrorBoundary) {
    return (
      <DashboardErrorBoundary>
        {content}
      </DashboardErrorBoundary>
    )
  }

  return content
}

export default MinimalDashboardLayout