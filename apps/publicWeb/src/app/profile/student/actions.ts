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
  race: string;
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
 * @param includeThumbnails - Whether to include thumbnail URLs (default: false)
 */
export async function getProfilePhotoUrl(params: {
  s3Key: string;
  tenantId: string;
  tenantSlug: string;
  tenantRootDomain: string;
  includeThumbnails?: boolean;
}) {
  return withServerActionErrorHandler(async () => {
    const { s3Key, tenantId, tenantSlug, tenantRootDomain, includeThumbnails = false } = params;

    logger.info('Getting profile photo URL', {
      component: 'profile-student-actions',
      operation: 'getProfilePhotoUrl',
      s3Key,
      tenantSlug,
      includeThumbnails,
    });

    // Extract the actual S3 key (remove organization slug prefix)
    // s3Key format: um1/cpms/private/common/students/photos/{filename}
    // We need: cpms/private/common/students/photos/{filename}
    const keyParts = s3Key.split('/');
    const actualKey = keyParts.slice(1).join('/'); // Remove first part (organization slug)

    // Create S3 client
    const s3Client = await createTenantS3Client({
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

    // Generate thumbnail URLs if requested
    let thumbnails: { small?: string; medium?: string; large?: string } | undefined;

    if (includeThumbnails) {
      try {
        const { getThumbnailKey, THUMBNAIL_SIZES } = await import('@repo/s3/services/thumbnail-generator');

        const thumbnailUrls: { small?: string; medium?: string; large?: string } = {};

        for (const sizeName of Object.keys(THUMBNAIL_SIZES)) {
          const thumbnailKey = getThumbnailKey(actualKey, sizeName as keyof typeof THUMBNAIL_SIZES);

          const thumbnailUrl = await s3Client.getPreSignedUrl(
            thumbnailKey,
            {
              expiresIn: 604800, // 7 days
            },
            true // skipPathResolution
          );

          thumbnailUrls[sizeName as 'small' | 'medium' | 'large'] = thumbnailUrl;
        }

        thumbnails = thumbnailUrls;

        logger.info('Generated thumbnail URLs for profile photo', {
          component: 'profile-student-actions',
          operation: 'getProfilePhotoUrl',
          thumbnailCount: Object.keys(thumbnailUrls).length,
        });
      } catch (error) {
        logger.error('Failed to generate thumbnail URLs for profile photo', {
          component: 'profile-student-actions',
          operation: 'getProfilePhotoUrl',
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue without thumbnails
      }
    }

    return {
      success: true,
      signedUrl,
      thumbnails,
    };
  }, {
    operation: 'get-profile-photo-url',
    component: 'profile-student-actions'
  });
}

/**
 * Update student profile (for pending/incomplete status only)
 * Uses PATCH method as per backend implementation
 * @param data - Form data to update
 * @param studentId - Student record _id (required by backend)
 */
export async function updateMyProfile(data: any, studentId: string) {
  return withServerActionErrorHandler(async () => {
    // 🔍 CRITICAL DEBUGGING: Log the received data from client (EDIT MODE)
    console.log('📥 [EDIT SERVER ACTION] === RECEIVED DATA FROM CLIENT ===');
    console.log('📥 [EDIT SERVER ACTION] Student ID:', studentId);
    console.log('📥 [EDIT SERVER ACTION] Complete data object:', JSON.stringify(data, null, 2));
    console.log('📥 [EDIT SERVER ACTION] placeOfBirth value:', data.placeOfBirth);
    console.log('📥 [EDIT SERVER ACTION] placeOfBirth type:', typeof data.placeOfBirth);
    console.log('📥 [EDIT SERVER ACTION] placeOfBirth is undefined?', data.placeOfBirth === undefined);
    console.log('📥 [EDIT SERVER ACTION] placeOfBirth is null?', data.placeOfBirth === null);
    console.log('📥 [EDIT SERVER ACTION] placeOfBirth is empty string?', data.placeOfBirth === '');

    logger.info('Updating student profile', {
      component: 'profile-student-actions',
      operation: 'updateMyProfile',
      studentId,
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
      studentId,
    });

    // Get API domain
    const apiUrl = await getApiDomain();
    const httpClient = createHttpClient({ baseURL: apiUrl });

    // IMPORTANT: Use PATCH method with student ID as URL parameter
    // Backend requires student record _id in URL: /students/:id/my-profile
    // Format: /cpms/students/{studentId}/my-profile (NOT /my-profile/{studentId})
    logger.info('Making PATCH request with student ID in URL', {
      component: 'profile-student-actions',
      operation: 'updateMyProfile',
      endpoint: `/cpms/students/${studentId}/my-profile`,
    });

    // 🔍 CRITICAL DEBUGGING: Log the data being sent to backend API
    console.log('📤 [EDIT SERVER ACTION] === DATA SENT TO BACKEND API ===');
    console.log('📤 [EDIT SERVER ACTION] Endpoint:', `/cpms/students/${studentId}/my-profile`);
    console.log('📤 [EDIT SERVER ACTION] Method: PATCH');
    console.log('📤 [EDIT SERVER ACTION] Body data:', JSON.stringify(data, null, 2));
    console.log('📤 [EDIT SERVER ACTION] placeOfBirth in body:', data.placeOfBirth);
    console.log('📤 [EDIT SERVER ACTION] Personal fields in body:', {
      nameMyanmar: data.nameMyanmar,
      nameEnglish: data.nameEnglish,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      placeOfBirth: data.placeOfBirth,
      nrcNumber: data.nrcNumber,
      race: data.race,
      religion: data.religion,
      bloodType: data.bloodType,
    });

    const result = await httpClient.request<StudentProfileData>(
      `/cpms/students/${studentId}/my-profile`,
      {
        method: "PATCH",  // Backend uses PATCH
        body: data, // No id field in body - ID is in URL
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
