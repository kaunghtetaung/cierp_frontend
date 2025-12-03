"use server";

import { createHttpClient } from "@repo/api";
import { getApiDomain } from "@repo/utils/server";
import { getAuthenticationStatus } from "@repo/auth/server-api";
import { withServerActionErrorHandler } from "@repo/utils/server";

export interface StaffProfileData {
  _id: string;
  userId: string;
  organizationId: string;
  registrationStatus: string;
  nameMyanmar: string;
  nameEnglish: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  ethnicity?: string;
  religion?: string;
  bloodGroup?: string;
  nrcNumber: string;
  phoneNumber: string;
  email?: string;
  permanentAddress: string;
  currentAddress: string;
  stateRegionName: string;
  districtName: string;
  townshipName: string;
  townName: string;
  wardVillageName?: string;
  primaryAppointmentId?: string | {
    _id: string;
    name: string;
    code: string;
  };
  employmentStatus?: string;
  employmentType?: string;
  joiningDate?: string;
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
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
    address?: string;
  };
  hobbies?: string;
  skills?: string;
  disabilities?: string;
  medicalConditions?: string;
  specialRequirements?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export async function getMyStaffProfile() {
  return withServerActionErrorHandler(async () => {
    console.log("🔍 [getMyStaffProfile] Starting profile fetch");

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.isAuthenticated || !authResult.user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const userId = authResult.user.id;
    console.log("🔍 [getMyStaffProfile] userId:", userId);

    // Get API domain
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // Fetch staff profile - API uses user ID from token automatically
    const result = await httpClient.request<StaffProfileData>(
      "/cpms/staff/my-profile",
      {
        method: "GET",
        withAuth: true,
        userId: userId,
        tokenStrategy: "auto",
      }
    );

    console.log("📬 [getMyStaffProfile] API Response:", {
      success: result.success,
      hasData: !!result.data,
      error: result.error
    });

    if (result.success && result.data) {
      console.log("✅ [getMyStaffProfile] Profile fetched successfully");
      return {
        success: true,
        data: result.data,
      };
    }

    // Handle failure case
    console.error("❌ [getMyStaffProfile] Profile fetch failed:", result.error);
    return {
      success: false,
      error: result.error || "Failed to fetch profile",
    };
  }, {
    operation: 'get-my-staff-profile',
    component: 'profile-staff-actions'
  });
}
