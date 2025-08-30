"use client";

import React from "react";
import { AppLayout as SharedAppLayout } from "@repo/dashboard-components/layout";
import type { AppLayoutProps } from "@/types/layout";
/**
 * Library application layout component using shared dashboard components
 */
export function AppLayout({ children, tenant, appSchemaData }: AppLayoutProps) {
  return (
    <SharedAppLayout tenant={tenant} appSchemaData={appSchemaData}>
      {children}
    </SharedAppLayout>
  );
}

export default AppLayout;
