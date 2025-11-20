"use server";

import { ModuleService } from '@repo/app-modules';
import { getApiDomain } from "@repo/utils/server";
import { getCurrentUser, getCurrentSession } from "@repo/auth/server";

// Helper to create a ModuleService instance
async function createModuleService() {
  const apiUrl = await getApiDomain();

  let tenantId: string | undefined;
  let userSessionId: string | undefined;
  let userId: string | undefined;

  try {
    const session = await getCurrentSession();
    const user = await getCurrentUser();

    tenantId = session?.tenantId;
    userSessionId = session?.id;
    userId = user?.id;
  } catch (error) {
    console.warn("Failed to get auth details:", error);
  }

  return new ModuleService(apiUrl, {
    tenantId,
    userSessionId,
    userId,
    appName: 'cpms'
  });
}

// Get academic years
export async function getAcademicYears() {
  try {
    const moduleService = await createModuleService();

    const endpoint = `/cpms/academic-years/ref`;

    const response = await moduleService['httpClient'].request(endpoint, {
      method: "GET",
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch academic years");
    }

    return {
      success: true,
      data: response.data?.data || response.data || []
    };
  } catch (error) {
    console.error("Failed to get academic years:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years",
      data: []
    };
  }
}

// Get batches filtered by academic year
export async function getBatches(academicYearId?: string) {
  try {
    const moduleService = await createModuleService();

    const endpoint = academicYearId
      ? `/cpms/batches/ref?academicYearId=${academicYearId}`
      : `/cpms/batches/ref`;

    const response = await moduleService['httpClient'].request(endpoint, {
      method: "GET",
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch batches");
    }

    return {
      success: true,
      data: response.data?.data || response.data || []
    };
  } catch (error) {
    console.error("Failed to get batches:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch batches",
      data: []
    };
  }
}

// Get batch modules
export async function getBatchModules(batchId: string) {
  try {
    const moduleService = await createModuleService();

    const endpoint = `/cpms/batches/${batchId}/modules/ref`;

    const response = await moduleService['httpClient'].request(endpoint, {
      method: "GET",
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch batch modules");
    }

    return {
      success: true,
      data: response.data?.data || response.data || []
    };
  } catch (error) {
    console.error("Failed to get batch modules:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch batch modules",
      data: []
    };
  }
}

// Get batch subjects
export async function getBatchSubjects(batchId: string) {
  try {
    const moduleService = await createModuleService();

    const endpoint = `/cpms/batches/${batchId}/subjects/ref`;

    const response = await moduleService['httpClient'].request(endpoint, {
      method: "GET",
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch batch subjects");
    }

    return {
      success: true,
      data: response.data?.data || response.data || []
    };
  } catch (error) {
    console.error("Failed to get batch subjects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch batch subjects",
      data: []
    };
  }
}

// Approve student
export async function approveStudent(
  studentId: string,
  data: {
    admissionNumber?: string;
    batches: Array<{
      isActive: boolean;
      academicYearId: string;
      batchId: string;
      rollNo?: string;
      modules?: string[];
      subjects?: string[];
    }>;
    notes?: string;
    libraryBorrowerRequest?: boolean;
  }
) {
  console.log('🔧 [student-actions] approveStudent called', {
    studentId,
    requestData: data
  });

  try {
    const moduleService = await createModuleService();
    const apiUrl = moduleService['httpClient']['baseURL'] || await getApiDomain();

    const endpoint = `/cpms/students/${studentId}/approve`;
    const fullUrl = `${apiUrl}${endpoint}`;

    console.log('================================');
    console.log('📡 [student-actions] HTTP REQUEST DETAILS');
    console.log('================================');
    console.log('🌐 Full URL:', fullUrl);
    console.log('📍 Endpoint:', endpoint);
    console.log('🔧 Method:', 'POST');
    console.log('🏢 Tenant ID:', moduleService['tenantId']);
    console.log('👤 User Session ID:', moduleService['userSessionId']);
    console.log('🆔 User ID:', moduleService['userId']);
    console.log('📦 Request Body:', JSON.stringify(data, null, 2));
    console.log('================================');

    const response = await moduleService['httpClient'].request(endpoint, {
      method: "POST",
      body: data,
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    console.log('================================');
    console.log('📥 [student-actions] HTTP RESPONSE DETAILS');
    console.log('================================');
    console.log('✅ Success:', response.success);
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('❌ Error:', response.error || 'None');
    console.log('🔍 Full Response Object:', response);
    console.log('================================');

    if (!response.success) {
      console.error('❌ [student-actions] API returned error', {
        error: response.error,
        data: response.data
      });
      throw new Error(response.error || "Failed to approve student");
    }

    console.log('✅ [student-actions] Student approved successfully', {
      responseData: response.data
    });

    return {
      success: true,
      data: response.data,
      debugInfo: {
        url: fullUrl,
        method: 'POST',
        requestBody: data,
        response: response.data,
        timestamp: new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error("❌ [student-actions] Exception occurred:", error);
    console.error("❌ [student-actions] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });

    const apiUrl = await getApiDomain();
    const endpoint = `/cpms/students/${studentId}/approve`;
    const fullUrl = `${apiUrl}${endpoint}`;

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve student",
      debugInfo: {
        url: fullUrl,
        method: 'POST',
        requestBody: data,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }
    };
  }
}
