import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeLayout } from "./ThemeLayout";

import "../styles/index.css";

interface RootLayoutProps {
  children: React.ReactNode;
  tenantSetting?: Record<string, any> | null;
}

/**
 * um1sf Root Layout
 *
 * Theme-scoped wrapper invoked by `app/(cms)/layout.tsx` via the
 * theme registry. Mounts the dark/light ThemeProvider and the
 * Stanford-style ThemeLayout (which paints UM1's own header +
 * footer — NOT the shared site-shell).
 *
 * Library / login / register routes use `SiteShellLayout` and don't
 * touch this file.
 */
export async function RootLayout({ children, tenantSetting }: RootLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ThemeLayout tenantSetting={tenantSetting}>{children}</ThemeLayout>
    </ThemeProvider>
  );
}

export default RootLayout;
