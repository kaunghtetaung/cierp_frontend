// Core layout data fetching utilities
// Extends baseDashboard utilities with core-specific functionality

import { cache } from "react"
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware"
import { getCurrentTenantForClient } from "@repo/tenant/wrapper"
import { getModuleSchemas } from "@repo/appSchema/wrapper"
import { 
  createTenantErrorHandler, 
  createAppSchemaErrorHandler,
  generateDashboardMetadata 
} from "@repo/base-dashboard"
import type { TenantSettings } from "@repo/types"
import type { MiddlewareData, AppSchemaData, LayoutData, PageMetadata } from "@/types/layout"

// Create error handlers for core context
const { handleTenantError, validateTenant } = createTenantErrorHandler("core")
const { handleSchemaError, logSchemaSuccess } = createAppSchemaErrorHandler("core")

/**
 * Fetch tenant data with error handling
 * Cached at request level to prevent multiple calls
 */
const fetchTenantData = cache(async (): Promise<{
  tenant: TenantSettings | null
  error: string | null
}> => {
  try {
    const tenant = await getCurrentTenantForClient()
    
    const validation = validateTenant(tenant)
    if (!validation.isValid) {
      return {
        tenant: null,
        error: validation.error!
      }
    }
    
    return { tenant, error: null }
  } catch (error) {
    return {
      tenant: null,
      error: handleTenantError(error)
    }
  }
})

/**
 * Fetch app schema data with error handling
 * Cached at request level to prevent multiple calls for same tenant+app
 */
const fetchAppSchemaData = cache(async (
  tenant: TenantSettings,
  appId: string
): Promise<AppSchemaData | null> => {
  try {
    
    const moduleSchemas = await getModuleSchemas(tenant.id, appId)
    
    const appSchemaData: AppSchemaData = {
      modules: moduleSchemas.modules || [],
      supportedLanguages: moduleSchemas.supportedLanguages || [],
      serviceName: moduleSchemas.serviceName || 'unknown',
      timestamp: moduleSchemas.timestamp || new Date().toISOString(),
      appId
    }

    logSchemaSuccess(appSchemaData.modules.length, appId)
    
    return appSchemaData
  } catch (error) {
    handleSchemaError(error, appId)
    // Return null instead of throwing - continue with default sidebar
    return null
  }
})

/**
 * Main function to fetch all layout data
 * Centralizes all server-side data fetching for the layout
 * Cached at request level to prevent multiple calls per request
 */
export const fetchLayoutData = cache(async (): Promise<LayoutData> => {
  // Get middleware data including language from headers
  const middlewareData = await getMiddlewareDataFromHeaders()
  
  // Fetch tenant data
  const { tenant, error: tenantError } = await fetchTenantData()
  
  // Fetch app schema data if tenant is available
  let appSchemaData: AppSchemaData | null = null
  
  if (tenant && middlewareData.appId) {
    appSchemaData = await fetchAppSchemaData(tenant, middlewareData.appId)
  }
  
  return {
    middlewareData,
    tenant,
    tenantError,
    appSchemaData
  }
})

/**
 * Generate metadata for the core application
 */
export function generatePageMetadata(tenant: TenantSettings | null): PageMetadata {
  return generateDashboardMetadata(tenant, "Core")
}