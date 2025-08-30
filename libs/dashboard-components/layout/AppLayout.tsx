"use client";

import React from "react";
import { DashboardErrorBoundary } from "@repo/base-dashboard";
import type { AppLayoutProps } from "@repo/types";

/**
 * Simple application layout component
 * Provides basic structure with error boundary
 * TODO: Add full sidebar and navigation when components are ready
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
              App ID: {appSchemaData?.appId || "library"}
            </div>
          </div>
        </header>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary>
        <main className="flex-1 container mx-auto p-4">{children}</main>
      </DashboardErrorBoundary>
    </div>
  );
}

export default AppLayout;
