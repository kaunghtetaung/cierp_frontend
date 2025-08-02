import type { Metadata } from "next";
import { TenantProvider } from "@repo/tenant";
import { getCurrentTenantForClient } from "@repo/tenant/wrapper";
import { GlobalErrorFallback } from "@/base-components/error/GlobalErrorFallback";

export const metadata: Metadata = {
  title: "CMS Frontend",
  description: "Content Management System Frontend",
};

// Critical error fallback when tenant system completely fails
function CriticalErrorFallback({ error }: { error: string }) {
  return (
    <GlobalErrorFallback
      title="System Error"
      message="We're experiencing technical difficulties loading this website."
      reasons={[
        "Server configuration issues",
        "Database connectivity problems",
        "Tenant configuration not found",
        "Network connectivity issues",
        "Maintenance in progress",
      ]}
      error={error}
    />
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialTenant = null;
  let initialError = null;
  let criticalError = false;

  try {
    // Get current tenant using the wrapper pattern
    initialTenant = await getCurrentTenantForClient();

    if (!initialTenant) {
      initialError = "No tenant found or tenant is inactive";
      // This might not be critical if TenantProvider can handle it
    }
  } catch (error) {
    console.error("Failed to load tenant in root layout:", error);
    initialError =
      error instanceof Error ? error.message : "Failed to load tenant";

    // Determine if this is a critical error that prevents the app from working
    if (error instanceof Error) {
      // Critical errors that prevent the entire app from working
      if (
        error.message.includes("connection") ||
        error.message.includes("timeout") ||
        error.message.includes("server") ||
        error.message.includes("unavailable") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes('init["status"] must be in the range') ||
        error.message.includes("fetch failed") ||
        error.message.includes("Network Error") ||
        error.message.includes("Service Unavailable") ||
        error.message.includes("Gateway Exception")
      ) {
        criticalError = true;
      }
    }
  }

  // If we have a critical error, render fallback UI instead of TenantProvider
  if (criticalError && initialError) {
    console.error("Critical error in RootLayout:", initialError);
    return <CriticalErrorFallback error={initialError} />;
  }

  // Normal operation - use TenantProvider (can handle non-critical tenant errors)
  return (
    <TenantProvider initialTenant={initialTenant} initialError={initialError}>
      {children}
    </TenantProvider>
  );
}
