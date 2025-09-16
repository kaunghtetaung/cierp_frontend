// Client-side API service for schema operations
"use client";

import { createHttpClient } from "@repo/api";
import { getApiDomainClient } from "@repo/utils/client/auth";
import type { ApiResponse } from "@repo/types";

/**
 * SchemaApiService - Client-side service for fetching form schemas
 * Uses tenant-based URLs via httpClient
 */
export class SchemaApiService {
  private httpClient;
  
  constructor() {
    const apiDomain = getApiDomainClient();
    this.httpClient = createHttpClient({
      baseURL: apiDomain,
      withCredentials: true,
    });
  }
  
  /**
   * Fetch form schema for a specific module and form
   */
  async fetchFormSchema(moduleSlug: string, formName: string): Promise<any> {
    const endpoint = `/api/v1/${moduleSlug}/form-schema/${formName}`;
    
    console.log(`📥 SchemaApiService: Fetching schema for ${formName} from ${moduleSlug}`);
    
    const response = await this.httpClient.get<any>(endpoint);
    
    if (!response.success) {
      throw new Error(response.error || `Failed to fetch schema for ${formName}`);
    }
    
    return response.data;
  }
  
  /**
   * Fetch table data for a specific section
   */
  async fetchTableData(endpoint: string, itemId: string): Promise<any[]> {
    const finalEndpoint = endpoint.replace(':id', itemId);
    
    const response = await this.httpClient.get<any[]>(finalEndpoint);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch table data');
    }
    
    return response.data || [];
  }
  
  /**
   * Submit form data
   */
  async submitForm(endpoint: string, data: FormData): Promise<ApiResponse<any>> {
    // Convert FormData to object
    const formObject: Record<string, any> = {};
    data.forEach((value, key) => {
      // Handle multiple values for the same key
      if (formObject[key] !== undefined) {
        if (!Array.isArray(formObject[key])) {
          formObject[key] = [formObject[key]];
        }
        formObject[key].push(value);
      } else {
        formObject[key] = value;
      }
    });
    
    return this.httpClient.post(endpoint, formObject);
  }
  
  /**
   * Delete an item from table
   */
  async deleteItem(endpoint: string, itemId: string): Promise<ApiResponse<void>> {
    const finalEndpoint = endpoint.replace(':id', itemId);
    return this.httpClient.delete(finalEndpoint);
  }
}

// Export singleton instance for client-side use
let schemaApiInstance: SchemaApiService | null = null;

export function getSchemaApiService(): SchemaApiService {
  if (!schemaApiInstance) {
    schemaApiInstance = new SchemaApiService();
  }
  return schemaApiInstance;
}