import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeLayout } from "./ThemeLayout";

import "../styles/index.css";

// NOTE: LangSelector / UserMenu / Search providers are mounted at the
// app root (`src/components/AppClientProviders.tsx` → `app/layout.tsx`)
// — every route gets them, including the theme-independent ones
// (library, login, register). Theme RootLayouts only handle theme-
// scoped concerns (dark/light mode, theme-specific tenant chrome).

interface RootLayoutProps {
  children: React.ReactNode;
  tenantSetting?: Record<string, any> | null;
}

/**
 * Root Layout Component
 * The main layout wrapper that provides all context and structure
 * This is the entry point for the entire theme system
 */
export async function RootLayout({ children, tenantSetting }: RootLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ThemeLayout tenantSetting={tenantSetting}>{children}</ThemeLayout>
    </ThemeProvider>
  );
}

export default RootLayout;
