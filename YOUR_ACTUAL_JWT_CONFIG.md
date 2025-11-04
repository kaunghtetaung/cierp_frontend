/**
 * JWT Parser for Your Specific JWT Structure
 * Extracts user context from your authentication system's JWT
 */

import type { UserS3Context, S3Role } from '../types/roles';

/**
 * Your JWT structure
 */
export interface YourJWT {
  sub: string;                    // User ID (MongoDB ObjectID)
  name?: string;
  username?: string;
  email?: string;
  role?: string;                  // Top-level role (systemAdmin, etc.)
  roles?: Array<{                 // Role objects with Organization/Department
    Organization: string;
    Department: string;
    Role: string;
    _id: string;
  }>;
  profileState?: string;
  localized_display_name?: {
    en?: string;
    mm?: string;
  };
  aud?: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

/**
 * Map your role names to S3 roles
 */
const ROLE_MAPPING: Record<string, S3Role> = {
  // Your system roles → S3 roles
  'systemAdmin': 'organizationAdmin',
  'organizationAdmin': 'organizationAdmin',
  'departmentAdmin': 'departmentAdmin',
  'departmentMember': 'departmentMember',
  'organizationMember': 'organizationMember',

  // Add more mappings as needed
  'admin': 'organizationAdmin',
  'staff': 'organizationMember',
  'student': 'organizationMember',
  'faculty': 'departmentMember',
};

/**
 * Create UserS3Context from your JWT structure
 */
export function createUserS3ContextFromYourJWT(
  jwt: YourJWT,
  tenantId: string,
  tenantRootDomain: string
): UserS3Context {
  // Extract roles
  const s3Roles = extractS3Roles(jwt);

  // Extract department IDs
  const departmentIds = extractDepartmentIds(jwt);

  return {
    userId: jwt.sub,
    tenantId,
    tenantRootDomain,
    roles: s3Roles,
    departmentIds,
  };
}

/**
 * Extract S3 roles from JWT
 */
function extractS3Roles(jwt: YourJWT): string[] {
  const roles: string[] = [];

  // Check top-level role
  if (jwt.role) {
    const mappedRole = ROLE_MAPPING[jwt.role];
    if (mappedRole) {
      roles.push(mappedRole);
    }
  }

  // Check roles array
  if (jwt.roles && Array.isArray(jwt.roles)) {
    for (const roleObj of jwt.roles) {
      const mappedRole = ROLE_MAPPING[roleObj.Role];

      if (mappedRole) {
        roles.push(mappedRole);
      }

      // Special handling for wildcard organization (*) - means organization admin
      if (roleObj.Organization === '*' && roleObj.Department === '*') {
        roles.push('organizationAdmin');
      }
      // Department admin - specific department
      else if (roleObj.Department !== '*' && roleObj.Role.includes('Admin')) {
        roles.push('departmentAdmin');
      }
      // Department member - specific department
      else if (roleObj.Department !== '*') {
        roles.push('departmentMember');
      }
    }
  }

  // Remove duplicates and ensure at least organizationMember
  const uniqueRoles = [...new Set(roles)];

  if (uniqueRoles.length === 0) {
    uniqueRoles.push('organizationMember'); // Default role
  }

  return uniqueRoles;
}

/**
 * Extract department IDs from JWT roles
 */
function extractDepartmentIds(jwt: YourJWT): string[] {
  const departmentIds: string[] = [];

  if (jwt.roles && Array.isArray(jwt.roles)) {
    for (const roleObj of jwt.roles) {
      // Skip wildcard departments
      if (roleObj.Department && roleObj.Department !== '*') {
        departmentIds.push(roleObj.Department);
      }
    }
  }

  return [...new Set(departmentIds)]; // Remove duplicates
}

/**
 * Check if user is system admin (has wildcard access)
 */
export function isSystemAdmin(jwt: YourJWT): boolean {
  if (jwt.role === 'systemAdmin') {
    return true;
  }

  if (jwt.roles && Array.isArray(jwt.roles)) {
    return jwt.roles.some(
      r => r.Organization === '*' && r.Department === '*'
    );
  }

  return false;
}
