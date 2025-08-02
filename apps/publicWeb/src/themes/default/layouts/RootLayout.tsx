import React from "react";
import { headers } from "next/headers";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { ThemeProvider } from "./ThemeProvider";
import { ClientProviders } from "./ClientProviders";
import { ThemeLayout } from "./ThemeLayout";

import "../styles/index.css";

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
  // Get initial data from middleware and headers
  const middlewareData = await getMiddlewareDataFromHeaders();
  const currentLanguage = middlewareData.language || "en";

  // TODO: Get initial user data from your auth system
  // const userSession = await getSessionData();
  const initialUser = null; // Will be replaced with real user data

  return (
    <html lang={currentLanguage} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
        <title>{tenantSetting?.brandInfo?.title || "CMS Frontend"}</title>
        <meta
          name="description"
          content={
            tenantSetting?.brandInfo?.description ||
            "Content Management System Frontend"
          }
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ClientProviders
            initialLanguage={currentLanguage}
            initialUser={initialUser}
          >
            <ThemeLayout tenantSetting={tenantSetting}>{children}</ThemeLayout>
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;
