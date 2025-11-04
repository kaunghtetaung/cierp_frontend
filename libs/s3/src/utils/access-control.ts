/**
 * S3 Access Control Based on JWT Roles
 * Application-level enforcement of role-based access control
 */

export interface JWTRole {
  Organization: string;
  OrgSlug: string;
  Department: string;
  DeptSlug: string;
  Role: 'systemAdmin' | 'organizationAdmin' | 'departmentAdmin' | 'user';
}

export interface JWTClaims {
  sub: string;              // User ID
  username: string;         // Username
  roles: JWTRole[];         // User roles
  role: string;             // Primary role
  email?: string;
}

export interface AccessCheckParams {
  claims: JWTClaims;
  bucketName: string;       // Tenant slug / org slug
  filePath: string;         // File path in bucket (e.g., "core/private/common/file.pdf")
  operation: 'read' | 'write' | 'delete';
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user has access to a specific file path based on JWT roles
 */
export function checkS3Access(params: AccessCheckParams): AccessCheckResult {
  const { claims, bucketName, filePath, operation } = params;

  // Extract primary role
  const primaryRole = claims.roles[0];
  if (!primaryRole) {
    return { allowed: false, reason: 'No roles found in JWT' };
  }

  const { Role: roleType, OrgSlug: orgSlug, DeptSlug: deptSlug } = primaryRole;

  // System Admin: Full access to everything
  if (roleType === 'systemAdmin' && orgSlug === 'all') {
    return { allowed: true };
  }

  // Check if user's org matches the bucket
  if (orgSlug !== 'all' && orgSlug !== bucketName) {
    return {
      allowed: false,
      reason: `User org '${orgSlug}' does not match bucket '${bucketName}'`,
    };
  }

  // Parse file path
  const pathParts = filePath.split('/');
  const [app, visibility, ...rest] = pathParts;

  // Public files: Everyone can read
  if (visibility === 'public') {
    if (operation === 'read') {
      return { allowed: true };
    }
    // Write/delete requires at least departmentAdmin
    if (roleType === 'organizationAdmin' || roleType === 'departmentAdmin') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Public files: write requires admin role' };
  }

  // Personal files: Only owner has full access
  if (app === 'personal') {
    const [, username] = pathParts;
    if (username === claims.username) {
      return { allowed: true }; // User accessing their own files
    }
    return {
      allowed: false,
      reason: `Personal folder '${username}' belongs to different user`,
    };
  }

  // Private files access control
  if (visibility === 'private') {
    const [, , scope, ...scopeRest] = pathParts;

    // Organization Admin
    if (roleType === 'organizationAdmin') {
      // Full access to private/common/*
      if (scope === 'common') {
        return { allowed: true };
      }

      // Read-only access to private/departments/*
      if (scope === 'departments') {
        if (operation === 'read') {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Organization admin has read-only access to department folders',
        };
      }
    }

    // Department Admin
    if (roleType === 'departmentAdmin') {
      // Read-only access to private/common/*
      if (scope === 'common') {
        if (operation === 'read') {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Department admin has read-only access to common folder',
        };
      }

      // Full access to private/departments/{deptSlug}/*
      if (scope === 'departments') {
        const [targetDeptSlug] = scopeRest;
        if (targetDeptSlug === deptSlug) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: `Department admin can only access their department '${deptSlug}'`,
        };
      }
    }

    // Regular users: No access to private files
    return {
      allowed: false,
      reason: 'Insufficient permissions for private files',
    };
  }

  // Default deny
  return {
    allowed: false,
    reason: 'No matching access rule',
  };
}

/**
 * Get all accessible paths for a user based on their roles
 */
export function getAccessiblePaths(claims: JWTClaims, bucketName: string): string[] {
  const primaryRole = claims.roles[0];
  if (!primaryRole) return [];

  const { Role: roleType, OrgSlug: orgSlug, DeptSlug: deptSlug } = primaryRole;
  const paths: string[] = [];

  // System Admin: All paths
  if (roleType === 'systemAdmin' && orgSlug === 'all') {
    return ['*']; // All paths
  }

  // Check if user's org matches the bucket
  if (orgSlug !== 'all' && orgSlug !== bucketName) {
    return []; // No access to this bucket
  }

  // Everyone has access to public files
  paths.push('*/public/*');

  // Everyone has access to their own personal folder
  paths.push(`personal/${claims.username}/*`);

  // Organization Admin
  if (roleType === 'organizationAdmin') {
    paths.push('*/private/common/*');      // Full access
    paths.push('*/private/departments/*'); // Read-only (handled by checkS3Access)
  }

  // Department Admin
  if (roleType === 'departmentAdmin') {
    paths.push('*/private/common/*');                        // Read-only
    paths.push(`*/private/departments/${deptSlug}/*`);       // Full access
  }

  return paths;
}

/**
 * Check if operation is write operation
 */
export function isWriteOperation(operation: string): boolean {
  return ['write', 'delete', 'putObject', 'deleteObject', 'copyObject'].includes(operation);
}

/**
 * Extract operation type from S3 action
 */
export function getOperationType(action: string): 'read' | 'write' | 'delete' {
  if (action.includes('Get') || action.includes('List') || action.includes('Head')) {
    return 'read';
  }
  if (action.includes('Delete')) {
    return 'delete';
  }
  return 'write';
}
