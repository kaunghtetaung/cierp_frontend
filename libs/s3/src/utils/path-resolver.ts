/**
 * S3 Path Resolution Utilities
 * Handles tenant-scoped path construction and validation
 */

import type { TenantS3Context } from '../types';

/**
 * Build full S3 key from tenant context and relative path
 * For per-tenant buckets:
 * - App-specific: {app}/{basePath}/{relativePath}
 * - Personal: personal/{username}/{relativePath} (NOT app-specific)
 */
export function buildS3Key(context: TenantS3Context, relativePath: string): string {
  const { app, basePath } = context;

  // Remove leading/trailing slashes
  const cleanRelativePath = relativePath.replace(/^\/+|\/+$/g, '');
  const cleanBasePath = basePath?.replace(/^\/+|\/+$/g, '');

  // Check if this is a personal folder path
  // Personal folders start with "personal" and are NOT app-specific
  if (cleanBasePath === 'personal' || cleanBasePath?.startsWith('personal/')) {
    // Personal path: personal/{username}/{relativePath}
    const parts = [cleanBasePath];

    if (cleanRelativePath) {
      parts.push(cleanRelativePath);
    }

    return parts.join('/');
  }

  // Build app-specific path: {app}/{basePath}/{relativePath}
  // Note: Tenant ID is NOT included in the key for per-tenant buckets
  // The bucket itself is tenant-scoped
  const parts = [app];

  if (cleanBasePath) {
    parts.push(cleanBasePath);
  }

  if (cleanRelativePath) {
    parts.push(cleanRelativePath);
  }

  return parts.join('/');
}

/**
 * Extract tenant ID from S3 key
 */
export function extractTenantId(key: string): string | null {
  const parts = key.split('/');
  return parts[0] || null;
}

/**
 * Extract app from S3 key
 */
export function extractApp(key: string): 'core' | 'publicWeb' | null {
  const parts = key.split('/');
  const app = parts[1];

  if (app === 'core' || app === 'publicWeb') {
    return app;
  }

  return null;
}

/**
 * Validate path doesn't contain directory traversal attempts
 */
export function validatePath(path: string): boolean {
  // Check for directory traversal
  if (path.includes('..')) {
    return false;
  }

  // Check for absolute paths
  if (path.startsWith('/')) {
    return false;
  }

  // Check for null bytes
  if (path.includes('\0')) {
    return false;
  }

  return true;
}

/**
 * Get folder path from file key
 */
export function getFolderPath(key: string): string {
  const lastSlashIndex = key.lastIndexOf('/');
  return lastSlashIndex > 0 ? key.substring(0, lastSlashIndex) : '';
}

/**
 * Get file name from key
 */
export function getFileName(key: string): string {
  const lastSlashIndex = key.lastIndexOf('/');
  return lastSlashIndex >= 0 ? key.substring(lastSlashIndex + 1) : key;
}

/**
 * Join path segments safely
 */
export function joinPath(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .map(s => s.replace(/^\/+|\/+$/g, ''))
    .join('/');
}

/**
 * Check if path matches a pattern (for permission checking)
 */
export function matchesPattern(path: string, pattern: string): boolean {
  // Simple glob pattern matching
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Determine resource type from path for config lookup
 */
export function getResourceType(key: string): string {
  const fileName = getFileName(key);
  const path = key.toLowerCase();

  // Check specific patterns
  if (path.includes('/logo')) return 'logo';
  if (path.includes('/banner')) return 'banner';
  if (path.includes('/blog')) return 'blog-image';
  if (path.includes('/upload')) return 'user-upload';

  // Check by extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp') {
    return 'image';
  }

  return 'default';
}
