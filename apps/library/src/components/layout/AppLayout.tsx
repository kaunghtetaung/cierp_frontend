"use client";

import React from "react";
import { DashboardErrorBoundary } from "@repo/base-dashboard";
import type { AppLayoutProps } from "@/types/layout";

/**
 * Library application layout component
 * Simple layout with error boundary for library app
 */
export function AppLayout({ children, tenant, appSchemaData }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardErrorBoundary>
        <header className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              {tenant?.displayName?.en || "Library System"}
            </h1>
            <div className="text-sm text-muted-foreground">
              App: {appSchemaData?.appId || "library"}
            </div>
          </div>
        </header>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary>
        <main className="flex-1 container mx-auto p-4 max-w-7xl">{children}</main>
      </DashboardErrorBoundary>
    </div>
  );
}

export default AppLayout;
