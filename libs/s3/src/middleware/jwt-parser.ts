/**
 * JWT Parser for Crystal Image Authentication System
 * Maps your JWT structure to S3 UserContext
 */

import type { UserS3Context } from '../types/roles';
import { S3Role } from '../types/roles';

/**
 * Your JWT structure from authentication system
 */
export interface CrystalImageJWT {
  sub: string;                    // User ID (MongoDB ObjectID)
  name?: string;
  username?: string;
  email?: string;
  role?: string;                  // Top-level role
  roles?: Array<{                 // Detailed role objects
    Organization: string;         // Organization ID or "*"
    Department: string;           // Department ID or "*"
    Role: string;                 // Role name
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
 * Map your system roles to S3 roles
 */
const ROLE_MAPPING: Record<string, S3Role> = {
  'systemAdmin': S3Role.ORGANIZATION_ADMIN,
  'organizationAdmin': S3Role.ORGANIZATION_ADMIN,
  'admin': S3Role.ORGANIZATION_ADMIN,

  'departmentAdmin': S3Role.DEPARTMENT_ADMIN,
  'deptAdmin': S3Role.DEPARTMENT_ADMIN,

  'departmentMember': S3Role.DEPARTMENT_MEMBER,
  'deptMember': S3Role.DEPARTMENT_MEMBER,
  'student': S3Role.DEPARTMENT_MEMBER,
  'faculty': S3Role.DEPARTMENT_MEMBER,

  'organizationMember': S3Role.ORGANIZATION_MEMBER,
  'member': S3Role.ORGANIZATION_MEMBER,
  'staff': S3Role.ORGANIZATION_MEMBER,
  'user': S3Role.ORGANIZATION_MEMBER,
};

/**
 * Create UserS3Context from your JWT
 *
 * @param jwt - Decoded JWT from your auth system
 * @param tenantId - From x-tenant-id header (MongoDB ObjectID)
 * @param tenantRootDomain - From host header
 */
export function parseJWTToS3Context(
  jwt: CrystalImageJWT,
  tenantId: string,
  tenantRootDomain: string
): UserS3Context {
  const roles = extractS3Roles(jwt);
  const departmentIds = extractDepartmentIds(jwt);

  return {
    userId: jwt.sub,
    tenantId,
    tenantRootDomain,
    roles,
    departmentIds,
  };
}

/**
 * Extract S3 roles from JWT
 */
function extractS3Roles(jwt: CrystalImageJWT): string[] {
  const roles = new Set<string>();

  // Check top-level role
  if (jwt.role) {
    // SystemAdmin gets full organization admin access
    if (jwt.role === 'systemAdmin') {
      roles.add(S3Role.ORGANIZATION_ADMIN);
      return Array.from(roles);
    }

    const mappedRole = ROLE_MAPPING[jwt.role];
    if (mappedRole) {
      roles.add(mappedRole);
    }
  }

  // Check roles array for detailed permissions
  if (jwt.roles && Array.isArray(jwt.roles)) {
    for (const roleObj of jwt.roles) {
      // Wildcard organization and department = organization admin
      if (roleObj.Organization === '*' && roleObj.Department === '*') {
        roles.add(S3Role.ORGANIZATION_ADMIN);
        continue;
      }

      // Map role name
      const mappedRole = ROLE_MAPPING[roleObj.Role];
      if (mappedRole) {
        roles.add(mappedRole);
      }

      // Infer role from context
      if (roleObj.Department !== '*') {
        // Has specific department
        if (roleObj.Role.toLowerCase().includes('admin')) {
          roles.add(S3Role.DEPARTMENT_ADMIN);
        } else {
          roles.add(S3Role.DEPARTMENT_MEMBER);
        }
      }
    }
  }

  // Ensure at least organizationMember
  if (roles.size === 0) {
    roles.add(S3Role.ORGANIZATION_MEMBER);
  }

  // If user has department roles, also give them organizationMember
  if (roles.has(S3Role.DEPARTMENT_ADMIN) || roles.has(S3Role.DEPARTMENT_MEMBER)) {
    roles.add(S3Role.ORGANIZATION_MEMBER);
  }

  return Array.from(roles);
}

/**
 * Extract department IDs from JWT
 */
function extractDepartmentIds(jwt: CrystalImageJWT): string[] {
  const departmentIds = new Set<string>();

  if (jwt.roles && Array.isArray(jwt.roles)) {
    for (const roleObj of jwt.roles) {
      // Add department if not wildcard
      if (roleObj.Department && roleObj.Department !== '*') {
        departmentIds.push(roleObj.Department);
      }
    }
  }

  return Array.from(departmentIds);
}

/**
 * Check if user is system admin
 */
export function isSystemAdmin(jwt: CrystalImageJWT): boolean {
  if (jwt.role === 'systemAdmin') {
    return true;
  }

  if (jwt.roles && Array.isArray(jwt.roles)) {
    return jwt.roles.some(
      (r) => r.Organization === '*' && r.Department === '*' && r.Role === 'systemAdmin'
    );
  }

  return false;
}

/**
 * Get user display name
 */
export function getUserDisplayName(jwt: CrystalImageJWT): string {
  if (jwt.localized_display_name?.en) {
    return jwt.localized_display_name.en;
  }
  if (jwt.name) {
    return jwt.name;
  }
  if (jwt.username) {
    return jwt.username;
  }
  return jwt.sub;
}

/**
 * Example JWT mappings:
 *
 * System Admin:
 * {
 *   sub: "68e0b62131f65aa7c3783438",
 *   role: "systemAdmin",
 *   roles: [{
 *     Organization: "*",
 *     Department: "*",
 *     Role: "systemAdmin"
 *   }]
 * }
 * → S3 Roles: ["organizationAdmin"]
 * → Department IDs: []
 * → Full access to everything
 *
 * Department Admin:
 * {
 *   sub: "user123",
 *   roles: [{
 *     Organization: "org1",
 *     Department: "dept-cs",
 *     Role: "departmentAdmin"
 *   }]
 * }
 * → S3 Roles: ["departmentAdmin", "organizationMember"]
 * → Department IDs: ["dept-cs"]
 * → Can manage dept-cs folder
 *
 * Department Member:
 * {
 *   sub: "student456",
 *   roles: [{
 *     Organization: "org1",
 *     Department: "dept-cs",
 *     Role: "student"
 *   }]
 * }
 * → S3 Roles: ["departmentMember", "organizationMember"]
 * → Department IDs: ["dept-cs"]
 * → Can read dept-cs folder
 *
 * Regular User:
 * {
 *   sub: "user789",
 *   role: "user"
 * }
 * → S3 Roles: ["organizationMember"]
 * → Department IDs: []
 * → Can access public, common, own personal folder
 */
