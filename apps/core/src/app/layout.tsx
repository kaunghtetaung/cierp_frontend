import type { Metadata } from "next";
import { fetchLayoutData, generatePageMetadata } from "@/lib/layout-data";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeScript } from "@/components/theme-script";
import { Toaster } from "@repo/ui";
import type { RootLayoutProps } from "@/types/layout";

import "./globals.css";

/**
 * Generate metadata dynamically based on tenant data
 */
export async function generateMetadata(): Promise<Metadata> {
  const { tenant } = await fetchLayoutData();
  const metadata = generatePageMetadata(tenant);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

/**
 * Root layout component
 * Orchestrates data fetching, provider setup, and layout composition
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  // Fetch all layout data in one place including auth data and filtered apps
  const { middlewareData, tenant, tenantError, appSchemaData, authData, filteredApps } =
    await fetchLayoutData();

  return (
    <html lang={middlewareData.language} suppressHydrationWarning>
      <head>
        <title>
          {tenant?.displayName[middlewareData.language] ||
            tenant?.brandInfo?.title ||
            "Application Management System"}
        </title>
        <meta
          name="description"
          content={
            tenant?.localizedDescription[middlewareData.language] ||
            "Core System"
          }
        />
        <ThemeScript />
      </head>
      <body suppressHydrationWarning>
        <AppProviders
          initialLanguage={middlewareData.language}
          initialTenant={tenant}
          initialError={tenantError}
          initialAuth={authData}
          filteredApps={filteredApps}
        >
          <AppLayout
            tenant={tenant}
            appSchemaData={appSchemaData}
            filteredApps={filteredApps}
            authData={authData}
            variant="dashboard"
          >
            {children}
          </AppLayout>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
