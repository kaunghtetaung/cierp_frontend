"use server";

import { createHttpClient } from "@repo/api";
import { getApiDomain } from "@repo/utils/server";
import { getAuthenticationStatus } from "@repo/auth/server-api";
import { withServerActionErrorHandler } from "@repo/utils/server";
import { createTenantS3Client } from '@repo/s3';
import { logger } from '@repo/utils/common/logger';

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
  profilePhoto?: string; // S3 key path to student profile photo
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

    console.log("📬 [getMyProfile] API Response:", {
      success: result.success,
      hasData: !!result.data,
      error: result.error
    });

    if (result.success && result.data) {
      console.log("✅ [getMyProfile] Profile fetched successfully");
      return {
        success: true,
        data: result.data,
      };
    }

    // Handle failure case
    console.error("❌ [getMyProfile] Profile fetch failed:", result.error);
    return {
      success: false,
      error: result.error || "Failed to fetch profile",
    };
  }, {
    operation: 'get-my-profile',
    component: 'profile-student-actions'
  });
}

/**
 * Get signed URL for student profile photo
 * @param s3Key - The S3 key path (format: {organizationSlug}/cpms/private/common/students/photos/{filename})
 * @param tenantId - The tenant ID
 * @param tenantSlug - The organization slug (bucket name)
 * @param tenantRootDomain - The root domain
 */
export async function getProfilePhotoUrl(params: {
  s3Key: string;
  tenantId: string;
  tenantSlug: string;
  tenantRootDomain: string;
}) {
  return withServerActionErrorHandler(async () => {
    const { s3Key, tenantId, tenantSlug, tenantRootDomain } = params;

    logger.info('Getting profile photo URL', {
      component: 'profile-student-actions',
      operation: 'getProfilePhotoUrl',
      s3Key,
      tenantSlug,
    });

    // Extract the actual S3 key (remove organization slug prefix)
    // s3Key format: um1/cpms/private/common/students/photos/{filename}
    // We need: cpms/private/common/students/photos/{filename}
    const keyParts = s3Key.split('/');
    const actualKey = keyParts.slice(1).join('/'); // Remove first part (organization slug)

    // Create S3 client
    const s3Client = createTenantS3Client({
      tenantId,
      tenantSlug, // Bucket name
      tenantRootDomain,
      app: 'cpms',
      basePath: '',
    });

    // Generate signed URL (7 days expiry for profile viewing)
    const signedUrl = await s3Client.getPreSignedUrl(
      actualKey,
      {
        expiresIn: 604800, // 7 days
      },
      true // skipPathResolution
    );

    logger.info('Generated signed URL for profile photo', {
      component: 'profile-student-actions',
      operation: 'getProfilePhotoUrl',
      signedUrlGenerated: !!signedUrl,
    });

    return {
      success: true,
      signedUrl,
    };
  }, {
    operation: 'get-profile-photo-url',
    component: 'profile-student-actions'
  });
}

/**
 * Update student profile (for pending/incomplete status only)
 * Uses PATCH method as per backend implementation
 */
export async function updateMyProfile(data: any) {
  return withServerActionErrorHandler(async () => {
    logger.info('Updating student profile', {
      component: 'profile-student-actions',
      operation: 'updateMyProfile',
    });

    // Get authentication status
    const authResult = await getAuthenticationStatus();

    if (!authResult.isAuthenticated || !authResult.user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const userId = authResult.user.id;
    const tenantId = authResult.tenantId;

    logger.info('Update profile request', {
      component: 'profile-student-actions',
      operation: 'updateMyProfile',
      userId,
      tenantId,
    });

    // Get API domain
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // IMPORTANT: Use PATCH method (not PUT) as per backend implementation
    const result = await httpClient.request<StudentProfileData>(
      "/cpms/students/my-profile",
      {
        method: "PATCH",  // Backend uses PATCH
        body: data,
        withAuth: true,
        userId: userId,
        tokenStrategy: "auto",
      }
    );

    if (result.success) {
      logger.info('Profile updated successfully', {
        component: 'profile-student-actions',
        operation: 'updateMyProfile',
        userId,
      });

      return {
        success: true,
        data: result.data,
        message: "Profile updated successfully",
      };
    }

    // Handle error responses
    logger.error('Profile update failed', {
      component: 'profile-student-actions',
      operation: 'updateMyProfile',
      error: result.error,
    });

    return {
      success: false,
      error: result.error || "Failed to update profile",
    };
  }, {
    operation: 'update-my-profile',
    component: 'profile-student-actions'
  });
}
