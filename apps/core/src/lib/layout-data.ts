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
 * Also detects and includes static module routes for navigation
 */
function createClientModule(module: any, appId: string): ClientModule {
  // Import static module utils here (server-side only)
  const { getStaticModuleRoutes } = require('@/lib/static-module-utils')

  // Detect static module routes for this module
  const staticRoutes = getStaticModuleRoutes(appId, module.slug)

  return {
    id: module.id,
    name: module.name,
    slug: module.slug,
    serviceName: module.serviceName,
    description: module.description,
    iconName: module.iconName,

    // Include parent module for hierarchical navigation
    parentModule: module.parentModule,

    // Include necessary schema properties for page functionality (non-sensitive)
    formLayout: module.formLayout,
    formFields: module.formFields,
    dataTableSchema: module.dataTableSchema,
    detailViewSchema: module.detailViewSchema,
    extraActionForms: module.extraActionForms,
    wizardConfig: module.wizardConfig,

    // Include static module routes for navigation
    staticRoutes: staticRoutes

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

    // Convert to clean client modules (remove sensitive access policies and add static routes)
    const cleanModules = accessibleModules.map(module => createClientModule(module, appId))

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
 * Check if current user has access to the requested application
 * Returns access result with app details for error messaging
 */
const checkCurrentAppAccess = cache(async (
  tenant: TenantSettings | null,
  user: User | null,
  appId: string
): Promise<{
  hasAccess: boolean,
  app: TenantApplication | null,
  reason?: string
}> => {
  // If no tenant or user, deny access
  if (!tenant || !user) {
    return {
      hasAccess: false,
      app: null,
      reason: !tenant ? "Tenant not found" : "User not authenticated"
    }
  }

  // If no applications configured, deny access
  if (!tenant.applications || tenant.applications.length === 0) {
    return {
      hasAccess: false,
      app: null,
      reason: "No applications configured for this tenant"
    }
  }

  // Find the requested application
  const app = tenant.applications.find(app =>
    app.status && (app.slug === appId ||
                   app.displayShortName?.en?.toLowerCase() === appId.toLowerCase())
  )

  if (!app) {
    return {
      hasAccess: false,
      app: null,
      reason: `Application '${appId}' not found or inactive`
    }
  }

  // Check if user has access based on roles
  const hasAccess = hasApplicationAccess(user, app.acceptRolesList)

  console.log(`[APP_ACCESS_CHECK] App: ${appId}, User: ${user.email}, HasAccess: ${hasAccess}`)
  if (!hasAccess) {
    console.log(`[APP_ACCESS_CHECK] User roles:`, JSON.stringify(user.roles, null, 2))
    console.log(`[APP_ACCESS_CHECK] App acceptRolesList:`, JSON.stringify(app.acceptRolesList, null, 2))
  }

  return {
    hasAccess,
    app,
    reason: hasAccess ? undefined : "Insufficient permissions for this application"
  }
})

/**
 * Create app-specific layout data fetcher
 * Each appId gets its own cached instance for proper cache separation
 * Cache key includes both appId and a timestamp component for better invalidation
 */
const createAppAwareFetchLayoutData = (appId?: string) => {
  // Create a unique cache key that includes the appId to prevent cross-app pollution
  const cacheKey = `layout-data-${appId || 'default'}`

  return cache(async (): Promise<LayoutData> => {
    console.log(`[LAYOUT_CACHE] Fetching data for appId: ${appId}, cacheKey: ${cacheKey}`)
    return fetchLayoutDataImpl(appId)
  })
}

/**
 * Main implementation for fetching layout data
 * App-aware data fetching with role-based filtering
 */
async function fetchLayoutDataImpl(appId?: string): Promise<LayoutData> {
  // Get middleware data including language from headers
  const middlewareData = await getMiddlewareDataFromHeaders()

  // Use provided appId or fallback to middleware
  const effectiveAppId = appId || middlewareData.appId

  // Fetch tenant data
  const { tenant, error: tenantError } = await fetchTenantData()

  // Fetch authentication data from middleware headers
  const authData = await fetchAuthData()

  // Filter applications based on user roles (only if user is authenticated)
  let filteredApps: TenantApplication[] = []
  if (tenant && authData?.isAuthenticated) {
    filteredApps = await filterUserApplications(tenant, authData.user)
  }

  // Check current app access if we have an appId and authenticated user
  let currentAppAccess: {
    hasAccess: boolean,
    app: TenantApplication | null,
    reason?: string
  } | null = null

  if (effectiveAppId && tenant && authData?.isAuthenticated) {
    currentAppAccess = await checkCurrentAppAccess(tenant, authData.user, effectiveAppId)
  }

  // Fetch app schema data if tenant is available (with user-based filtering)
  let appSchemaData: ClientAppSchemaData | null = null
  if (tenant && effectiveAppId && currentAppAccess?.hasAccess !== false) {
    appSchemaData = await fetchAppSchemaData(tenant, effectiveAppId, authData?.user || null)
  }

  return {
    middlewareData: {
      ...middlewareData,
      appId: effectiveAppId // Ensure consistent appId in response
    },
    tenant,
    tenantError,
    appSchemaData,
    authData,
    filteredApps,
    currentAppAccess
  }
}

/**
 * App-aware layout data fetcher
 * Creates separate cache instances per appId for proper sidebar redraw
 */
export function fetchLayoutData(appId?: string): Promise<LayoutData> {
  const cachedFetcher = createAppAwareFetchLayoutData(appId)
  return cachedFetcher()
}

/**
 * Generate metadata for the core application
 */
export function generatePageMetadata(tenant: TenantSettings | null): PageMetadata {
  return generateDashboardMetadata(tenant, "Core")
}