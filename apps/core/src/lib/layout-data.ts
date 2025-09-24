// Core layout data fetching utilities
// Extends baseDashboard utilities with core-specific functionality

import { cache } from "react"
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware"
import { getCurrentTenantForClient } from "@repo/tenant/wrapper"
import { getModuleSchemas } from "@repo/appSchema/wrapper"
import { validateRequest } from "@repo/auth/core"
import { hasApplicationAccess } from "@repo/auth/login-utils"
import { getSafeHeaders } from "@repo/utils/server/headers-compat"
import {
  createTenantErrorHandler,
  createAppSchemaErrorHandler,
  generateDashboardMetadata
} from "@repo/base-dashboard"
import { filterModulesByUserAccess } from "@/lib/module-access-utils"
import type { TenantSettings, User, TenantApplication } from "@repo/types"
import type { MiddlewareData, AppSchemaData, LayoutData, PageMetadata, AuthData, ClientAppSchemaData, ClientModule } from "@/types/layout"

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
 * Fetch authentication data from middleware headers
 * Cached at request level to prevent multiple validation calls
 */
const fetchAuthData = cache(async (): Promise<AuthData | null> => {
  try {
    const headersList = await getSafeHeaders()
    const sessionId = headersList.get("x-session-id")

    if (!sessionId) {
      console.log("[LAYOUT_AUTH] No session ID found in headers")
      return {
        user: null,
        session: null,
        isAuthenticated: false,
        error: "No session ID"
      }
    }

    // Get client IP and user agent for validation context
    const clientIp = headersList.get("x-forwarded-for") || headersList.get("x-real-ip")
    const userAgent = headersList.get("user-agent")

    // Validate session using core auth
    const authResult = await validateRequest(sessionId, {
      ipAddress: clientIp || undefined,
      userAgent: userAgent || undefined
    })

    if (!authResult.isAuthenticated || !authResult.user || !authResult.session) {
      console.log("[LAYOUT_AUTH] Session validation failed")
      return {
        user: null,
        session: null,
        isAuthenticated: false,
        error: "Session validation failed"
      }
    }

    console.log(`[LAYOUT_AUTH] User authenticated: ${authResult.user.email}`)
    return {
      user: authResult.user,
      session: authResult.session,
      isAuthenticated: true,
      error: null
    }
  } catch (error) {
    console.error("[LAYOUT_AUTH] Auth validation error:", error)
    return {
      user: null,
      session: null,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
})

/**
 * Filter tenant applications based on user roles
 * Cached at request level to prevent multiple filtering operations
 */
const filterUserApplications = cache(async (
  tenant: TenantSettings,
  user: User | null
): Promise<TenantApplication[]> => {
  if (!tenant?.applications || tenant.applications.length === 0) {
    return []
  }

  // Filter only active applications first
  let activeApps = tenant.applications.filter((app) => app.status)

  // If no user data, return empty array (user should be redirected by middleware)
  if (!user) {
    console.log("[LAYOUT_FILTER] No user data, returning empty apps array")
    return []
  }

  // Filter applications based on user roles
  console.log(`[LAYOUT_FILTER] Filtering apps for user: ${user.email}`)
  console.log(`[LAYOUT_FILTER] User roles (${user.roles?.length}):`, JSON.stringify(user.roles, null, 2))

  const filteredApps = activeApps.filter((app) => {
    const hasAccess = hasApplicationAccess(user, app.acceptRolesList)

    // Debug logging
    console.log(`[LAYOUT_FILTER] App ${app.slug || app.displayShortName?.en}:`)
    console.log(`  - acceptRolesList (${app.acceptRolesList?.length}):`, JSON.stringify(app.acceptRolesList, null, 2))
    console.log(`  - hasAccess:`, hasAccess)

    return hasAccess
  })

  console.log(`[LAYOUT_FILTER] Filtered ${filteredApps.length} apps from ${activeApps.length} active apps`)
  return filteredApps
})

/**
 * Convert module to clean client module (removing sensitive access policies)
 */
function createClientModule(module: any): ClientModule {
  return {
    id: module.id,
    name: module.name,
    slug: module.slug,
    serviceName: module.serviceName,
    description: module.description,
    iconName: module.iconName,

    // Include necessary schema properties for page functionality (non-sensitive)
    formLayout: module.formLayout,
    formFields: module.formFields,
    dataTableSchema: module.dataTableSchema,
    detailViewSchema: module.detailViewSchema,
    extraActionForms: module.extraActionForms,
    wizardConfig: module.wizardConfig

    // moduleAccessPolicy is intentionally excluded for security
  }
}

/**
 * Fetch app schema data with error handling and role-based module filtering
 * Cached at request level to prevent multiple calls for same tenant+app
 */
const fetchAppSchemaData = cache(async (
  tenant: TenantSettings,
  appId: string,
  user: User | null = null
): Promise<ClientAppSchemaData | null> => {
  try {

    const moduleSchemas = await getModuleSchemas(tenant.id, appId)

    // Raw app schema with full modules (including access policies)
    const rawAppSchemaData: AppSchemaData = {
      modules: moduleSchemas.modules || [],
      supportedLanguages: moduleSchemas.supportedLanguages || [],
      serviceName: moduleSchemas.serviceName || 'unknown',
      timestamp: moduleSchemas.timestamp || new Date().toISOString(),
      appId
    }

    // Filter modules based on user's role permissions (SERVER-SIDE SECURITY)
    const accessibleModules = filterModulesByUserAccess(rawAppSchemaData.modules, user)

    // Convert to clean client modules (remove sensitive access policies)
    const cleanModules = accessibleModules.map(createClientModule)

    // Create clean client app schema data
    const clientAppSchemaData: ClientAppSchemaData = {
      modules: cleanModules,
      supportedLanguages: rawAppSchemaData.supportedLanguages,
      serviceName: rawAppSchemaData.serviceName,
      timestamp: rawAppSchemaData.timestamp,
      appId: rawAppSchemaData.appId
    }

    console.log(`[LAYOUT_DATA] Filtered ${cleanModules.length} accessible modules from ${rawAppSchemaData.modules.length} total for user: ${user?.email || 'anonymous'}`)
    logSchemaSuccess(cleanModules.length, appId)

    return clientAppSchemaData
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

  // Fetch authentication data from middleware headers
  const authData = await fetchAuthData()

  // Filter applications based on user roles (only if user is authenticated)
  let filteredApps: TenantApplication[] = []
  if (tenant && authData?.isAuthenticated) {
    filteredApps = await filterUserApplications(tenant, authData.user)
  }

  // Fetch app schema data if tenant is available (with user-based filtering)
  let appSchemaData: ClientAppSchemaData | null = null
  if (tenant && middlewareData.appId) {
    appSchemaData = await fetchAppSchemaData(tenant, middlewareData.appId, authData?.user || null)
  }

  return {
    middlewareData,
    tenant,
    tenantError,
    appSchemaData,
    authData,
    filteredApps
  }
})

/**
 * Generate metadata for the core application
 */
export function generatePageMetadata(tenant: TenantSettings | null): PageMetadata {
  return generateDashboardMetadata(tenant, "Core")
}