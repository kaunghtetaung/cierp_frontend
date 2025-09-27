import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { fetchLayoutData, generatePageMetadata } from "@/lib/layout-data";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeScript } from "@/components/theme-script";
import { Toaster } from "@repo/ui";
import type { RootLayoutProps } from "@/types/layout";

import "./globals.css";

/**
 * Generate metadata dynamically based on tenant data
 * App-aware metadata generation
 */
export async function generateMetadata(): Promise<Metadata> {
  // Extract appId from headers for app-specific metadata
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Extract appId from URL path
  const pathSegments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const appId = pathSegments.length > 0 ? pathSegments[0] : undefined;

  const { tenant } = await fetchLayoutData(appId);
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
  // Get pathname directly from Next.js headers to check for unauthorized route
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Extract appId from URL path for app-aware layout data fetching
  const pathSegments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const appId = pathSegments.length > 0 ? pathSegments[0] : undefined;

  // Debug: Log pathname and appId to understand routing
  console.log(`[LAYOUT_DEBUG] pathname: '${pathname}', appId: '${appId}', startsWith /unauthorized: ${pathname.startsWith('/unauthorized')}`);

  // Skip access control for unauthorized page to prevent redirect loops
  if (pathname.startsWith('/unauthorized')) {
    console.log(`[LAYOUT_SKIP] Skipping access control for unauthorized page`);
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Access Denied</title>
          <meta name="description" content="Access denied - insufficient permissions" />
          <ThemeScript />
        </head>
        <body suppressHydrationWarning>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }

  // Check if request is directly to app.tenantid.com root path
  // Skip AppProviders and AppLayout for direct landing page access
  if (pathname === '/' || pathname === '') {
    console.log(`[LAYOUT_LANDING] Direct access to landing page, skipping AppProviders`);

    // Fetch minimal layout data for landing page
    const { middlewareData: fullMiddlewareData, tenant } = await fetchLayoutData(undefined);

    return (
      <html lang={fullMiddlewareData.language || "en"} suppressHydrationWarning>
        <head>
          <title>
            {tenant?.displayName[fullMiddlewareData.language || "en"] ||
              tenant?.brandInfo?.title ||
              "Application Management System"}
          </title>
          <meta
            name="description"
            content={
              tenant?.localizedDescription[fullMiddlewareData.language || "en"] ||
              "Core System Portal"
            }
          />
          <ThemeScript />
        </head>
        <body suppressHydrationWarning>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }

  // Fetch all layout data with app-specific caching for proper sidebar redraw
  const { middlewareData: fullMiddlewareData, tenant, tenantError, appSchemaData, authData, filteredApps, currentAppAccess } =
    await fetchLayoutData(appId);

  // Application-level access control
  // Check if user has access to the current application based on tenant settings
  if (currentAppAccess && !currentAppAccess.hasAccess) {
    const appId = fullMiddlewareData.appId
    const reason = encodeURIComponent(currentAppAccess.reason || "Access denied")

    console.log(`[LAYOUT_ACCESS_DENIED] Redirecting to unauthorized page - App: ${appId}, Reason: ${currentAppAccess.reason}`)

    // Redirect to unauthorized page with app and reason information
    redirect(`/unauthorized?app=${appId}&reason=${reason}`)
  }

  return (
    <html lang={fullMiddlewareData.language} suppressHydrationWarning>
      <head>
        <title>
          {tenant?.displayName[fullMiddlewareData.language] ||
            tenant?.brandInfo?.title ||
            "Application Management System"}
        </title>
        <meta
          name="description"
          content={
            tenant?.localizedDescription[fullMiddlewareData.language] ||
            "Core System"
          }
        />
        <ThemeScript />
      </head>
      <body suppressHydrationWarning>
        <AppProviders
          initialLanguage={fullMiddlewareData.language}
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
