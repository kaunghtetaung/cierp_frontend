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

/**
 * Approve a borrower
 *
 * @param borrowerId - The ID of the borrower to approve
 * @param data - Approval form data
 */
export async function approveBorrower(
  borrowerId: string,
  data: {
    libraryCardNumber: string;
    borrowerType: 'student' | 'staff' | 'guest';
    status: 'active';
    borrowerGroup: 'post_graduate' | 'under_graduate' | 'teaching_staff' | 'other_staff' | 'external';
    membershipEndDate?: string;
    notes?: string;
  }
) {
  console.log('🔧 [borrower-actions] approveBorrower called', {
    borrowerId,
    requestData: data
  });

  try {
    const moduleService = await createModuleService();
    const apiUrl = moduleService['httpClient']['baseURL'] || await getApiDomain();

    const endpoint = `/library/borrowers/${borrowerId}/approve`;
    const fullUrl = `${apiUrl}${endpoint}`;

    console.log('================================');
    console.log('📡 [borrower-actions] HTTP REQUEST DETAILS');
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
    console.log('📥 [borrower-actions] HTTP RESPONSE DETAILS');
    console.log('================================');
    console.log('✅ Success:', response.success);
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('❌ Error:', response.error || 'None');
    console.log('🔍 Full Response Object:', response);
    console.log('================================');

    if (!response.success) {
      console.error('❌ [borrower-actions] API returned error', {
        error: response.error,
        data: response.data
      });
      throw new Error(response.error || "Failed to approve borrower");
    }

    console.log('✅ [borrower-actions] Borrower approved successfully', {
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
    console.error("❌ [borrower-actions] Exception occurred:", error);
    console.error("❌ [borrower-actions] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });

    const apiUrl = await getApiDomain();
    const endpoint = `/library/borrowers/${borrowerId}/approve`;
    const fullUrl = `${apiUrl}${endpoint}`;

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve borrower",
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
