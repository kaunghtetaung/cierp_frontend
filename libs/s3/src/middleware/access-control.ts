/**
 * S3 Access Control Middleware
 * Validates user permissions for S3 operations
 */

import type { UserS3Context, AccessRule } from '../types/roles';
import {
  S3Role,
  S3_ACCESS_RULES,
  isOrganizationAdmin,
  isOrganizationMember,
  isDepartmentAdmin,
  isDepartmentMember,
  isOwner,
  hasRole,
} from '../types/roles';

export type S3Operation = 'read' | 'write' | 'delete' | 'list';

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Main access control function
 * Checks if user can perform operation on given S3 path
 */
export function validateS3Access(
  userContext: UserS3Context,
  operation: S3Operation,
  path: string
): AccessCheckResult {
  // Organization admin has full access to everything
  if (isOrganizationAdmin(userContext)) {
    return { allowed: true, reason: 'Organization admin has full access' };
  }

  // Normalize path (remove leading/trailing slashes)
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  // Find matching access rule
  const rule = findMatchingRule(normalizedPath);

  if (!rule) {
    return { allowed: false, reason: 'No matching access rule found' };
  }

  // Check public access
  if (rule.isPublic && (operation === 'read' || operation === 'list')) {
    return { allowed: true, reason: 'Public read access' };
  }

  // Check write access (includes delete)
  if (operation === 'write' || operation === 'delete') {
    return checkWriteAccess(userContext, normalizedPath, rule);
  }

  // Check read access (includes list)
  if (operation === 'read' || operation === 'list') {
    return checkReadAccess(userContext, normalizedPath, rule);
  }

  return { allowed: false, reason: 'Unknown operation' };
}

/**
 * Find matching access rule for path
 */
function findMatchingRule(path: string): AccessRule | null {
  for (const rule of S3_ACCESS_RULES) {
    if (matchesPattern(path, rule.pathPattern)) {
      return rule;
    }
  }
  return null;
}

/**
 * Check if path matches pattern (supports wildcards)
 */
function matchesPattern(path: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\*/g, '[^/]+')  // * matches any non-slash characters
    .replace(/\*\*/g, '.*');   // ** matches anything including slashes

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Check write access
 */
function checkWriteAccess(
  userContext: UserS3Context,
  path: string,
  rule: AccessRule
): AccessCheckResult {
  // Check ownership for personal folders
  if (rule.requiresOwnership) {
    const userId = extractUserIdFromPath(path);
    if (userId && isOwner(userContext, userId)) {
      return { allowed: true, reason: 'Owner has write access to personal folder' };
    }
  }

  // Check department match for department folders
  if (rule.requiresDepartmentMatch) {
    const deptId = extractDepartmentIdFromPath(path);
    if (deptId && isDepartmentAdmin(userContext, deptId)) {
      return { allowed: true, reason: 'Department admin has write access' };
    }
  }

  // Check if user has required write role
  for (const role of rule.writeRoles) {
    if (hasRole(userContext, role)) {
      return { allowed: true, reason: `User has required write role: ${role}` };
    }
  }

  return { allowed: false, reason: 'User does not have write permission' };
}

/**
 * Check read access
 */
function checkReadAccess(
  userContext: UserS3Context,
  path: string,
  rule: AccessRule
): AccessCheckResult {
  // Check ownership for personal folders
  if (rule.requiresOwnership) {
    const userId = extractUserIdFromPath(path);
    if (userId && isOwner(userContext, userId)) {
      return { allowed: true, reason: 'Owner has read access to personal folder' };
    }
  }

  // Check department match for department folders
  if (rule.requiresDepartmentMatch) {
    const deptId = extractDepartmentIdFromPath(path);
    if (deptId && isDepartmentMember(userContext, deptId)) {
      return { allowed: true, reason: 'Department member has read access' };
    }
  }

  // Check if user has required read role
  for (const role of rule.readRoles) {
    if (hasRole(userContext, role)) {
      return { allowed: true, reason: `User has required read role: ${role}` };
    }
  }

  return { allowed: false, reason: 'User does not have read permission' };
}

/**
 * Extract user ID from personal folder path
 * e.g., "core/private/personal/user123/file.pdf" -> "user123"
 */
function extractUserIdFromPath(path: string): string | null {
  const match = path.match(/\/personal\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Extract department ID from department folder path
 * e.g., "core/private/departments/dept-cs/file.pdf" -> "dept-cs"
 */
function extractDepartmentIdFromPath(path: string): string | null {
  const match = path.match(/\/departments\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Validate access and throw error if denied
 */
export function requireS3Access(
  userContext: UserS3Context,
  operation: S3Operation,
  path: string
): void {
  const result = validateS3Access(userContext, operation, path);

  if (!result.allowed) {
    throw new Error(`Access denied: ${result.reason || 'Insufficient permissions'}`);
  }
}

/**
 * Helper to create UserS3Context from JWT and tenant headers
 *
 * @param jwt - Decoded JWT token (contains userId, roles, departmentIds)
 * @param tenantId - Tenant ID from x-tenant-id header (MongoDB ObjectID)
 * @param tenantRootDomain - Root domain extracted from host header
 */
export function createUserContextFromJWT(
  jwt: any,
  tenantId: string,
  tenantRootDomain: string
): UserS3Context {
  return {
    userId: jwt.sub || jwt.userId || jwt.user_id,
    tenantId, // From x-tenant-id header
    tenantRootDomain, // From host header
    roles: Array.isArray(jwt.roles) ? jwt.roles : (jwt.role ? [jwt.role] : []),
    departmentIds: Array.isArray(jwt.departmentIds)
      ? jwt.departmentIds
      : (Array.isArray(jwt.department_ids) ? jwt.department_ids : []),
    organizationId: jwt.organizationId || jwt.organization_id,
  };
}
