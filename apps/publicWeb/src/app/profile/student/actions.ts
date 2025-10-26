"use server";

import { createHttpClient } from "@repo/api";
import { getApiDomain } from "@repo/utils/server";
import { getAuthenticationStatus } from "@repo/auth/server-api";
import { withServerActionErrorHandler } from "@repo/utils/server";

export interface PreviousEducationSubject {
  subjectId: string | { _id: string; name: string; code: string };
  mark: number;
  isDistinction: boolean;
  _id: string;
  name?: string | { _id: string; name: string; code: string }; // Subject name (populated from backend)
}

export interface PreviousEducation {
  className: string;
  rollNumber: string;
  examBoard: string;
  totalMarks: number;
  year: number;
  subjects: PreviousEducationSubject[];
  _id: string;
}

export interface Batch {
  batchId: string | {
    _id: string;
    name: string;
    code: string;
    academicYearId: string;
  };
  academicYearId: string | {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  rollNo: string;
  subjects: any[];
  _id: string;
}

export interface StudentProfileData {
  _id: string;
  userId: string;
  organizationId: string;
  registrationStatus: string;
  nameMyanmar: string;
  nameEnglish: string;
  gender: string;
  dateOfBirth: string;
  placeOfBirth: string;
  ethnicity: string;
  religion: string;
  bloodGroup?: string;
  nrcNumber: string;
  phoneNumber: string;
  email: string;
  permanentAddress: string;
  currentAddress: string;
  stateRegionName: string;
  districtName: string;
  townshipName: string;
  townName: string;
  wardVillageName: string;
  father?: {
    nameMyanmar: string;
    nameEnglish: string;
    nrcNumber: string;
    occupation: string;
  };
  mother?: {
    nameMyanmar: string;
    nameEnglish: string;
    nrcNumber: string;
    occupation: string;
  };
  guardian?: {
    nameMyanmar: string;
    nameEnglish: string;
    nrcNumber: string;
    occupation: string;
    relationship: string;
    phoneNumber: string;
    email: string;
    address: string;
  };
  previousEducation?: PreviousEducation[];
  batches?: Batch[];
  hobbies?: string;
  skills?: string;
  disabilities?: string;
  medicalConditions?: string;
  specialRequirements?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export async function getMyProfile() {
  return withServerActionErrorHandler(async () => {
    console.log("🔍 [getMyProfile] Starting profile fetch");

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.isAuthenticated || !authResult.user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const userId = authResult.user.id;
    console.log("🔍 [getMyProfile] userId:", userId);

    // Get API domain
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // Fetch student profile - API uses user ID from token automatically
    const result = await httpClient.request<StudentProfileData>(
      "/cpms/students/my-profile",
      {
        method: "GET",
        withAuth: true,
        userId: userId,
        tokenStrategy: "auto",
      }
    );

    console.log("✅ [getMyProfile] Profile fetched successfully");

    return {
      success: true,
      data: result.data,
    };
  }, {
    operation: 'get-my-profile',
    component: 'profile-student-actions'
  });
}
