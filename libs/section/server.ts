// Enhanced section management with Redis caching and copy functionality
import { getCacheInstance, CacheKeys, CacheTTL } from "@repo/cache";
import { getCurrentTenantForClient } from "@repo/tenant/wrapper";
import { getTenantIdFromHeaders } from "@repo/utils/server";
import { hasPermission } from "@repo/auth/utils/login-utils";
import { getCurrentUser } from "@repo/auth/server/server";
// Section server-side utilities
import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import { headers } from "next/headers";
import { API_ENDPOINTS } from "@repo/utils/common/constants";
import { createHttpClient } from "@repo/api/client";
import type { UnifiedCache } from "@repo/cache";
import type { User } from "@repo/types";

/**
 * Helper function to get tenant ID from headers, throws if not found
 */
async function requireTenantId(): Promise<string> {
  const tenantId = await getTenantIdFromHeaders();
  if (!tenantId) {
    throw new Error("Tenant ID is required but not found in headers");
  }
  return tenantId;
}

/**
 * Basic input validation
 */
function validateUserInput(input: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input || typeof input !== "string") {
    errors.push("Input is required and must be a string");
  } else if (input.trim().length === 0) {
    errors.push("Input cannot be empty");
  } else if (input.length > 1000) {
    errors.push("Input is too long (max 1000 characters)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
import type {
  SectionData,
  SectionType,
  SectionCreateData,
  SectionUpdateData,
  SectionService,
  SectionListResult,
  SectionListOptions,
  SectionCopyOptions,
  SectionValidationResult,
} from "../types/section";

export interface SectionManagerConfig {
  readonly apiBaseUrl: string;
  readonly cacheEnabled: boolean;
  readonly cacheTtl: number;
  readonly enablePermissionCheck: boolean;
}

const DEFAULT_CONFIG: SectionManagerConfig = {
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3331",
  cacheEnabled: true,
  cacheTtl: CacheTTL.CONTENT,
  enablePermissionCheck: true,
};

/**
 * Section manager class with caching and copy functionality
 */
export class SectionManager implements SectionService {
  private config: SectionManagerConfig;
  private cache: UnifiedCache;

  constructor(config: Partial<SectionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = getCacheInstance();
  }

  /**
   * Create a new section
   */
  async createSection(sectionData: SectionCreateData): Promise<SectionData> {
    // Validate permissions
    if (this.config.enablePermissionCheck) {
      await this.requireCreatePermission();
    }

    // Validate input
    const validation = this.validateSectionData(sectionData);
    if (!validation.valid) {
      throw new Error(`Invalid section data: ${validation.errors.join(", ")}`);
    }

    const tenantId = await requireTenantId();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("User authentication required");
    }

    try {
      const newSection = await this.createSectionInAPI(
        sectionData,
        user.id,
        tenantId
      );

      // Cache the new section
      if (this.config.cacheEnabled) {
        await this.cache.set(
          CacheKeys.custom("section", newSection._id),
          newSection,
          this.config.cacheTtl
        );

        // Invalidate list caches
        await this.invalidateListCaches(tenantId, newSection.type);
      }

      return newSection;
    } catch (error) {
      console.error("Error creating section:", error);
      throw error;
    }
  }

  /**
   * Update an existing section
   */
  async updateSection(
    id: string,
    sectionData: SectionUpdateData
  ): Promise<SectionData> {
    // Validate permissions
    if (this.config.enablePermissionCheck) {
      await this.requireUpdatePermission(id);
    }

    // Validate input
    const validation = validateUserInput(id);
    if (!validation.valid) {
      throw new Error("Invalid section ID");
    }

    try {
      const updatedSection = await this.updateSectionInAPI(id, sectionData);

      // Update cache
      if (this.config.cacheEnabled) {
        await this.cache.set(
          CacheKeys.custom("section", id),
          updatedSection,
          this.config.cacheTtl
        );

        // Invalidate list caches
        const tenantId = await requireTenantId();
        await this.invalidateListCaches(tenantId, updatedSection.type);
      }

      return updatedSection;
    } catch (error) {
      console.error("Error updating section:", error);
      throw error;
    }
  }

  /**
   * Delete a section
   */
  async deleteSection(id: string): Promise<boolean> {
    // Validate permissions
    if (this.config.enablePermissionCheck) {
      await this.requireDeletePermission(id);
    }

    // Validate input
    const validation = validateUserInput(id);
    if (!validation.valid) {
      throw new Error("Invalid section ID");
    }

    try {
      // Get section info before deletion for cache invalidation
      const section = await this.getSectionById(id);

      const success = await this.deleteSectionFromAPI(id);

      if (success && this.config.cacheEnabled) {
        // Remove from cache
        await this.cache.del(CacheKeys.custom("section", id));

        // Invalidate list caches
        if (section) {
          const tenantId = await requireTenantId();
          await this.invalidateListCaches(tenantId, section.type);
        }
      }

      return success;
    } catch (error) {
      console.error("Error deleting section:", error);
      throw error;
    }
  }

  /**
   * Get section by ID with caching
   */
  async getSectionById(id: string): Promise<SectionData | null> {
    // Validate input
    const validation = validateUserInput(id);
    if (!validation.valid) {
      throw new Error("Invalid section ID");
    }

    if (this.config.cacheEnabled) {
      return await this.cache.getSet(
        CacheKeys.custom("section", id),
        async () => await this.fetchSectionFromAPI(id),
        this.config.cacheTtl
      );
    }

    return await this.fetchSectionFromAPI(id);
  }

  /**
   * Get sections by type with caching
   */
  async getSectionsByType(
    type: SectionType,
    tenantId?: string
  ): Promise<SectionData[]> {
    const finalTenantId = tenantId || (await requireTenantId());

    const cacheKey = CacheKeys.custom("sections", "type", type, finalTenantId);

    if (this.config.cacheEnabled) {
      return await this.cache.getSet(
        cacheKey,
        async () => await this.fetchSectionsByTypeFromAPI(type, finalTenantId),
        this.config.cacheTtl
      );
    }

    return await this.fetchSectionsByTypeFromAPI(type, finalTenantId);
  }

  /**
   * Get all sections for a tenant with caching
   */
  async getSectionsByTenant(tenantId?: string): Promise<SectionData[]> {
    const finalTenantId = tenantId || (await requireTenantId());

    const cacheKey = CacheKeys.custom("sections", "tenant", finalTenantId);

    if (this.config.cacheEnabled) {
      return await this.cache.getSet(
        cacheKey,
        async () => await this.fetchSectionsByTenantFromAPI(finalTenantId),
        this.config.cacheTtl
      );
    }

    return await this.fetchSectionsByTenantFromAPI(finalTenantId);
  }

  /**
   * Get sections with pagination and filtering
   */
  async getSectionList(
    options: SectionListOptions = {},
    tenantId?: string
  ): Promise<SectionListResult> {
    const finalTenantId = tenantId || (await requireTenantId());

    const cacheKey = this.buildListCacheKey(finalTenantId, options);

    if (this.config.cacheEnabled) {
      return await this.cache.getSet(
        cacheKey,
        async () => await this.fetchSectionListFromAPI(finalTenantId, options),
        this.config.cacheTtl
      );
    }

    return await this.fetchSectionListFromAPI(finalTenantId, options);
  }

  /**
   * Duplicate a section (create copy)
   */
  async duplicateSection(id: string, newName?: string): Promise<SectionData> {
    // Validate permissions
    if (this.config.enablePermissionCheck) {
      await this.requireCreatePermission();
    }

    const originalSection = await this.getSectionById(id);
    if (!originalSection) {
      throw new Error("Section not found");
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User authentication required");
    }

    // Create duplicate data
    const duplicateData: SectionCreateData = {
      ...originalSection,
      name: newName || `${originalSection.name} (Copy)`,
      title: {
        ...originalSection.title,
        en: newName || `${originalSection.title.en} (Copy)`,
        mm: newName || `${originalSection.title.mm} (Copy)`,
      },
      order: originalSection.order + 1,
      createdBy: user.id,
      updatedBy: undefined,
    };

    return await this.createSection(duplicateData);
  }

  /**
   * Copy section to another tenant
   */
  async copySection(
    id: string,
    targetTenantId: string,
    options: SectionCopyOptions = {}
  ): Promise<SectionData> {
    // Validate permissions
    if (this.config.enablePermissionCheck) {
      await this.requireCreatePermission();
    }

    const originalSection = await this.getSectionById(id);
    if (!originalSection) {
      throw new Error("Section not found");
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User authentication required");
    }

    // Create copy data for target tenant
    const copyData: SectionCreateData = {
      ...originalSection,
      name: options.newName || `${originalSection.name} (Copy)`,
      title: options.newTitle || {
        ...originalSection.title,
        en: options.newName || `${originalSection.title.en} (Copy)`,
        mm: options.newName || `${originalSection.title.mm} (Copy)`,
      },
      tenantId: targetTenantId,
      departmentId: options.targetDepartmentId,
      isReusable: options.makeReusable ?? originalSection.isReusable,
      order: 1, // Reset order for new tenant
      createdBy: user.id,
      updatedBy: undefined,
    };

    try {
      const copiedSection = await this.createSectionInAPI(
        copyData,
        user.id,
        targetTenantId
      );

      // Cache the copied section
      if (this.config.cacheEnabled) {
        await this.cache.set(
          CacheKeys.custom("section", copiedSection._id),
          copiedSection,
          this.config.cacheTtl
        );

        // Invalidate target tenant caches
        await this.invalidateListCaches(targetTenantId, copiedSection.type);
      }

      return copiedSection;
    } catch (error) {
      console.error("Error copying section:", error);
      throw error;
    }
  }

  /**
   * Reorder sections
   */
  async reorderSections(
    sectionIds: string[],
    newOrders: number[]
  ): Promise<SectionData[]> {
    if (sectionIds.length !== newOrders.length) {
      throw new Error(
        "Section IDs and orders arrays must have the same length"
      );
    }

    // Validate permissions
    if (this.config.enablePermissionCheck) {
      await this.requireUpdatePermission(sectionIds[0]); // Check permission for first section
    }

    try {
      const reorderedSections = await this.reorderSectionsInAPI(
        sectionIds,
        newOrders
      );

      // Update cache for each section
      if (this.config.cacheEnabled) {
        await Promise.all(
          reorderedSections.map((section) =>
            this.cache.set(
              CacheKeys.custom("section", section._id),
              section,
              this.config.cacheTtl
            )
          )
        );

        // Invalidate list caches
        const tenantId = await requireTenantId();
        await this.invalidateListCaches(tenantId);
      }

      return reorderedSections;
    } catch (error) {
      console.error("Error reordering sections:", error);
      throw error;
    }
  }

  /**
   * Get public sections (for public site)
   */
  async getPublicSections(
    type?: SectionType,
    tenantId?: string
  ): Promise<SectionData[]> {
    const finalTenantId = tenantId || (await requireTenantId());

    const sections = type
      ? await this.getSectionsByType(type, finalTenantId)
      : await this.getSectionsByTenant(finalTenantId);

    // Filter for public visibility and active status
    return sections.filter(
      (section) => section.isVisible && section.status === "Active"
    );
  }

  /**
   * Clear section cache
   */
  async clearCache(sectionId?: string, tenantId?: string): Promise<void> {
    const finalTenantId = tenantId || (await requireTenantId());

    if (sectionId) {
      await this.cache.del(CacheKeys.custom("section", sectionId));
    } else {
      await this.cache.deletePattern(`ciApp:${finalTenantId}:section:*`);
    }
  }

  /**
   * Private helper methods
   */

  private buildListCacheKey(
    tenantId: string,
    options: SectionListOptions
  ): string {
    const optionsHash = Buffer.from(JSON.stringify(options))
      .toString("base64")
      .slice(0, 16);
    return CacheKeys.custom("sections", "list", tenantId, optionsHash);
  }

  private async invalidateListCaches(
    tenantId: string,
    type?: SectionType
  ): Promise<void> {
    const patterns = [
      `sections:list:${tenantId}:*`,
      `sections:tenant:${tenantId}`,
    ];

    if (type) {
      patterns.push(`sections:type:${type}:${tenantId}`);
    }

    await Promise.all(
      patterns.map((pattern) => this.cache.deletePattern(pattern))
    );
  }

  private validateSectionData(
    data: SectionCreateData
  ): SectionValidationResult {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push("Section name is required");
    }

    if (!data.title?.en || data.title.en.trim().length === 0) {
      errors.push("Section title (English) is required");
    }

    if (!data.title?.mm || data.title.mm.trim().length === 0) {
      errors.push("Section title (Myanmar) is required");
    }

    if (typeof data.order !== "number" || data.order < 0) {
      errors.push("Section order must be a non-negative number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Permission check methods
  private async requireCreatePermission(): Promise<void> {
    const user = await getCurrentUser();
    const canCreate =
      hasPermission(user, "manage_content") || hasPermission(user, "write");
    if (!canCreate) {
      throw new Error("Insufficient permissions to create sections");
    }
  }

  private async requireUpdatePermission(sectionId: string): Promise<void> {
    const user = await getCurrentUser();
    const canUpdate =
      hasPermission(user, "manage_content") || hasPermission(user, "write");
    if (!canUpdate) {
      throw new Error("Insufficient permissions to update sections");
    }
  }

  private async requireDeletePermission(sectionId: string): Promise<void> {
    const user = await getCurrentUser();
    const canDelete =
      hasPermission(user, "manage_content") || hasPermission(user, "delete");
    if (!canDelete) {
      throw new Error("Insufficient permissions to delete sections");
    }
  }

  // API methods (these would integrate with your actual API)

  private async createSectionInAPI(
    data: SectionCreateData,
    userId: string,
    tenantId: string
  ): Promise<SectionData> {
    // Mock implementation - replace with actual API call
    console.log("Creating section in API:", { data, userId, tenantId });
    throw new Error("API integration not implemented");
  }

  private async updateSectionInAPI(
    id: string,
    data: SectionUpdateData
  ): Promise<SectionData> {
    // Mock implementation - replace with actual API call
    console.log("Updating section in API:", { id, data });
    throw new Error("API integration not implemented");
  }

  private async deleteSectionFromAPI(id: string): Promise<boolean> {
    // Mock implementation - replace with actual API call
    console.log("Deleting section from API:", id);
    throw new Error("API integration not implemented");
  }

  private async fetchSectionFromAPI(id: string): Promise<SectionData | null> {
    // Mock implementation - replace with actual API call
    console.log("Fetching section from API:", id);
    return null;
  }

  private async fetchSectionsByTypeFromAPI(
    type: SectionType,
    tenantId: string
  ): Promise<SectionData[]> {
    // Mock implementation - replace with actual API call
    console.log("Fetching sections by type from API:", { type, tenantId });
    return [];
  }

  private async fetchSectionsByTenantFromAPI(
    tenantId: string
  ): Promise<SectionData[]> {
    // Mock implementation - replace with actual API call
    console.log("Fetching sections by tenant from API:", tenantId);
    return [];
  }

  private async fetchSectionListFromAPI(
    tenantId: string,
    options: SectionListOptions
  ): Promise<SectionListResult> {
    // Mock implementation - replace with actual API call
    console.log("Fetching section list from API:", { tenantId, options });
    return {
      sections: [],
      total: 0,
      page: options.page || 1,
      limit: options.limit || 20,
      hasMore: false,
    };
  }

  private async reorderSectionsInAPI(
    sectionIds: string[],
    newOrders: number[]
  ): Promise<SectionData[]> {
    // Mock implementation - replace with actual API call
    console.log("Reordering sections in API:", { sectionIds, newOrders });
    throw new Error("API integration not implemented");
  }
}

/**
 * Default section manager instance
 */
export const sectionManager = new SectionManager();

/**
 * Convenience functions using the default manager
 */
export const createSection = sectionManager.createSection.bind(sectionManager);
export const updateSection = sectionManager.updateSection.bind(sectionManager);
export const deleteSection = sectionManager.deleteSection.bind(sectionManager);
export const getSectionById =
  sectionManager.getSectionById.bind(sectionManager);
export const getSectionsByType =
  sectionManager.getSectionsByType.bind(sectionManager);
export const getSectionsByTenant =
  sectionManager.getSectionsByTenant.bind(sectionManager);
export const duplicateSection =
  sectionManager.duplicateSection.bind(sectionManager);
export const copySection = sectionManager.copySection.bind(sectionManager);
export const reorderSections =
  sectionManager.reorderSections.bind(sectionManager);
export const getPublicSections =
  sectionManager.getPublicSections.bind(sectionManager);

/**
 * Section validation helper
 */
export function validateSection(
  data: SectionCreateData
): SectionValidationResult {
  return sectionManager["validateSectionData"](data);
}
