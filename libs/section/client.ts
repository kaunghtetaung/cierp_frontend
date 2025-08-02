// Client-side section utilities for browser environments
import type {
  SectionData,
  SectionType,
  SectionCreateData,
  SectionUpdateData,
  SectionListResult,
  SectionListOptions,
  SectionCopyOptions,
  MultiLanguageText
} from '../types/section';

/**
 * Client-side section API service
 */
export class SectionClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string = '/api', headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  /**
   * Set authentication header
   */
  setAuthToken(token: string): void {
    this.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * Set tenant ID header
   */
  setTenantId(tenantId: string): void {
    this.headers['x-tenant-id'] = tenantId;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Section API request failed:', error);
      throw error;
    }
  }

  /**
   * Create a new section
   */
  async createSection(sectionData: SectionCreateData): Promise<SectionData> {
    return this.request<SectionData>('/sections', {
      method: 'POST',
      body: JSON.stringify(sectionData)
    });
  }

  /**
   * Update an existing section
   */
  async updateSection(id: string, sectionData: SectionUpdateData): Promise<SectionData> {
    return this.request<SectionData>(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sectionData)
    });
  }

  /**
   * Delete a section
   */
  async deleteSection(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/sections/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get section by ID
   */
  async getSectionById(id: string): Promise<SectionData | null> {
    try {
      return await this.request<SectionData>(`/sections/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get sections by type
   */
  async getSectionsByType(type: SectionType): Promise<SectionData[]> {
    return this.request<SectionData[]>(`/sections?type=${type}`);
  }

  /**
   * Get sections for current tenant
   */
  async getSections(): Promise<SectionData[]> {
    return this.request<SectionData[]>('/sections');
  }

  /**
   * Get sections with pagination and filtering
   */
  async getSectionList(options: SectionListOptions = {}): Promise<SectionListResult> {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/sections/list?${queryString}` : '/sections/list';
    
    return this.request<SectionListResult>(endpoint);
  }

  /**
   * Duplicate a section
   */
  async duplicateSection(id: string, newName?: string): Promise<SectionData> {
    return this.request<SectionData>(`/sections/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ newName })
    });
  }

  /**
   * Copy section to another tenant
   */
  async copySection(id: string, targetTenantId: string, options: SectionCopyOptions = {}): Promise<SectionData> {
    return this.request<SectionData>(`/sections/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify({ targetTenantId, ...options })
    });
  }

  /**
   * Reorder sections
   */
  async reorderSections(sectionIds: string[], newOrders: number[]): Promise<SectionData[]> {
    return this.request<SectionData[]>('/sections/reorder', {
      method: 'POST',
      body: JSON.stringify({ sectionIds, newOrders })
    });
  }

  /**
   * Get public sections (for public site)
   */
  async getPublicSections(type?: SectionType): Promise<SectionData[]> {
    const endpoint = type ? `/sections/public?type=${type}` : '/sections/public';
    return this.request<SectionData[]>(endpoint);
  }
}

/**
 * Default client instance
 */
export const sectionClient = new SectionClient();

/**
 * Convenience functions using the default client
 */
export const createSection = sectionClient.createSection.bind(sectionClient);
export const updateSection = sectionClient.updateSection.bind(sectionClient);
export const deleteSection = sectionClient.deleteSection.bind(sectionClient);
export const getSectionById = sectionClient.getSectionById.bind(sectionClient);
export const getSectionsByType = sectionClient.getSectionsByType.bind(sectionClient);
export const getSections = sectionClient.getSections.bind(sectionClient);
export const getSectionList = sectionClient.getSectionList.bind(sectionClient);
export const duplicateSection = sectionClient.duplicateSection.bind(sectionClient);
export const copySection = sectionClient.copySection.bind(sectionClient);
export const reorderSections = sectionClient.reorderSections.bind(sectionClient);
export const getPublicSections = sectionClient.getPublicSections.bind(sectionClient);

/**
 * Client-side utility functions
 */

/**
 * Get localized text from MultiLanguageText
 */
export function getLocalizedText(
  text: MultiLanguageText | string,
  language: string = 'en',
  fallback: string = 'en'
): string {
  if (typeof text === 'string') {
    return text;
  }

  return text[language] || text[fallback] || text.en || Object.values(text)[0] || '';
}

/**
 * Validate section data on client side
 */
export function validateSectionData(data: Partial<SectionCreateData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Section name is required');
  }

  if (!data.title?.en || data.title.en.trim().length === 0) {
    errors.push('Section title (English) is required');
  }

  if (!data.type) {
    errors.push('Section type is required');
  }

  if (typeof data.order !== 'number' || data.order < 0) {
    errors.push('Section order must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if section is visible to public
 */
export function isSectionPublic(section: SectionData): boolean {
  return section.isVisible && section.status === 'Active';
}

/**
 * Sort sections by order
 */
export function sortSectionsByOrder(sections: SectionData[]): SectionData[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

/**
 * Filter sections by type
 */
export function filterSectionsByType(sections: SectionData[], type: SectionType): SectionData[] {
  return sections.filter(section => section.type === type);
}

/**
 * Group sections by type
 */
export function groupSectionsByType(sections: SectionData[]): Record<SectionType, SectionData[]> {
  return sections.reduce((groups, section) => {
    const type = section.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(section);
    return groups;
  }, {} as Record<SectionType, SectionData[]>);
}

/**
 * Search sections by name or title
 */
export function searchSections(sections: SectionData[], query: string, language: string = 'en'): SectionData[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return sections;
  }

  return sections.filter(section => {
    const name = section.name.toLowerCase();
    const title = getLocalizedText(section.title, language).toLowerCase();
    
    return name.includes(normalizedQuery) || title.includes(normalizedQuery);
  });
}

/**
 * Format section for display
 */
export function formatSectionForDisplay(section: SectionData, language: string = 'en') {
  return {
    id: section._id,
    name: section.name,
    title: getLocalizedText(section.title, language),
    type: section.type,
    order: section.order,
    isVisible: section.isVisible,
    isReusable: section.isReusable,
    status: section.status,
    createdAt: new Date(section.createdAt).toLocaleDateString(),
    updatedAt: new Date(section.updatedAt).toLocaleDateString()
  };
}

/**
 * Generate section preview URL
 */
export function getSectionPreviewUrl(sectionId: string, tenantId?: string): string {
  const baseUrl = '/preview/section';
  const params = new URLSearchParams({ id: sectionId });
  
  if (tenantId) {
    params.append('tenant', tenantId);
  }
  
  return `${baseUrl}?${params.toString()}`;
}