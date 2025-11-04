"use server";

import { getCurrentUser } from "@repo/auth/server-api";
import { createHttpClient } from "@repo/api";
import { TokenManager } from "@repo/auth/token-manager";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { withServerActionErrorHandler } from "@repo/utils/server";

export interface StudentSelfRegistrationData {
  // Personal Information
  nameMyanmar: string;
  nameEnglish: string;
  dateOfBirth: string;
  gender: string;
  nrcNumber?: string;
  placeOfBirth?: string;
  bloodType?: string;
  race?: string;
  religion?: string;

  // Contact & Address
  phone: string;
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
) {
  return withServerActionErrorHandler(async () => {
    // 🔍 CRITICAL DEBUGGING: Log the received data from client
    console.log('📥 [SERVER ACTION] === RECEIVED DATA FROM CLIENT ===');
    console.log('📥 [SERVER ACTION] Complete data object:', JSON.stringify(data, null, 2));
    console.log('📥 [SERVER ACTION] placeOfBirth value:', data.placeOfBirth);
    console.log('📥 [SERVER ACTION] placeOfBirth type:', typeof data.placeOfBirth);
    console.log('📥 [SERVER ACTION] placeOfBirth is undefined?', data.placeOfBirth === undefined);
    console.log('📥 [SERVER ACTION] placeOfBirth is null?', data.placeOfBirth === null);
    console.log('📥 [SERVER ACTION] placeOfBirth is empty string?', data.placeOfBirth === '');

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

    // Helper function to clean empty strings to undefined (will be omitted in JSON)
    const cleanValue = (value: any) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      return value;
    };

    // Prepare request payload
    const payload = {
      // Personal Information
      nameMyanmar: data.nameMyanmar,
      nameEnglish: data.nameEnglish,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nrcNumber: cleanValue(data.nrcNumber),
      placeOfBirth: cleanValue(data.placeOfBirth),
      bloodType: cleanValue(data.bloodType),
      race: cleanValue(data.race),
      religion: cleanValue(data.religion),

      // Contact & Address
      phone: data.phone,
      email: cleanValue(data.email),
      stateRegionName: cleanValue(data.stateRegionName),
      districtName: cleanValue(data.districtName),
      townshipName: cleanValue(data.townshipName),
      townName: cleanValue(data.townName),
      wardVillageName: cleanValue(data.wardVillageName),
      permanentAddress: cleanValue(data.permanentAddress),
      currentAddress: cleanValue(data.currentAddress),

      // Family Information
      father: data.father,
      mother: data.mother,
      guardian: data.guardian,

      // Academic Information
      medmNumber: cleanValue(data.medmNumber),
      hobbies: cleanValue(data.hobbies),
      skills: cleanValue(data.skills),
      disabilities: cleanValue(data.disabilities),
      medicalConditions: cleanValue(data.medicalConditions),
      specialRequirements: cleanValue(data.specialRequirements),
      batches: data.batches,
      previousEducation: data.previousEducation,
    };

    console.log(
      `🎓 [Student Registration] Submitting for user: ${user.id}, tenant: ${tenantId}`
    );
    console.log('📦 [SERVER ACTION] === PAYLOAD TO BACKEND ===');
    console.log('📦 [SERVER ACTION] Complete payload:', JSON.stringify(payload, null, 2));
    console.log('📦 [SERVER ACTION] placeOfBirth in payload:', payload.placeOfBirth);
    console.log('📦 [SERVER ACTION] placeOfBirth type:', typeof payload.placeOfBirth);
    console.log('📦 [SERVER ACTION] placeOfBirth is undefined?', payload.placeOfBirth === undefined);
    console.log('📦 [SERVER ACTION] Personal info in payload:', {
      nameMyanmar: payload.nameMyanmar,
      nameEnglish: payload.nameEnglish,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      placeOfBirth: payload.placeOfBirth,
      nrcNumber: payload.nrcNumber,
      race: payload.race,
      religion: payload.religion,
      bloodType: payload.bloodType,
    });

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
  }, {
    operation: 'submit-student-self-registration',
    component: 'student-actions'
  });
}
