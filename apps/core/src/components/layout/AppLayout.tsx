"use client";

import React from "react";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@repo/ui";
import { DashboardErrorBoundary } from "@repo/base-dashboard";
import { AppSidebar } from "@/components/common/sidebar";
import Header from "@/components/common/header";
import type { AppLayoutProps } from "@/types/layout";
import { cn } from "@repo/ui";
/**
 * Content wrapper that adapts to sidebar state
 */
function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { state, isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-1 flex-col transition-all duration-200 ease-linear",
        !isMobile && state === "expanded" && "lg:pl-[var(--sidebar-width)]"
      )}
    >
      {children}
    </div>
  );
}

/**
 * Core application layout component using baseDashboard architecture
 * Handles the sidebar, header, and main content area with error boundaries
 */
export function AppLayout({ children, tenant, appSchemaData }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardErrorBoundary>
        <AppSidebar tenant={tenant} appSchemaData={appSchemaData} />
      </DashboardErrorBoundary>

      <SidebarInset>
        <DashboardErrorBoundary>
          <Header tenant={tenant} appSchemaData={appSchemaData} />
        </DashboardErrorBoundary>

        <DashboardErrorBoundary>
          <main className="flex flex-1 flex-col p-4 min-w-0 overflow-hidden">{children}</main>
        </DashboardErrorBoundary>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AppLayout;
