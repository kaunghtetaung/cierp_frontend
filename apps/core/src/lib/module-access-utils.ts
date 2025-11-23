// Module access control utilities
// Filters modules based on user role permissions

import type { ModuleSchema, User } from '@repo/types'

/**
 * Get user's primary role from role information
 * Handles both JWT formats: {Department, Role} and {departmentId, roles}
 */
function getUserPrimaryRole(user: User | null): string {
  if (!user?.roles || user.roles.length === 0) {
    return 'public'
  }

  // Handle JWT role structure - get the first role
  const roleInfo = user.roles[0]

  if (typeof roleInfo === 'string') {
    return roleInfo.toLowerCase()
  }

  if (typeof roleInfo === 'object' && roleInfo !== null) {
    // Handle {Department, Role} format
    if ('Role' in roleInfo && roleInfo.Role) {
      return roleInfo.Role.toLowerCase()
    }

    // Handle {departmentId, roles} format
    if ('roles' in roleInfo && Array.isArray(roleInfo.roles) && roleInfo.roles.length > 0) {
      return roleInfo.roles[0].toLowerCase()
    }
  }

  return 'public'
}

/**
 * Check if a module is a parent container (referenced by other modules as their parent)
 */
function isParentContainer(module: ModuleSchema, allModules: ModuleSchema[]): boolean {
  // Check if any other module references this module as their parent
  // Backend can send parentModule as either a string slug or an object with id
  return allModules.some(m => {
    const parentRef = (m as any).parentModule;
    if (!parentRef) return false;

    // Handle string-based parent reference (e.g., "setup")
    if (typeof parentRef === 'string') {
      return parentRef === module.slug;
    }

    // Handle object-based parent reference (e.g., { id: 299, slug: "setup" })
    if (typeof parentRef === 'object') {
      return parentRef.id === module.id || parentRef.slug === module.slug;
    }

    return false;
  });
}

/**
 * Check if a user has read access to a module based on role-based access control
 */
function hasModuleReadAccess(module: ModuleSchema, user: User | null, allModules: ModuleSchema[] = []): boolean {
  // Parent container modules (that are referenced by children) always have access
  // Their visibility is controlled by their children's access permissions
  if (isParentContainer(module, allModules)) {
    console.log(`[MODULE_ACCESS] Parent container module ${module.slug}, allowing access (has children)`)
    return true
  }

  // If no access policy defined, default to public access
  if (!module.moduleAccessPolicy?.accessPolicy) {
    console.log(`[MODULE_ACCESS] No access policy for module ${module.slug}, allowing access`)
    return true
  }

  const userRole = getUserPrimaryRole(user)
  const accessPolicy = module.moduleAccessPolicy.accessPolicy

  console.log(`[MODULE_ACCESS] Checking access for module ${module.slug}:`)
  console.log(`  - User role: ${userRole}`)
  console.log(`  - Available policies: ${Object.keys(accessPolicy).join(', ')}`)

  // Check if user's role has explicit policy
  if (accessPolicy[userRole]) {
    const hasReadAccess = accessPolicy[userRole].operation?.read?.allow === true
    console.log(`  - ${userRole} read access: ${hasReadAccess}`)
    return hasReadAccess
  }

  // Role-based fallback hierarchy
  const roleHierarchy: string[] = [
    'systemAdmin',
    'organizationAdmin',
    'departmentAdmin',
    'organizationMember',
    'customRole',
    'user',
    'public'
  ]

  // Find the closest matching role in hierarchy
  for (const fallbackRole of roleHierarchy) {
    if (accessPolicy[fallbackRole]) {
      const hasReadAccess = accessPolicy[fallbackRole].operation?.read?.allow === true
      console.log(`  - Fallback to ${fallbackRole} read access: ${hasReadAccess}`)
      return hasReadAccess
    }
  }

  // If no matching policy found, deny access
  console.log(`  - No matching policy found, denying access`)
  return false
}

/**
 * Filter modules array based on user's role permissions
 * Only returns modules where user has read access
 * Parent containers are always included if they have children
 */
