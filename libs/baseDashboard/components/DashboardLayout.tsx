'use client'

import React from 'react'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { DashboardLayoutProps, DashboardConfig } from "../types"

/**
 * Base dashboard layout component
 * Provides the fundamental layout structure for dashboard applications
 * Can be customized via config or extended by specific applications
 */
export function DashboardLayout({ 
  children, 
  config = {} 
}: DashboardLayoutProps & { config?: DashboardConfig }) {
  const {
    showSidebar = true,
    sidebarCollapsible = true,
    enableErrorBoundaries = true
  } = config

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }

  return (
    <SidebarProvider>
      {/* Sidebar will be injected by the implementing application */}
      <div id="dashboard-sidebar-slot" />
      
      <SidebarInset>
        {/* Header will be injected by the implementing application */}
        <div id="dashboard-header-slot" />
        
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardLayout