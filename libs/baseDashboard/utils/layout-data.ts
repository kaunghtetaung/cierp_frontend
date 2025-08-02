// Common layout data fetching utilities for dashboard applications
import type { TenantSettings } from "@repo/types"
import type { DashboardLayoutData, DashboardMetadata, MiddlewareData, AppSchemaData } from "../types"

/**
 * Generate metadata for dashboard pages
 */
export function generateDashboardMetadata(
  tenant: TenantSettings | null,
  appName?: string
): DashboardMetadata {
  const defaultTitle = appName ? `${appName} Dashboard` : "Dashboard"
  const defaultDescription = appName 
    ? `${appName} Content Management System Dashboard`
    : "Content Management System Dashboard"

  return {
    title: tenant?.brandInfo?.title || tenant?.fullName || defaultTitle,
    description: tenant?.brandInfo?.description || defaultDescription
  }
}

/**
 * Common error handling for tenant data fetching
 */
export function createTenantErrorHandler(contextName: string = "dashboard") {
  return {
    handleTenantError: (error: unknown): string => {
      console.error(`Failed to load tenant in ${contextName}:`, error)
      return error instanceof Error ? error.message : `Failed to load tenant in ${contextName}`
    },
    
    validateTenant: (tenant: TenantSettings | null): { isValid: boolean; error?: string } => {
      if (!tenant) {
        return {
          isValid: false,
          error: "No tenant found or tenant is inactive"
        }
      }
      return { isValid: true }
    }
  }
}

/**
 * Common app schema error handling
 */
export function createAppSchemaErrorHandler(contextName: string = "dashboard") {
  return {
    handleSchemaError: (error: unknown, appId: string): void => {
      console.error(`Failed to get app schema data for ${appId} in ${contextName}:`, error)
    },
    
    logSchemaSuccess: (moduleCount: number, appId: string): void => {
      console.log(`✅ Successfully fetched ${moduleCount} modules from app schema service for app: ${appId}`)
    }
  }
}

/**
 * Utility to merge dashboard layout data
 */
export function mergeDashboardLayoutData(
  baseData: Partial<DashboardLayoutData>,
  additionalData: Partial<DashboardLayoutData>
): DashboardLayoutData {
  return {
    middlewareData: additionalData.middlewareData || baseData.middlewareData || {
      language: 'en'
    },
    tenant: additionalData.tenant || baseData.tenant || null,
    tenantError: additionalData.tenantError || baseData.tenantError || null,
    appSchemaData: additionalData.appSchemaData || baseData.appSchemaData || null
  }
}