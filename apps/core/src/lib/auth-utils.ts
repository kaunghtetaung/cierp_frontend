// Server-side authentication and authorization utilities for route protection

import { redirect } from 'next/navigation'
import { getAuthenticationStatus } from '@repo/auth/server'
import { getCurrentTenantForClient } from '@repo/tenant/wrapper'
import { hasApplicationAccess } from '@repo/auth/login-utils'
import { getPublicUrl } from '@repo/utils/server/domain'
import type { User, TenantSettings } from '@repo/types'

/**
 * Server-side app authorization result
 */
export interface AppAuthResult {
  isAuthorized: boolean
  user: User | null
  tenant: TenantSettings | null
  appId: string
  error?: string
}

/**
 * Check if current user has access to a specific application
 * Server-side function for route protection
 */
export async function validateAppAccess(appId: string): Promise<AppAuthResult> {
  try {
    // Get authentication status
    const authStatus = await getAuthenticationStatus()

    if (!authStatus.isAuthenticated || !authStatus.user) {
      console.log(`[APP_AUTH] User not authenticated for app: ${appId}`)
      return {
        isAuthorized: false,
        user: null,
        tenant: null,
        appId,
        error: 'User not authenticated'
      }
    }

    // Get tenant information
    const tenant = await getCurrentTenantForClient()
    if (!tenant) {
      console.log(`[APP_AUTH] No tenant found for app: ${appId}`)
      return {
        isAuthorized: false,
        user: authStatus.user,
        tenant: null,
        appId,
        error: 'Tenant not found'
      }
    }

    // Find the requested application in tenant's applications
    const app = tenant.applications?.find(
      app => app.slug === appId ||
             app.displayShortName?.en?.toLowerCase() === appId.toLowerCase()
    )

    if (!app) {
      console.log(`[APP_AUTH] App '${appId}' not found in tenant applications`)
      return {
        isAuthorized: false,
        user: authStatus.user,
        tenant,
        appId,
        error: 'Application not found'
      }
    }

    // Check if app is active
    if (!app.status) {
      console.log(`[APP_AUTH] App '${appId}' is inactive`)
      return {
        isAuthorized: false,
        user: authStatus.user,
        tenant,
        appId,
        error: 'Application is inactive'
      }
    }

    // Check user role-based access
    const hasAccess = hasApplicationAccess(authStatus.user, app.acceptRolesList)

    if (!hasAccess) {
      console.log(`[APP_AUTH] User ${authStatus.user.email} denied access to app '${appId}'`)
      console.log(`[APP_AUTH] User roles:`, JSON.stringify(authStatus.user.roles, null, 2))
      console.log(`[APP_AUTH] App acceptRolesList:`, JSON.stringify(app.acceptRolesList, null, 2))

      return {
        isAuthorized: false,
        user: authStatus.user,
        tenant,
        appId,
        error: 'Insufficient permissions'
      }
    }

    console.log(`[APP_AUTH] ✅ User ${authStatus.user.email} authorized for app '${appId}'`)
    return {
      isAuthorized: true,
      user: authStatus.user,
      tenant,
      appId
    }

  } catch (error) {
    console.error(`[APP_AUTH] Error validating access to app '${appId}':`, error)
    return {
      isAuthorized: false,
      user: null,
      tenant: null,
      appId,
      error: 'Authorization check failed'
    }
  }
}

/**
 * Require app access or redirect to unauthorized page
 * Use this in server components to protect routes
 */
export async function requireAppAccess(appId: string): Promise<{
  user: User
  tenant: TenantSettings
}> {
  const authResult = await validateAppAccess(appId)

  if (!authResult.isAuthorized) {
    // If not authenticated, redirect to login
    if (authResult.error === 'User not authenticated') {
      const publicUrl = await getPublicUrl()
      const currentUrl = encodeURIComponent(`/${appId}`)
      redirect(`${publicUrl}/login?returnUrl=${currentUrl}`)
    }

    // If authenticated but not authorized, redirect to unauthorized page
    redirect(`/unauthorized?app=${appId}&reason=${encodeURIComponent(authResult.error || 'Access denied')}`)
  }

  return {
    user: authResult.user!,
    tenant: authResult.tenant!
  }
}

/**
 * App info for user interface
 */
export interface AppInfo {
  id: string
  name: string
  description?: string
}

/**
 * Server-side module authorization - checks if user can access a specific module
 * Use this in module pages to protect against direct URL access
 */
export async function requireModuleAccess(appId: string, moduleSlug: string): Promise<{
  user: User
  tenant: TenantSettings
  module: any
}> {
  // First check app access
  const { user, tenant } = await requireAppAccess(appId)

  try {
    // Get full module schema with access policies (server-side only)
    const { getModuleSchemas } = await import('@repo/appSchema/wrapper')
    const moduleSchemas = await getModuleSchemas(tenant.id, appId)

    if (!moduleSchemas.modules || moduleSchemas.modules.length === 0) {
      console.log(`[MODULE_AUTH] No modules found for app '${appId}'`)
      redirect(`/unauthorized?app=${appId}&reason=${encodeURIComponent('No modules available')}`)
    }

    // Find the specific module
    const module = moduleSchemas.modules.find((mod: any) => mod.slug === moduleSlug)

    if (!module) {
      console.log(`[MODULE_AUTH] Module '${moduleSlug}' not found in app '${appId}'`)
      redirect(`/unauthorized?app=${appId}&reason=${encodeURIComponent(`Module '${moduleSlug}' not found`)}`)
    }

    // Check module-level access using the same logic as sidebar filtering
    const { filterModulesByUserAccess } = await import('@/lib/module-access-utils')
    const accessibleModules = filterModulesByUserAccess([module], user)

    if (accessibleModules.length === 0) {
      console.log(`[MODULE_AUTH] User ${user.email} denied access to module '${moduleSlug}' in app '${appId}'`)
      redirect(`/unauthorized?app=${appId}&reason=${encodeURIComponent(`Access denied to module '${moduleSlug}'`)}`)
    }

    console.log(`[MODULE_AUTH] ✅ User ${user.email} authorized for module '${moduleSlug}' in app '${appId}'`)
    return { user, tenant, module }

  } catch (error) {
    console.error(`[MODULE_AUTH] Error checking module access for '${appId}/${moduleSlug}':`, error)
    redirect(`/unauthorized?app=${appId}&reason=${encodeURIComponent('Module authorization check failed')}`)
  }
}

/**
 * Require module access with specific operation permission (create, update, delete)
 * Use this for operation-specific pages like create/new, edit, etc.
 */
export async function requireModuleOperationAccess(
  appId: string,
  moduleSlug: string,
  operation: 'create' | 'update' | 'softDelete' | 'hardDelete'
): Promise<{
  user: User
  tenant: TenantSettings
  module: any
}> {
  // First check general module access
  const { user, tenant, module } = await requireModuleAccess(appId, moduleSlug)

  try {
    // Import operation access functions
    const { hasModuleCreateAccess, hasModuleUpdateAccess, hasModuleSoftDeleteAccess, hasModuleHardDeleteAccess } = await import('@/lib/module-access-utils')

    let hasOperationAccess = false
    switch (operation) {
      case 'create':
        hasOperationAccess = hasModuleCreateAccess(module, user)
        break
      case 'update':
        hasOperationAccess = hasModuleUpdateAccess(module, user)
        break
      case 'softDelete':
        hasOperationAccess = hasModuleSoftDeleteAccess(module, user)
        break
      case 'hardDelete':
        hasOperationAccess = hasModuleHardDeleteAccess(module, user)
        break
    }

    if (!hasOperationAccess) {
      console.log(`[MODULE_OPERATION_AUTH] User ${user.email} denied ${operation} access to module '${moduleSlug}' in app '${appId}'`)
      redirect(`/unauthorized?app=${appId}&reason=${encodeURIComponent(`Insufficient permissions for ${operation} operation on module '${moduleSlug}'`)}`)
    }

    console.log(`[MODULE_OPERATION_AUTH] ✅ User ${user.email} authorized for ${operation} on module '${moduleSlug}' in app '${appId}'`)
    return { user, tenant, module }

  } catch (error) {
    console.error(`[MODULE_OPERATION_AUTH] Error checking ${operation} access for '${appId}/${moduleSlug}':`, error)
    redirect(`/unauthorized?app=${appId}&reason=${encodeURIComponent(`${operation} authorization check failed`)}`)
  }
}

/**
 * Get list of apps user has access to with display names
 */
export async function getUserAuthorizedApps(): Promise<AppInfo[]> {
  try {
    const authStatus = await getAuthenticationStatus()
    if (!authStatus.isAuthenticated || !authStatus.user) return []

    const tenant = await getCurrentTenantForClient()
    if (!tenant?.applications) return []

    const authorizedApps = tenant.applications
      .filter(app => app.status && hasApplicationAccess(authStatus.user!, app.acceptRolesList))
      .map(app => ({
        id: app.slug || app.displayShortName?.en || '',
        name: app.displayName?.en ||
              app.displayShortName?.en ||
              (app.slug ? app.slug.charAt(0).toUpperCase() + app.slug.slice(1) : ''),
        description: app.localizedDescription?.en
      }))
      .filter(app => app.id) // Remove empty IDs

    return authorizedApps
  } catch (error) {
    console.error('[APP_AUTH] Error getting authorized apps:', error)
    return []
  }
}