export function filterModulesByUserAccess(
  modules: ModuleSchema[],
  user: User | null
): ModuleSchema[] {
  if (!modules || modules.length === 0) {
    return []
  }

  console.log(`[MODULE_FILTER] Filtering ${modules.length} modules for user:`, user?.email || 'anonymous')

  const filteredModules = modules.filter(module => {
    const hasAccess = hasModuleReadAccess(module, user, modules)

    if (hasAccess) {
      console.log(`[MODULE_FILTER] ✅ User has access to module: ${module.slug}`)
    } else {
      console.log(`[MODULE_FILTER] ❌ User denied access to module: ${module.slug}`)
    }

    return hasAccess
  })

  console.log(`[MODULE_FILTER] Filtered ${filteredModules.length} modules from ${modules.length} total`)

  return filteredModules
}

/**
 * Check if user has specific operation permission (create, update, delete) on a module
 */
function hasModuleOperationAccess(
  module: ModuleSchema,
  user: User | null,
  operation: 'create' | 'update' | 'softDelete' | 'hardDelete'
): boolean {
  // If no access policy defined, default to deny for operations
  if (!module.moduleAccessPolicy?.accessPolicy) {
    console.log(`[MODULE_OPERATION] No access policy for module ${module.slug}, denying ${operation}`)
    return false
  }

  const userRole = getUserPrimaryRole(user)
  const accessPolicy = module.moduleAccessPolicy.accessPolicy

  console.log(`[MODULE_OPERATION] Checking ${operation} access for module ${module.slug}:`)
  console.log(`  - User role: ${userRole}`)

  // Check if user's role has explicit policy
  if (accessPolicy[userRole]) {
    const operationPolicy = accessPolicy[userRole].operation?.[operation]
    let hasAccess = false

    if (typeof operationPolicy === 'boolean') {
      hasAccess = operationPolicy
    } else if (typeof operationPolicy === 'object' && operationPolicy?.allow === true) {
      hasAccess = true
    }

    console.log(`  - ${userRole} ${operation} access: ${hasAccess}`)
    return hasAccess
  }

  // Role-based fallback hierarchy
  const roleHierarchy: string[] = [
    'systemAdmin',
    'organizationAdmin',
    'departmentAdmin',
    'organizationMember',
    'customRole',
    'user',
    'public'
  ]

  // Find the closest matching role in hierarchy
  for (const fallbackRole of roleHierarchy) {
    if (accessPolicy[fallbackRole]) {
      const operationPolicy = accessPolicy[fallbackRole].operation?.[operation]
      let hasAccess = false

      if (typeof operationPolicy === 'boolean') {
        hasAccess = operationPolicy
      } else if (typeof operationPolicy === 'object' && operationPolicy?.allow === true) {
        hasAccess = true
      }

      console.log(`  - Fallback to ${fallbackRole} ${operation} access: ${hasAccess}`)
      return hasAccess
    }
  }

  // If no matching policy found, deny access
  console.log(`  - No matching policy found for ${operation}, denying access`)
  return false
}

/**
 * Check if user can create items in a module
 */
export function hasModuleCreateAccess(module: ModuleSchema, user: User | null): boolean {
  return hasModuleOperationAccess(module, user, 'create')
}

/**
 * Check if user can update items in a module
 */
export function hasModuleUpdateAccess(module: ModuleSchema, user: User | null): boolean {
  return hasModuleOperationAccess(module, user, 'update')
}

/**
 * Check if user can soft delete items in a module
 */
export function hasModuleSoftDeleteAccess(module: ModuleSchema, user: User | null): boolean {
  return hasModuleOperationAccess(module, user, 'softDelete')
}

/**
 * Check if user can hard delete items in a module
 */
export function hasModuleHardDeleteAccess(module: ModuleSchema, user: User | null): boolean {
  return hasModuleOperationAccess(module, user, 'hardDelete')
}

/**
 * Get all permissions for a user on a specific module
 */
export function getModulePermissions(module: ModuleSchema, user: User | null) {
  return {
    read: hasModuleReadAccess(module, user),
    create: hasModuleCreateAccess(module, user),
    update: hasModuleUpdateAccess(module, user),
    softDelete: hasModuleSoftDeleteAccess(module, user),
    hardDelete: hasModuleHardDeleteAccess(module, user)
  }
}

/**
 * Debug function to log user role information
 */
export function debugUserRoles(user: User | null): void {
  console.log('  - Email:', user?.email || 'N/A')
  console.log('  - Roles count:', user?.roles?.length || 0)
  console.log('  - Raw roles:', JSON.stringify(user?.roles, null, 2))
  console.log('  - Primary role:', getUserPrimaryRole(user))
}