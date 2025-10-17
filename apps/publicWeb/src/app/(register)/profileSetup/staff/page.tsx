import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthenticationStatus } from "@repo/auth/server";
import { StaffRegistrationWizard } from "./components/StaffRegistrationWizard";

// Fetch staff module schema
async function getStaffModuleSchema() {
  try {
    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.tenantId) {
      return {
        success: false,
        error: "Tenant context not found",
      };
    }

    const tenantId = authResult.tenantId;
    const userId = authResult.isAuthenticated && authResult.user ? authResult.user.id : undefined;

    console.log("🔍 [getStaffModuleSchema] Getting schema with context:", {
      tenantId,
      userId,
      isAuthenticated: authResult.isAuthenticated
    });

    // Import getModuleSchemas dynamically to avoid circular dependencies
    const { getModuleSchemas } = await import("@repo/appSchema/wrapper");

    // Call /cpms/initialize to get all CPMS modules, then find staff module
    const initializeResponse = await getModuleSchemas(tenantId, "cpms");

    if (!initializeResponse || !initializeResponse.modules || initializeResponse.modules.length === 0) {
      return {
        success: false,
        error: "CPMS modules not found",
      };
    }

    // Find staff module from the CPMS modules list
    const { findModuleBySlug } = await import("@repo/types");
    const staffModule = findModuleBySlug(Array.from(initializeResponse.modules), "staff");

    if (!staffModule) {
      return {
        success: false,
        error: "Staff module schema not found in CPMS modules",
      };
    }

    return {
      success: true,
      module: staffModule,
    };
  } catch (error) {
    console.error("❌ [getStaffModuleSchema] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch staff module schema",
    };
  }
}

export default async function StaffProfileSetupPage() {
  // Get authentication status
  const authStatus = await getAuthenticationStatus();

  // Redirect to login if not authenticated
  if (!authStatus.isAuthenticated || !authStatus.user) {
    redirect("/login?callbackUrl=/profileSetup/staff");
  }

  const user = authStatus.user;

  // Fetch staff module schema
  const schemaResult = await getStaffModuleSchema();

  if (!schemaResult.success || !schemaResult.module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Form</h2>
            <p className="text-gray-600 mb-6">{schemaResult.error}</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading staff registration form...</p>
          </div>
        </div>
      }
    >
      <StaffRegistrationWizard moduleSchema={schemaResult.module} user={user} />
    </Suspense>
  );
}
