"use client";

import React from "react";
import { SidebarInset, SidebarProvider } from "@repo/ui";
import { DashboardErrorBoundary } from "@repo/base-dashboard";
import { AppSidebar } from "@/components/common/sidebar";
import Header from "@/components/common/header";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import type { AppLayoutProps } from "@/types/layout";
import { cn } from "@repo/ui";

interface EnhancedAppLayoutProps extends AppLayoutProps {
  variant?: "default" | "dashboard";
  headerProps?: {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    showBreadcrumbs?: boolean;
  };
}

/**
 * Core application layout component using baseDashboard architecture
 * Handles the sidebar, header, and main content area with error boundaries
 * Now supports dashboard-01 variant for enhanced styling
 */
export function AppLayout({
  children,
  tenant,
  appSchemaData,
  filteredApps,
  authData,
  variant = "default",
  headerProps,
}: EnhancedAppLayoutProps) {
  const isDashboard = variant === "dashboard";

  console.log("kaunghtet", tenant);

  return (
    <SidebarProvider>
      <DashboardErrorBoundary>
        <AppSidebar tenant={tenant} appSchemaData={appSchemaData} filteredApps={filteredApps} authData={authData} />
      </DashboardErrorBoundary>

      <SidebarInset>
        <DashboardErrorBoundary>
          {isDashboard ? (
            <DashboardHeader
              tenant={tenant}
              appSchemaData={appSchemaData}
              {...headerProps}
            />
          ) : (
            <Header tenant={tenant} appSchemaData={appSchemaData} />
          )}
        </DashboardErrorBoundary>

        <DashboardErrorBoundary>
          <main
            className={cn(
              "flex flex-1 flex-col min-w-0 h-full max-h-full",
              isDashboard ? "overflow-auto bg-muted/20" : "overflow-hidden p-4"
            )}
          >
            {isDashboard ? (
              <div className="container mx-auto p-6 space-y-6">{children}</div>
            ) : (
              children
            )}
          </main>
        </DashboardErrorBoundary>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AppLayout;
