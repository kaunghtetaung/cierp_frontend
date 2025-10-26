"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getModuleSchemas } from "@repo/appSchema/wrapper";
import { createHttpClient } from "@repo/api";
import { getAuthenticationStatus } from "@repo/auth/server";
import { TokenManager } from "@repo/auth/token-manager";
import { getApiDomain } from "@repo/utils/server";
import type { ModuleSchema } from "@repo/types";
import { withServerActionErrorHandler } from "@repo/utils/server";

/**
 * Region data interface - raw API response
 */
interface RegionDataRaw {
  pcode: string;
  type: string;
  postalCode?: string;
  stateRegion: string;
  district: string;
  township: string;
  town: string;
  ward?: string;
  districtPCode: string;
  townshipPCode: string;
}

/**
 * Formatted region data for dropdown display
 */
export interface RegionData {
  value: string; // Full path as unique ID
  label: string; // Full path for dropdown display
  displayValue: string; // Lowest level for selected display (town)
  pcode: string;
  stateRegion: string;
  district: string;
  township: string;
  town: string;
}

// Legacy alias for backward compatibility
export type Region = RegionData;

/**
 * Fetch students module schema for self-registration
 * This is a public action that doesn't require authentication
 */
export async function getStudentsModuleSchema() {
  return withServerActionErrorHandler(async () => {
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

    console.log("🔍 [getStudentsModuleSchema] Getting schema with context:", {
      tenantId,
      userId,
      isAuthenticated: authResult.isAuthenticated
    });

    // Use getModuleSchemas wrapper which internally uses HttpClient
    // Call /cpms/initialize to get all CPMS modules, then find students module
    const initializeResponse = await getModuleSchemas(tenantId, "cpms");

    if (!initializeResponse || !initializeResponse.modules || initializeResponse.modules.length === 0) {
      return {
        success: false,
        error: "CPMS modules not found",
      };
    }

    // Find students module from the CPMS modules list
    const { findModuleBySlug } = await import("@repo/types");
    const studentsModule = findModuleBySlug(Array.from(initializeResponse.modules), "students");

    if (!studentsModule) {
      return {
        success: false,
        error: "Students module schema not found in CPMS modules",
      };
    }

    return {
      success: true,
      module: studentsModule,
    };
  }, {
    operation: 'get-students-schema',
    component: 'student-registration-actions'
  });
}

/**
 * Search regions using the search endpoint
 * @param query - Search query string
 * @param limit - Optional limit (currently not used by API)
 * @param page - Optional page (currently not used by API)
 */
