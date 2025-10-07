"use server";

import { getCurrentUser } from "@repo/auth/server-api";
import { createHttpClient } from "@repo/api";
import { TokenManager } from "@repo/auth/token-manager";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";

export interface StudentSelfRegistrationData {
  // Personal Information
  nameMyanmar: string;
  nameEnglish: string;
  dateOfBirth: string;
  gender: string;
  nrcNumber?: string;
  placeOfBirth?: string;
  bloodGroup?: string;
  ethnicity?: string;
  religion?: string;

  // Contact & Address
  phoneNumber: string;
  email?: string;
  stateRegionName?: string;
  districtName?: string;
  townshipName?: string;
  townName?: string;
  wardVillageName?: string;
  permanentAddress?: string;
  currentAddress?: string;

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
  guardian?: {
    nameMyanmar?: string;
    nameEnglish?: string;
    nrcNumber?: string;
    occupation?: string;
    relationship?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
  };

  // Academic Information
  medmNumber?: string;
  hobbies?: string;
  skills?: string;
  disabilities?: string;
  medicalConditions?: string;
  specialRequirements?: string;
  batches?: Array<{
    batchId: string;
    academicYearId: string;
    rollNo: string;
    subjects?: string[];
  }>;
  previousEducation?: Array<{
    className: string;
    rollNumber: string;
    examBoard: string;
    totalMarks: string;
    year: string;
    subjects?: Array<{
      name: string;
      marks: string;
    }>;
  }>;
}

export interface StudentSelfRegistrationResult {
  success: boolean;
  error?: string;
  studentId?: string;
}

export async function submitStudentSelfRegistration(
  data: StudentSelfRegistrationData
): Promise<StudentSelfRegistrationResult> {
  try {
    // Get current user and validate guest role
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized - please login" };
    }

    const isGuestUser =
      user.roles?.some((roleObj: any) => roleObj.Role === "guest") ?? false;

    if (!isGuestUser) {
      return {
        success: false,
        error: "Only guest users can register as students",
      };
    }

    // Get tenant context for API call
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;

    if (!tenantId) {
      return { success: false, error: "Tenant context not found" };
    }

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

      // Family Information
      father: data.father,
      mother: data.mother,
      guardian: data.guardian,

      // Academic Information
      medmNumber: data.medmNumber,
      hobbies: data.hobbies,
      skills: data.skills,
      disabilities: data.disabilities,
      medicalConditions: data.medicalConditions,
      specialRequirements: data.specialRequirements,
      batches: data.batches,
      previousEducation: data.previousEducation,
    };

    console.log(
      `🎓 [Student Registration] Submitting for user: ${user.id}, tenant: ${tenantId}`
    );

    // Create HTTP client
    const httpClient = createHttpClient();

    // Make API call using HttpClient with auto token management
    const result = await httpClient.request<any>(
      `/cpms/students/self-register`,
      {
        method: 'POST',
        body: payload,
        withAuth: true,
        userId: user.id,
        tokenStrategy: 'auto' // Use cached token, auto-refresh if expired
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Registration failed"
      };
    }

    console.log(
      `✅ [Student Registration] Successfully registered student: ${result.data?.studentId || result.data?._id}`
    );

    // Refresh user access token to get updated profileState and roles
    // After successful registration, user's profileState changes and roles update
    try {
      const tokenManager = TokenManager.getInstance();
      const newToken = await tokenManager.refreshUserAccessToken(tenantId, user.id);
      if (newToken) {
        console.log("✅ [Student Registration] User token refreshed with new profileState and roles");
      }
    } catch (tokenRefreshError) {
      console.error("⚠️ [Student Registration] Error refreshing user token:", tokenRefreshError);
      // Non-critical - registration was successful
    }

    return {
      success: true,
      studentId: result.data?.studentId || result.data?._id,
    };
  } catch (error) {
    console.error("Student self-registration error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during registration",
    };
  }
}
