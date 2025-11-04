/**
 * S3 Access Control - Role Definitions
 */

export enum S3Role {
  /** Organization Admin - Full access to entire tenant bucket */
  ORGANIZATION_ADMIN = 'organizationAdmin',

  /** Organization Member - Read common, read/write personal folders */
  ORGANIZATION_MEMBER = 'organizationMember',

  /** Department Admin - Full access to specific department folder */
  DEPARTMENT_ADMIN = 'departmentAdmin',

  /** Department Member - Read access to specific department folder */
  DEPARTMENT_MEMBER = 'departmentMember',
}

export interface UserS3Context {
  userId: string;           // JWT sub - for personal folder access
  tenantId: string;         // JWT tenantId - for bucket selection
  tenantRootDomain: string; // JWT tenantRootDomain - for building public URLs
  roles: S3Role[];          // JWT roles - array of role strings
  departmentIds: string[];  // JWT departmentIds - departments user belongs to
  organizationId?: string;  // JWT organizationId - optional
}

/**
 * Access Control Matrix
 *
 * Path Pattern                              | Write Access              | Read Access
 * ------------------------------------------|---------------------------|---------------------------
 * {tenant}/core/public/*                    | organizationAdmin         | Public (everyone)
 * {tenant}/publicWeb/public/*               | organizationAdmin         | Public (everyone)
 * {tenant}/core/private/common/*            | organizationAdmin         | organizationMember+
 * {tenant}/core/private/personal/{userId}/* | Owner + organizationAdmin | Owner + organizationAdmin
 * {tenant}/core/private/departments/{deptId}/* | departmentAdmin        | departmentMember+
 * {tenant}/core/private/library/*           | organizationAdmin         | organizationMember+ (watermarked)
 */

export interface AccessRule {
  pathPattern: string;
  writeRoles: S3Role[];
  readRoles: S3Role[];
  requiresOwnership?: boolean;      // For personal folders
  requiresDepartmentMatch?: boolean; // For department folders
  isPublic?: boolean;               // For public folders
}

export const S3_ACCESS_RULES: AccessRule[] = [
  // Public folders - anyone can read, only admin can write
  {
    pathPattern: '*/public/*',
    writeRoles: [S3Role.ORGANIZATION_ADMIN],
    readRoles: [],
    isPublic: true,
  },

  // Common private - admin writes, members read
  {
    pathPattern: 'core/private/common/*',
    writeRoles: [S3Role.ORGANIZATION_ADMIN],
    readRoles: [S3Role.ORGANIZATION_MEMBER, S3Role.ORGANIZATION_ADMIN],
  },

  // Personal folders - owner + admin
  {
    pathPattern: 'core/private/personal/*',
    writeRoles: [S3Role.ORGANIZATION_ADMIN], // Admin can write anywhere
    readRoles: [S3Role.ORGANIZATION_ADMIN],  // Admin can read anywhere
    requiresOwnership: true, // Owner has full access
  },

  // Department folders - department admin writes, members read
  {
    pathPattern: 'core/private/departments/*',
    writeRoles: [S3Role.DEPARTMENT_ADMIN, S3Role.ORGANIZATION_ADMIN],
    readRoles: [S3Role.DEPARTMENT_MEMBER, S3Role.DEPARTMENT_ADMIN, S3Role.ORGANIZATION_ADMIN],
    requiresDepartmentMatch: true,
  },

  // Library - admin writes, members read (with watermark)
  {
    pathPattern: 'core/private/library/*',
    writeRoles: [S3Role.ORGANIZATION_ADMIN],
    readRoles: [S3Role.ORGANIZATION_MEMBER, S3Role.ORGANIZATION_ADMIN],
  },
];

/**
 * Check if user has a specific role
 */
export function hasRole(userContext: UserS3Context, role: S3Role): boolean {
  return userContext.roles.includes(role);
}

/**
 * Check if user is organization admin (has full access)
 */
export function isOrganizationAdmin(userContext: UserS3Context): boolean {
  return hasRole(userContext, S3Role.ORGANIZATION_ADMIN);
}

/**
 * Check if user is organization member
 */
export function isOrganizationMember(userContext: UserS3Context): boolean {
  return hasRole(userContext, S3Role.ORGANIZATION_MEMBER) ||
         isOrganizationAdmin(userContext);
}

/**
 * Check if user is department admin for specific department
 */
export function isDepartmentAdmin(userContext: UserS3Context, departmentId: string): boolean {
  return (
    hasRole(userContext, S3Role.DEPARTMENT_ADMIN) &&
    userContext.departmentIds.includes(departmentId)
  ) || isOrganizationAdmin(userContext);
}

/**
 * Check if user is department member for specific department
 */
export function isDepartmentMember(userContext: UserS3Context, departmentId: string): boolean {
  return (
    hasRole(userContext, S3Role.DEPARTMENT_MEMBER) &&
    userContext.departmentIds.includes(departmentId)
  ) || isDepartmentAdmin(userContext, departmentId);
}

/**
 * Check if user is owner of a resource
 */
export function isOwner(userContext: UserS3Context, userId: string): boolean {
  return userContext.userId === userId;
}
