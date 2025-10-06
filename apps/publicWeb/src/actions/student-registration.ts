"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getModuleSchemas } from "@repo/appSchema/wrapper";
import { getSafeHeaders } from "@repo/utils/server/headers-compat";
import { ServerApiClient } from "@repo/api/server";
import type { ModuleSchema } from "@repo/types";

/**
 * Fetch students module schema for self-registration
 * This is a public action that doesn't require authentication
 */
export async function getStudentsModuleSchema(): Promise<{
  success: boolean;
  module?: ModuleSchema;
  error?: string;
}> {
  try {
    // Get tenant ID from middleware headers
    const headers = await getSafeHeaders();
    const tenantId = headers.get("x-tenant-id");

    if (!tenantId) {
      return {
        success: false,
        error: "No tenant ID found in request headers",
      };
    }

    // Fetch module schemas from CPMS service with correct tenant ID
    const schemas = await getModuleSchemas(tenantId, "cpms");

    if (!schemas || !schemas.modules) {
      return {
        success: false,
        error: "No modules found",
      };
    }

    // Find the students module
    const studentsModule = schemas.modules.find(
      (mod: ModuleSchema) => mod.slug === "students"
    );

    if (!studentsModule) {
      return {
        success: false,
        error: "Students module not found in CPMS",
      };
    }

    return {
      success: true,
      module: studentsModule,
    };
  } catch (error) {
    console.error("Error fetching students module schema:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch students module schema",
    };
  }
}

/**
 * Region data structure from API
 */
interface RegionData {
  id: string;
  pcode: string;
  name: string;
  level: "ward" | "town" | "township" | "district" | "stateRegion";
  parentName?: string;
  parentPCode?: string;
  count?: number;
  // Legacy fields (may not be present in new API)
  type?: "ward" | "town" | "township" | "district" | "stateRegion";
  postalCode?: string;
  stateRegion?: string;
  district?: string;
  township?: string;
  town?: string;
  ward?: string;
  districtPCode?: string;
  townshipPCode?: string;
}

/**
 * Formatted region for display
 */
export interface Region {
  id: string;
  name: string;
  fullName: string;
}

/**
 * Search regions for place of birth typeahead
 * Calls core service: /regions/search?search=Insein&limit=10&page=1
 */
