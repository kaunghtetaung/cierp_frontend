/**
 * Base Strategy for S3 Access Control
 */

import type { S3Strategy, S3Operation, S3OperationContext } from '../types';

export abstract class BaseS3Strategy implements S3Strategy {
  abstract name: string;

  /**
   * Determine if this strategy can handle the given operation
   */
  abstract canHandle(path: string, operation: S3Operation): boolean;

  /**
   * Execute the operation
   */
  abstract execute(context: S3OperationContext): Promise<unknown>;

  /**
   * Validate user permissions
   */
  protected validatePermissions(context: S3OperationContext): boolean {
    // Override in subclasses
    return true;
  }

  /**
   * Check if user has a specific role
   */
  protected hasRole(context: S3OperationContext, role: string): boolean {
    return context.userRoles?.includes(role) || false;
  }

  /**
   * Check if user is organization admin
   */
  protected isOrganizationAdmin(context: S3OperationContext): boolean {
    return this.hasRole(context, 'organizationAdmin');
  }

  /**
   * Check if user is organization member
   */
  protected isOrganizationMember(context: S3OperationContext): boolean {
    return (
      this.hasRole(context, 'organizationMember') || this.isOrganizationAdmin(context)
    );
  }

  /**
   * Check if user is department admin
   */
  protected isDepartmentAdmin(context: S3OperationContext): boolean {
    return this.hasRole(context, 'departmentAdmin');
  }

  /**
   * Check if user is department member of specific department
   */
  protected isDepartmentMember(context: S3OperationContext, departmentId: string): boolean {
    return context.departmentIds?.includes(departmentId) || false;
  }

  /**
   * Check if user is the owner of the resource
   */
  protected isOwner(context: S3OperationContext, userId: string): boolean {
    return context.userId === userId;
  }

  /**
   * Extract department ID from path
   * e.g., "private/departments/dept123/file.pdf" -> "dept123"
   */
  protected extractDepartmentId(path: string): string | null {
    const match = path.match(/\/departments\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract user ID from path
   * e.g., "private/personal/user123/file.pdf" -> "user123"
   */
  protected extractUserId(path: string): string | null {
    const match = path.match(/\/personal\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if operation is read-only
   */
  protected isReadOperation(operation: S3Operation): boolean {
    return ['getObject', 'listObjects', 'getPreSignedUrl', 'getMetadata'].includes(operation);
  }

  /**
   * Check if operation is write
   */
  protected isWriteOperation(operation: S3Operation): boolean {
    return ['putObject', 'deleteObject'].includes(operation);
  }
}
