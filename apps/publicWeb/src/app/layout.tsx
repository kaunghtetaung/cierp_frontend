import type { Metadata } from "next";
import { TenantProvider } from "@repo/tenant";
import { getCurrentTenantForClient, getTenantWithSecrets } from "@repo/tenant/wrapper";
import { initializeTenantToken } from "@repo/tenant/token-initializer";
import { GlobalErrorFallback } from "@/base-components/error/GlobalErrorFallback";
import "./globals.css";

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
    } else {
      // Initialize tenant access token after getting tenant settings
      // This ensures the token is ready before any content API calls
      try {
        // Get tenant with secrets for token initialization
        const tenantWithSecrets = await getTenantWithSecrets(initialTenant.id);
        
        if (tenantWithSecrets) {
          const initResult = await initializeTenantToken(tenantWithSecrets);
          
          if (initResult.success) {
            console.log(`✅ Layout: Tenant token initialized for ${initialTenant.id}`);
          } else if (initResult.hasCredentials) {
            console.warn(`⚠️ Layout: Failed to create tenant token for ${initialTenant.id}: ${initResult.error}`);
          } else {
            console.log(`ℹ️ Layout: Tenant ${initialTenant.id} has no API credentials configured`);
          }
          
          // Log details for debugging
          if (initResult.details) {
            console.log(`   Token init details:`, initResult.details);
          }
        }
      } catch (tokenInitError) {
        // Token initialization failure is not critical - system can fall back to initializer token
        console.error(`Failed to initialize tenant token:`, tokenInitError);
      }
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
    return (
      <html lang="en">
        <body>
          <CriticalErrorFallback error={initialError} />
        </body>
      </html>
    );
  }

  // Normal operation - use TenantProvider (can handle non-critical tenant errors)
  return (
    <html lang="en">
      <body>
        <TenantProvider initialTenant={initialTenant} initialError={initialError}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