export async function searchRegions(
  searchQuery: string,
  limit: number = 10,
  page: number = 1
): Promise<{
  success: boolean;
  data?: Region[];
  error?: string;
}> {
  try {
    console.log("🌍 searchRegions called with:", { searchQuery, limit, page });

    // Get current authenticated user (including guest users)
    const { getAuthenticationStatus } = await import("@repo/auth/server");
    const authResult = await getAuthenticationStatus();

    console.log("🔑 Auth Result:", {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.user?.id,
      tenantId: authResult.tenantId
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      console.error("❌ User not authenticated");
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const tenantId = authResult.tenantId;
    const userId = authResult.user.id;

    if (!tenantId || !userId) {
      console.error("❌ Missing tenantId or userId");
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get user access token from TokenManager (with automatic refresh)
    // This works for guest users as well since they are logged in
    const { TokenManager } = await import("@repo/auth/token-manager");
    const tokenManager = TokenManager.getInstance();
    const accessToken = await tokenManager.getUserAccessTokenWithRefresh(
      tenantId,
      userId
    );

    console.log("🎫 User access token:", accessToken ? "Found" : "Not found");

    if (!accessToken) {
      return {
        success: false,
        error: "Failed to get access token",
      };
    }

    const apiClient = new ServerApiClient();

    // Build query params manually
    const url = `/core/regions/search?search=${encodeURIComponent(searchQuery)}&limit=${limit}&page=${page}`;

    console.log("🌐 Calling API:", url);

    const result = await apiClient.request<RegionData[]>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("📦 API Response:", {
      success: result.success,
      dataLength: Array.isArray(result.data) ? result.data.length : 0,
      fullResponse: result.data
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      console.log("📋 Raw API data:", JSON.stringify(result.data, null, 2));

      // Transform API data to our format
      const regions: Region[] = result.data.map((region) => {
        // Build a readable name based on type
        let name = "";
        let fullName = "";

        if (region.type === "ward" && region.ward) {
          name = region.ward;
          fullName = `${region.ward}, ${region.township || region.town}, ${region.stateRegion}`;
        } else if (region.type === "town" && region.town) {
          name = region.town;
          fullName = `${region.town}, ${region.township}, ${region.stateRegion}`;
        } else if (region.type === "township" && region.township) {
          name = region.township;
          fullName = `${region.township}, ${region.stateRegion}`;
        } else if (region.type === "district" && region.district) {
          name = region.district;
          fullName = `${region.district}, ${region.stateRegion}`;
        } else if (region.type === "stateRegion") {
          name = region.stateRegion;
          fullName = region.stateRegion;
        }

        return {
          id: region.pcode + (region.postalCode || ""),
          name,
          fullName,
        };
      });

      console.log("✅ Transformed regions:", regions.length);
      console.log("📍 Sample transformed region:", regions[0]);

      return {
        success: true,
        data: regions,
      };
    }

    console.error("❌ API request failed or no data");
    return {
      success: false,
      error: "Failed to fetch regions",
    };
  } catch (error) {
    console.error("💥 Error searching regions:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search regions",
    };
  }
}

/**
 * Get all state/regions using /regions/ref endpoint
 * Schema: endpoint: "/regions/ref"
 */
export async function getStateRegions(): Promise<{
  success: boolean;
  data?: Array<{ pcode: string; name: string }>;
  error?: string;
}> {
  try {
    console.log("🔵 [getStateRegions] Fetching state/regions from /regions/ref");

    // Get current authenticated user
    const { getAuthenticationStatus } = await import("@repo/auth/server");
    const authResult = await getAuthenticationStatus();

    console.log("🔑 [getStateRegions] Auth status:", {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.user?.id,
      tenantId: authResult.tenantId
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      console.error("❌ [getStateRegions] User not authenticated");
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const tenantId = authResult.tenantId;
    const userId = authResult.user.id;

    if (!tenantId || !userId) {
      console.error("❌ [getStateRegions] Missing tenantId or userId");
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get user access token
    const { TokenManager } = await import("@repo/auth/token-manager");
    const tokenManager = TokenManager.getInstance();
    const accessToken = await tokenManager.getUserAccessTokenWithRefresh(
      tenantId,
      userId
    );

    console.log("🎫 [getStateRegions] Access token:", accessToken ? "Found" : "Not found");

    if (!accessToken) {
      return {
        success: false,
        error: "Failed to get access token",
      };
    }

    const apiClient = new ServerApiClient();

    // Call /regions/ref endpoint as per schema
    const url = `/core/regions/ref`;
    console.log("🌐 [getStateRegions] Calling API:", url);

    const result = await apiClient.request<RegionData[]>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("📦 [getStateRegions] API Response:", {
      success: result.success,
      dataLength: Array.isArray(result.data) ? result.data.length : 0,
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      // Map directly - API returns state/region data with level field
      const stateRegions = result.data.map((region) => ({
        pcode: region.pcode,
        name: region.name,
      }));

      console.log("✅ [getStateRegions] State regions mapped:", stateRegions.length, "items");
      console.log("🔍 [getStateRegions] First few state regions:", stateRegions.slice(0, 3));

      return {
        success: true,
        data: stateRegions,
      };
    }

    console.error("❌ [getStateRegions] API request failed or no data");
    return {
      success: false,
      error: "Failed to fetch state regions",
    };
  } catch (error) {
    console.error("💥 [getStateRegions] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch state regions",
    };
  }
}

/**
 * Get districts by state/region name
 * Schema: endpoint: "/regions/ref?expect=district&searchIn=state", searchParam: "search"
 */
export async function getDistrictsByState(stateName: string): Promise<{
  success: boolean;
  data?: Array<{ pcode: string; name: string }>;
  error?: string;
}> {
  try {
    console.log("🟡 [getDistrictsByState] Fetching districts for state:", stateName);

    // Get current authenticated user
    const { getAuthenticationStatus } = await import("@repo/auth/server");
    const authResult = await getAuthenticationStatus();

    if (!authResult.isAuthenticated || !authResult.user) {
      console.error("❌ [getDistrictsByState] User not authenticated");
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const tenantId = authResult.tenantId;
    const userId = authResult.user.id;

    if (!tenantId || !userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get user access token
    const { TokenManager } = await import("@repo/auth/token-manager");
    const tokenManager = TokenManager.getInstance();
    const accessToken = await tokenManager.getUserAccessTokenWithRefresh(
      tenantId,
      userId
    );

    if (!accessToken) {
      return {
        success: false,
        error: "Failed to get access token",
      };
    }

    const apiClient = new ServerApiClient();

    // Call /regions/ref with proper query params as per schema
    const url = `/core/regions/ref?expect=district&searchIn=state&search=${encodeURIComponent(stateName)}`;
    console.log("🌐 [getDistrictsByState] Calling API:", url);

    const result = await apiClient.request<RegionData[]>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("📦 [getDistrictsByState] API Response:", {
      success: result.success,
      dataLength: Array.isArray(result.data) ? result.data.length : 0,
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      // Log raw API data to see the structure
      console.log("🔍 [getDistrictsByState] Raw API data (ALL):", JSON.stringify(result.data, null, 2));
      console.log("🔍 [getDistrictsByState] Total items from API:", result.data.length);

      // Map directly - API already returns filtered districts based on query params
      const districts = result.data.map((region) => ({
        pcode: region.pcode,
        name: region.name,
      }));

      console.log("✅ [getDistrictsByState] Districts mapped:", districts.length, "items");
      console.log("🔍 [getDistrictsByState] Districts data:", JSON.stringify(districts, null, 2));

      return {
        success: true,
        data: districts,
      };
    }

    console.error("❌ [getDistrictsByState] API request failed or no data");
    return {
      success: false,
      error: "Failed to fetch districts",
    };
  } catch (error) {
    console.error("💥 [getDistrictsByState] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch districts",
    };
  }
}

/**
 * Get townships by district name
 * Schema: endpoint: "/regions/ref?expect=township&searchIn=district", searchParam: "search"
 */
export async function getTownshipsByDistrict(districtName: string): Promise<{
  success: boolean;
  data?: Array<{ pcode: string; name: string }>;
  error?: string;
}> {
  try {
    console.log("🟢 [getTownshipsByDistrict] Fetching townships for district:", districtName);

    // Get current authenticated user
    const { getAuthenticationStatus } = await import("@repo/auth/server");
    const authResult = await getAuthenticationStatus();

    if (!authResult.isAuthenticated || !authResult.user) {
      console.error("❌ [getTownshipsByDistrict] User not authenticated");
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const tenantId = authResult.tenantId;
    const userId = authResult.user.id;

    if (!tenantId || !userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get user access token
    const { TokenManager } = await import("@repo/auth/token-manager");
    const tokenManager = TokenManager.getInstance();
    const accessToken = await tokenManager.getUserAccessTokenWithRefresh(
      tenantId,
      userId
    );

    if (!accessToken) {
      return {
        success: false,
        error: "Failed to get access token",
      };
    }

    const apiClient = new ServerApiClient();

    // Call /regions/ref with proper query params as per schema
    const url = `/core/regions/ref?expect=township&searchIn=district&search=${encodeURIComponent(districtName)}`;
    console.log("🌐 [getTownshipsByDistrict] Calling API:", url);

    const result = await apiClient.request<RegionData[]>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("📦 [getTownshipsByDistrict] API Response:", {
      success: result.success,
      dataLength: Array.isArray(result.data) ? result.data.length : 0,
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      // Map directly - API already returns filtered townships based on query params
      const townships = result.data.map((region) => ({
        pcode: region.pcode,
        name: region.name,
      }));

      console.log("✅ [getTownshipsByDistrict] Townships mapped:", townships.length, "items");
      console.log("🔍 [getTownshipsByDistrict] First few townships:", townships.slice(0, 3));

      return {
        success: true,
        data: townships,
      };
    }

    console.error("❌ [getTownshipsByDistrict] API request failed or no data");
    return {
      success: false,
      error: "Failed to fetch townships",
    };
  } catch (error) {
    console.error("💥 [getTownshipsByDistrict] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch townships",
    };
  }
}

/**
 * Get towns by township name
 * Schema: endpoint: "/regions/ref?expect=town&searchIn=township", searchParam: "search"
 */
export async function getTownsByTownship(townshipName: string): Promise<{
  success: boolean;
  data?: Array<{ pcode: string; name: string }>;
  error?: string;
}> {
  try {
    console.log("🟣 [getTownsByTownship] Fetching towns for township:", townshipName);

    // Get current authenticated user
    const { getAuthenticationStatus } = await import("@repo/auth/server");
    const authResult = await getAuthenticationStatus();

    if (!authResult.isAuthenticated || !authResult.user) {
      console.error("❌ [getTownsByTownship] User not authenticated");
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const tenantId = authResult.tenantId;
    const userId = authResult.user.id;

    if (!tenantId || !userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get user access token
    const { TokenManager } = await import("@repo/auth/token-manager");
    const tokenManager = TokenManager.getInstance();
    const accessToken = await tokenManager.getUserAccessTokenWithRefresh(
      tenantId,
      userId
    );

    if (!accessToken) {
      return {
        success: false,
        error: "Failed to get access token",
      };
    }

    const apiClient = new ServerApiClient();

    // Call /regions/ref with proper query params as per schema
    const url = `/core/regions/ref?expect=town&searchIn=township&search=${encodeURIComponent(townshipName)}`;
    console.log("🌐 [getTownsByTownship] Calling API:", url);

    const result = await apiClient.request<RegionData[]>(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("📦 [getTownsByTownship] API Response:", {
      success: result.success,
      dataLength: Array.isArray(result.data) ? result.data.length : 0,
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      // Map directly - API already returns filtered towns based on query params
      const towns = result.data.map((region) => ({
        pcode: region.pcode,
        name: region.name,
      }));

      console.log("✅ [getTownsByTownship] Towns mapped:", towns.length, "items");
      console.log("🔍 [getTownsByTownship] First few towns:", towns.slice(0, 3));

      return {
        success: true,
        data: towns,
      };
    }

    console.error("❌ [getTownsByTownship] API request failed or no data");
    return {
      success: false,
      error: "Failed to fetch towns",
    };
  } catch (error) {
    console.error("💥 [getTownsByTownship] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch towns",
    };
  }
}

/**
 * Submit student self-registration data
 * POST /cpms/student/self-register
 * Requires: userAccessToken, x-tenant-id, x-user-id headers
 */
export async function submitStudentSelfRegistration(data: any): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  studentId?: string;
  fieldErrors?: string[];
  traceId?: string;
}> {
  try {
    console.log("🚀 [submitStudentSelfRegistration] Starting student self-registration");
    console.log("📝 [submitStudentSelfRegistration] Form data:", data);

    // Get current authenticated user (guest user)
    const { getAuthenticationStatus } = await import("@repo/auth/server");
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

    // Get user access token from TokenManager (with automatic refresh)
    const { TokenManager } = await import("@repo/auth/token-manager");
    const tokenManager = TokenManager.getInstance();
    const accessToken = await tokenManager.getUserAccessTokenWithRefresh(
      tenantId,
      userId
    );

    console.log("🎫 [submitStudentSelfRegistration] Access token:", accessToken ? "Found" : "Not found");

    if (!accessToken) {
      console.error("❌ [submitStudentSelfRegistration] Failed to get access token");
      return {
        success: false,
        error: "Failed to get authentication token. Please try logging in again.",
      };
    }

    // Create API client and call the self-registration endpoint
    const apiClient = new ServerApiClient();
    const url = `/cpms/students/self-register`;

    console.log("🌐 [submitStudentSelfRegistration] Calling API:", url);
    console.log("📦 [submitStudentSelfRegistration] With headers:", {
      Authorization: "Bearer [REDACTED]",
      "x-tenant-id": tenantId,
      "x-user-id": userId
    });

    const result = await apiClient.request<any>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "x-tenant-id": tenantId,
        "x-user-id": userId,
      },
      body: data,
    });

    console.log("📬 [submitStudentSelfRegistration] API Response:", {
      success: result.success,
      hasData: !!result.data,
      error: result.error
    });

    if (result.success && result.data) {
      console.log("✅ [submitStudentSelfRegistration] Registration successful");

      // Clear user tokens to force refresh with new profileState and roles
      // After successful registration, user's profileState changes from "created" to "profile_completed"
      // And role changes from "guest" to "student"
      // We need to invalidate cached tokens so UI updates accordingly
      try {
        const { TokenManager } = await import("@repo/auth/token-manager");
        const tokenManager = TokenManager.getInstance();
        await tokenManager.clearUserAccessToken(tenantId, userId);
        console.log("🔄 [submitStudentSelfRegistration] User tokens cleared - will refresh on next request with new profileState");
      } catch (tokenClearError) {
        console.error("⚠️ [submitStudentSelfRegistration] Failed to clear user tokens:", tokenClearError);
        // Non-critical - continue with success response
      }

      // Revalidate relevant paths
      revalidatePath("/");

      // Return success without redirecting (let client handle redirect)
      return {
        success: true,
        message: "Student registration submitted successfully",
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
            fieldErrors: errorData.extra?.fieldErrors || [],
            traceId: errorData.traceId,
          };
        }

        return {
          success: false,
          error: errorData.message || "Failed to submit registration",
          traceId: errorData.traceId,
        };
      } catch (parseError) {
        // Plain text error
        console.log("📝 [submitStudentSelfRegistration] Plain text error:", result.error);
        return {
          success: false,
          error: result.error,
        };
      }
    }

    console.error("❌ [submitStudentSelfRegistration] Unexpected response format");
    return {
      success: false,
      error: "Failed to submit student registration",
    };
  } catch (error) {
    console.error("💥 [submitStudentSelfRegistration] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit student registration",
    };
  }
}
