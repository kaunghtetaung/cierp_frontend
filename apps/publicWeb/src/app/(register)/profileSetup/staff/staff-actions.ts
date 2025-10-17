"use server";

import { getCurrentUser } from "@repo/auth/server-api";
import { createHttpClient } from "@repo/api";
import { TokenManager } from "@repo/auth/token-manager";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

export interface StaffSelfRegistrationData {
  // Personal Information
  nameMyanmar: string;
  nameEnglish: string;
  dateOfBirth: string;
  gender: string;
  nrcNumber: string;
  placeOfBirth?: string;
  bloodGroup?: string;
  ethnicity?: string;
  religion?: string;

  // Contact & Address
  phoneNumber: string;
  email?: string;
  stateRegionName: string;
  districtName: string;
  townshipName: string;
  townName: string;
  wardVillageName?: string;
  permanentAddress: string;
  currentAddress: string;

  // Employment Information
  primaryAppointmentId: string;
  employmentStatus: string;
  employmentType: string;
  joiningDate: string;

  // Family Information
  father?: {
    nameMyanmar?: string;
    nameEnglish?: string;
    nrcNumber?: string;
    occupation?: string;
  };
  mother?: {
    nameMyanmar?: string;
    nameEnglish?: string;
    nrcNumber?: string;
    occupation?: string;
  };

  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
    address?: string;
  };

  // Additional Information
  hobbies?: string;
  skills?: string;
  disabilities?: string;
  medicalConditions?: string;
  specialRequirements?: string;
}

export interface StaffSelfRegistrationResult {
  success: boolean;
  error?: string;
  staffId?: string;
}

export async function submitStaffSelfRegistration(
  data: StaffSelfRegistrationData
): Promise<StaffSelfRegistrationResult> {
  try {
    console.log("👔 [Staff Registration] Starting registration process");

    // Get current user and validate guest role
    const user = await getCurrentUser();

    if (!user) {
      console.error("❌ [Staff Registration] No user found");
      return { success: false, error: "Unauthorized - please login" };
    }

    console.log("👤 [Staff Registration] User:", {
      id: user.id,
      email: user.email,
      roles: user.roles,
    });

    const isGuestUser =
      user.roles?.some((roleObj: any) => roleObj.Role === "guest") ?? false;

    if (!isGuestUser) {
      console.error("❌ [Staff Registration] User is not a guest");
      return {
        success: false,
        error: "Only guest users can register as staff",
      };
    }

    // Get tenant context for API call
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      console.error("❌ [Staff Registration] No tenant ID found");
      return { success: false, error: "Tenant context not found" };
    }

    console.log("🏢 [Staff Registration] Tenant ID:", tenantId);

    // Prepare request payload
    const payload = {
      // Personal Information
      nameMyanmar: data.nameMyanmar,
      nameEnglish: data.nameEnglish,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nrcNumber: data.nrcNumber,
      placeOfBirth: data.placeOfBirth,
      bloodGroup: data.bloodGroup,
      ethnicity: data.ethnicity,
      religion: data.religion,

      // Contact & Address
      phoneNumber: data.phoneNumber,
      email: data.email,
      stateRegionName: data.stateRegionName,
      districtName: data.districtName,
      townshipName: data.townshipName,
      townName: data.townName,
      wardVillageName: data.wardVillageName,
      permanentAddress: data.permanentAddress,
      currentAddress: data.currentAddress,

      // Employment Information
      primaryAppointmentId: data.primaryAppointmentId,
      employmentStatus: data.employmentStatus,
      employmentType: data.employmentType,
      joiningDate: data.joiningDate,

      // Family Information
      father: data.father,
      mother: data.mother,

      // Emergency Contact
      emergencyContact: data.emergencyContact,

      // Additional Information
      hobbies: data.hobbies,
      skills: data.skills,
      disabilities: data.disabilities,
      medicalConditions: data.medicalConditions,
      specialRequirements: data.specialRequirements,
    };

    console.log(
      `👔 [Staff Registration] Submitting for user: ${user.id}, tenant: ${tenantId}`
    );

    // Create HTTP client
    const httpClient = createHttpClient();

    // Make API call using HttpClient with auto token management
    console.log("🚀 [Staff Registration] Calling API endpoint: /cpms/staff/self-register");

    const result = await httpClient.request<any>(
      `/cpms/staff/self-register`,
      {
        method: 'POST',
        body: payload,
        withAuth: true,
        userId: user.id,
        tokenStrategy: 'auto' // Use cached token, auto-refresh if expired
      }
    );

    if (!result.success) {
      console.error("❌ [Staff Registration] API call failed:", result.error);
      return {
        success: false,
        error: result.error || "Registration failed"
      };
    }

    const staffId = result.data?.staffId || result.data?._id;
    console.log(
      `✅ [Staff Registration] Successfully registered staff: ${staffId}`
    );

    // Refresh user access token to get updated profileState and roles
    // After successful registration, user's profileState changes and roles update
    try {
      console.log("🔄 [Staff Registration] Refreshing user token...");
      const tokenManager = TokenManager.getInstance();
      const newToken = await tokenManager.refreshUserAccessToken(tenantId, user.id);
      if (newToken) {
        console.log("✅ [Staff Registration] User token refreshed with new profileState and roles");
      }
    } catch (tokenRefreshError) {
      console.error("⚠️ [Staff Registration] Error refreshing user token:", tokenRefreshError);
      // Non-critical - registration was successful
    }

    return {
      success: true,
      staffId,
    };
  } catch (error) {
    console.error("❌ [Staff Registration] Unexpected error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during registration",
    };
  }
}