export async function searchRegions(
  query: string,
  limit?: number,
  page?: number
) {
  return withServerActionErrorHandler(async () => {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.tenantId) {
      return {
        success: false,
        error: "Tenant context not found",
      };
    }

    // Get tenant-based API domain (e.g., http://api.um1ygn.edu.mm)
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });
    const userId = authResult.isAuthenticated && authResult.user ? authResult.user.id : undefined;

    console.log("🔍 [searchRegions] Searching with query:", query, "API URL:", apiUrl);

    const result = await httpClient.request<RegionDataRaw[]>(
      `/core/regions/search?search=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        withAuth: true,
        userId: userId,
        tokenStrategy: 'auto' // Use cached token for search
      }
    );

    if (!result.success || !result.data) {
      return {
        success: result.success,
        data: [],
        error: result.error,
      };
    }

    // Filter out wards (only keep towns)
    const townRecords = result.data.filter(item => item.type === 'town');

    // Deduplicate by full path (stateRegion + district + township + town)
    const uniqueRecordsMap = new Map<string, RegionDataRaw>();
    townRecords.forEach(item => {
      const key = `${item.stateRegion}|${item.district}|${item.township}|${item.town}`;
      if (!uniqueRecordsMap.has(key)) {
        uniqueRecordsMap.set(key, item);
      }
    });

    // Transform to dropdown format
    const formattedData: RegionData[] = Array.from(uniqueRecordsMap.values()).map(item => ({
      value: `${item.stateRegion}|${item.district}|${item.township}|${item.town}`,
      label: `${item.stateRegion}, ${item.district}, ${item.township}, ${item.town}`,
      displayValue: item.town, // Show only town in selected display
      pcode: item.pcode,
      stateRegion: item.stateRegion,
      district: item.district,
      township: item.township,
      town: item.town,
    }));

    console.log(`✅ [searchRegions] Found ${formattedData.length} unique towns (filtered ${result.data.length - townRecords.length} wards)`);

    return {
      success: true,
      data: formattedData,
      error: result.error,
    };
  }, {
    operation: 'search-regions',
    component: 'student-registration-actions',
    metadata: { query }
  });
}

/**
 * Get all state/regions
 */
export async function getStateRegions() {
  return withServerActionErrorHandler(async () => {
    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.tenantId) {
      return {
        success: false,
        error: "Tenant context not found",
      };
    }

    // Get tenant-based API domain (e.g., http://api.um1ygn.edu.mm)
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });
    const userId = authResult.isAuthenticated && authResult.user ? authResult.user.id : undefined;

    console.log("🌐 [getStateRegions] Calling API:", apiUrl);

    const result = await httpClient.request<RegionData[]>(
      `/core/regions/ref?expect=state`,
      {
        method: 'GET',
        withAuth: true,
        userId: userId,
        tokenStrategy: 'auto' // Use cached token for reads
      }
    );

    return {
      success: result.success,
      data: result.data || [],
      error: result.error,
    };
  }, {
    operation: 'get-state-regions',
    component: 'student-registration-actions'
  });
}

/**
 * Get districts by state/region name
 * Schema: endpoint: "/regions/ref?expect=district&searchIn=state", searchParam: "search"
 */
export async function getDistrictsByState(stateName: string) {
  return withServerActionErrorHandler(async () => {
    console.log("🟡 [getDistrictsByState] Fetching districts for state:", stateName);

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.tenantId) {
      return {
        success: false,
        error: "Tenant context not found",
      };
    }

    // Get tenant-based API domain (e.g., http://api.um1ygn.edu.mm)
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });
    const userId = authResult.isAuthenticated && authResult.user ? authResult.user.id : undefined;

    const url = `/core/regions/ref?expect=district&searchIn=state&search=${encodeURIComponent(stateName)}`;
    console.log("🌐 [getDistrictsByState] Calling API:", apiUrl + url);

    const result = await httpClient.request<RegionData[]>(url, {
      method: 'GET',
      withAuth: true,
      userId: userId,
      tokenStrategy: 'auto' // Use cached token for reads
    });

    return {
      success: result.success,
      data: result.data || [],
      error: result.error,
    };
  }, {
    operation: 'get-districts-by-state',
    component: 'student-registration-actions',
    metadata: { stateName }
  });
}

/**
 * Get townships by district name
 * Schema: endpoint: "/regions/ref?expect=township&searchIn=district", searchParam: "search"
 */
export async function getTownshipsByDistrict(districtName: string) {
  return withServerActionErrorHandler(async () => {
    console.log("🟢 [getTownshipsByDistrict] Fetching townships for district:", districtName);

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.tenantId) {
      return {
        success: false,
        error: "Tenant context not found",
      };
    }

    // Get tenant-based API domain (e.g., http://api.um1ygn.edu.mm)
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });
    const userId = authResult.isAuthenticated && authResult.user ? authResult.user.id : undefined;

    const url = `/core/regions/ref?expect=township&searchIn=district&search=${encodeURIComponent(districtName)}`;
    console.log("🌐 [getTownshipsByDistrict] Calling API:", apiUrl + url);

    const result = await httpClient.request<RegionData[]>(url, {
      method: 'GET',
      withAuth: true,
      userId: userId,
      tokenStrategy: 'auto' // Use cached token for reads
    });

    return {
      success: result.success,
      data: result.data || [],
      error: result.error,
    };
  }, {
    operation: 'get-townships-by-district',
    component: 'student-registration-actions',
    metadata: { districtName }
  });
}

/**
 * Get towns by township name
 * Schema: endpoint: "/regions/ref?expect=town&searchIn=township", searchParam: "search"
 */
export async function getTownsByTownship(townshipName: string) {
  return withServerActionErrorHandler(async () => {
    console.log("🟣 [getTownsByTownship] Fetching towns for township:", townshipName);

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.tenantId) {
      return {
        success: false,
        error: "Tenant context not found",
      };
    }

    // Get tenant-based API domain (e.g., http://api.um1ygn.edu.mm)
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });
    const userId = authResult.isAuthenticated && authResult.user ? authResult.user.id : undefined;

    const url = `/core/regions/ref?expect=town&searchIn=township&search=${encodeURIComponent(townshipName)}`;
    console.log("🌐 [getTownsByTownship] Calling API:", apiUrl + url);

    const result = await httpClient.request<RegionData[]>(url, {
      method: 'GET',
      withAuth: true,
      userId: userId,
      tokenStrategy: 'auto' // Use cached token for reads
    });

    return {
      success: result.success,
      data: result.data || [],
      error: result.error,
    };
  }, {
    operation: 'get-towns-by-township',
    component: 'student-registration-actions',
    metadata: { townshipName }
  });
}

/**
 * Submit student self-registration
 * This is the main form submission endpoint that requires authentication
 */
export async function submitStudentSelfRegistration(data: any) {
  return withServerActionErrorHandler(async () => {
    console.log("🚀 [submitStudentSelfRegistration] Starting student self-registration");
    console.log("📝 [submitStudentSelfRegistration] Form data:", data);

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    console.log("🔑 [submitStudentSelfRegistration] Auth status:", {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.user?.id,
      tenantId: authResult.tenantId,
      userRole: authResult.user?.roles?.map((r: any) => r.Role).join(", ")
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      console.error("❌ [submitStudentSelfRegistration] User not authenticated");
      return {
        success: false,
        error: "Authentication required. Please log in to continue.",
      };
    }

    const tenantId = authResult.tenantId;
    const userId = authResult.user.id;

    if (!tenantId || !userId) {
      console.error("❌ [submitStudentSelfRegistration] Missing tenantId or userId");
      return {
        success: false,
        error: "Authentication information missing",
      };
    }

    // DEBUG: Log tenantId and userId details for token lookup debugging
    console.log("🔍 [DEBUG] tenantId type:", typeof tenantId, "value:", tenantId);
    console.log("🔍 [DEBUG] userId type:", typeof userId, "value:", userId);
    console.log("🔍 [DEBUG] tenantId constructor:", tenantId?.constructor?.name);
    console.log("🔍 [DEBUG] userId constructor:", userId?.constructor?.name);
    console.log("🔍 [DEBUG] Expected cache key format: ciApp:{tenantId}:Token:userAccessToken:{userId}");
    console.log("🔍 [DEBUG] Expected cache key:", `ciApp:${tenantId}:Token:userAccessToken:${userId}`);

    // Get tenant-based API domain (e.g., http://api.um1ygn.edu.mm)
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });
    const url = `/cpms/students/self-register`;

    console.log("🌐 [submitStudentSelfRegistration] Calling API:", apiUrl + url);

    // Make API call with cached token (will auto-refresh if needed)
    const result = await httpClient.request<any>(url, {
      method: 'POST',
      body: data,
      withAuth: true,
      userId: userId,
      tokenStrategy: 'auto' // Use cached token, auto-refresh if expired
    });

    console.log("📬 [submitStudentSelfRegistration] API Response:", {
      success: result.success,
      hasData: !!result.data,
      error: result.error
    });

    if (result.success && result.data) {
      console.log("✅ [submitStudentSelfRegistration] Registration successful");

      // Refresh user access token to get updated profileState and roles
      // After successful registration, user's profileState changes from "created" to "profile_completed"
      // And role changes from "guest" to "student"
      // We need to refresh the token so the new claims are immediately available
      try {
        const tokenManager = TokenManager.getInstance();
        const newToken = await tokenManager.refreshUserAccessToken(tenantId, userId);
        if (newToken) {
          console.log("✅ [submitStudentSelfRegistration] User token refreshed with new profileState and roles");
        } else {
          console.warn("⚠️ [submitStudentSelfRegistration] Failed to refresh user token, but registration succeeded");
        }
      } catch (tokenRefreshError) {
        console.error("⚠️ [submitStudentSelfRegistration] Error refreshing user token:", tokenRefreshError);
        // Non-critical - registration was successful, token will refresh on next request
      }

      // Don't revalidate here - let the client handle navigation
      // This prevents the page from re-rendering and redirecting before success component shows
      // revalidatePath("/");

      // Return success without redirecting (let client handle redirect)
      return {
        success: true,
        message: result.data.message || "Student registration submitted successfully",
        studentId: result.data.id || result.data._id,
      };
    }

    // Handle backend validation errors
    if (result.error) {
      try {
        // Try to parse structured error response
        const errorData = JSON.parse(result.error);
        console.log("🔍 [submitStudentSelfRegistration] Structured error:", errorData);

        if (errorData.errorCode === 'FORM_VALIDATION_FAIL') {
          return {
            success: false,
            error: errorData.message || "Validation failed",
            fieldErrors: errorData.errors || [],
            traceId: errorData.traceId
          };
        }

        // Other structured errors
        return {
          success: false,
          error: errorData.message || result.error,
          traceId: errorData.traceId
        };
      } catch (parseError) {
        // Not a structured error - return as-is
        return {
          success: false,
          error: result.error
        };
      }
    }

    return {
      success: false,
      error: "Unknown error occurred during registration"
    };
  }, {
    operation: 'submit-student-self-registration',
    component: 'student-registration-actions',
    metadata: { userId: data?.userId }
  });
}
