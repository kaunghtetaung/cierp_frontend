"use server";

import { ModuleService } from '@repo/appModules/module-service';
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
    appName: 'library'
  });
}

// Get accession numbers for a bibliography
export async function getAccessionNumbers(bibliographyId: string) {
  try {
    const moduleService = await createModuleService();
    
    const endpoint = `/library/bibliographies/${bibliographyId}/accessions`;
    
    const response = await moduleService['httpClient'].request(endpoint, {
      method: "GET",
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch accession numbers");
    }

    return {
      success: true,
      data: response.data?.data || response.data?.accessions || response.data || []
    };
  } catch (error) {
    console.error("Failed to get accession numbers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch accession numbers",
      data: []
    };
  }
}

// Add accession number
export async function addAccessionNumber(
  bibliographyId: string,
  data: {
    accessionNumber: string;
    location?: string;
    notes?: string;
  }
) {
  try {
    const moduleService = await createModuleService();
    
    const endpoint = `/library/bibliographies/${bibliographyId}/accessions/add`;
    
    const response = await moduleService['httpClient'].request(endpoint, {
      method: "POST",
      body: data,
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to add accession number");
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("Failed to add accession number:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add accession number"
    };
  }
}

// Update accession number
export async function updateAccessionNumber(
  bibliographyId: string,
  accessionNo: string,
  data: {
    accessionNumber?: string;
    location?: string;
    notes?: string;
  }
) {
  try {
    const moduleService = await createModuleService();
    
    const endpoint = `/library/bibliographies/${bibliographyId}/accessions/${accessionNo}`;
    
    const response = await moduleService['httpClient'].request(endpoint, {
      method: "PATCH",
      body: data,
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to update accession number");
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("Failed to update accession number:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update accession number"
    };
  }
}

// Delete accession number
export async function deleteAccessionNumber(
  bibliographyId: string,
  accessionNo: string
) {
  try {
    const moduleService = await createModuleService();
    
    const endpoint = `/library/bibliographies/${bibliographyId}/accessions/${accessionNo}`;
    
    const response = await moduleService['httpClient'].request(endpoint, {
      method: "DELETE",
      tenantId: moduleService['tenantId'],
      userSessionId: moduleService['userSessionId'],
      userId: moduleService['userId'],
      withAuth: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to delete accession number");
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("Failed to delete accession number:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete accession number"
    };
  }
}