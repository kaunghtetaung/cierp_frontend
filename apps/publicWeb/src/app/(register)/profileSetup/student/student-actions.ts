"use server";

import { getCurrentUser } from "@repo/auth/server-api";
import { getApiDomain } from "@repo/utils/server";
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

    // Get API domain
    const apiDomain = await getApiDomain();

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

    // Make API call to POST /students/self-register
    const response = await fetch(`${apiDomain}/students/self-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          `Registration failed with status ${response.status}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      studentId: result.studentId || result._id,
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
