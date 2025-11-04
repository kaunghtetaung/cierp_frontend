/**
 * S3 Library Type Definitions
 */

export interface S3Config {
  // Internal endpoint (server-side operations)
  endpoint: string;
  port?: number;
  useSSL: boolean;

  // Public endpoint (client-side pre-signed URLs via reverse proxy)
  publicEndpointTemplate?: string; // e.g., "storage.{tenantRootDomain}"
  publicPort?: number;
  publicUseSSL?: boolean;

  region: string;
  accessKey: string;
  secretKey: string;
  bucketStrategy: 'per-tenant' | 'shared';
  bucketName: string; // Bucket name (tenant slug for per-tenant, 'tenants' for shared)
}

export interface TenantS3Context {
  tenantId: string; // MongoDB ObjectID
  tenantSlug: string; // Tenant slug for bucket naming (e.g., "um1ygn")
  tenantRootDomain?: string; // e.g., "um1ygn.edu.mm" for building public URLs
  app: string; // App ID (e.g., "cpms", "isms", "core")
  basePath?: string;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

export interface S3ListResult {
  objects: S3Object[];
  folders: string[];
  prefix: string;
  continuationToken?: string;
}

export interface PreSignedUrlOptions {
  expiresIn: number; // seconds
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export interface S3Strategy {
  name: string;
  canHandle(path: string, operation: S3Operation): boolean;
  execute(context: S3OperationContext): Promise<unknown>;
}

export type S3Operation =
  | 'getObject'
  | 'putObject'
  | 'deleteObject'
  | 'listObjects'
  | 'getPreSignedUrl'
  | 'getMetadata';

export interface S3OperationContext {
  tenantId: string;
  app: 'core' | 'publicWeb';
  path: string;
  operation: S3Operation;
  userId?: string;
  userRoles?: string[];
  departmentIds?: string[];
  options?: Record<string, unknown>;
}

export interface PresignedUrlConfig {
  ttl: number; // seconds
  cache: boolean;
  optimize?: boolean;
}

export const RESOURCE_CONFIGS: Record<string, PresignedUrlConfig> = {
  logo: {
    ttl: 86400, // 24 hours
    cache: true,
    optimize: true,
  },
  banner: {
    ttl: 3600, // 1 hour
    cache: true,
    optimize: true,
  },
  'blog-image': {
    ttl: 21600, // 6 hours
    cache: true,
    optimize: true,
  },
  'user-upload': {
    ttl: 3600, // 1 hour
    cache: false,
    optimize: false,
  },
  default: {
    ttl: 3600, // 1 hour
    cache: true,
    optimize: false,
  },
};

// Re-export role types
export * from './roles';
