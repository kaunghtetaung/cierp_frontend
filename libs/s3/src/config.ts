/**
 * S3 Configuration
 * Loads MinIO configuration from environment variables
 *
 * Dual Endpoint Setup:
 * - Internal: Direct to MinIO server (server-side operations)
 * - Public: Via reverse proxy (client-side pre-signed URLs)
 */

import type { S3Config } from './types';

export function getS3Config(): S3Config {
  const endpoint = process.env.MINIO_ENDPOINT;
  const rootUser = process.env.MINIO_ROOT_USER;
  const rootPassword = process.env.MINIO_ROOT_PASSWORD;

  if (!endpoint) {
    throw new Error('Missing MINIO_ENDPOINT environment variable');
  }

  if (!rootUser || !rootPassword) {
    throw new Error('Missing MINIO_ROOT_USER or MINIO_ROOT_PASSWORD environment variables');
  }

  return {
    // Internal endpoint for server-side operations
    endpoint,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : undefined,
    useSSL: process.env.MINIO_USE_SSL === 'true',

    // Public endpoint for pre-signed URLs (via reverse proxy)
    publicEndpointTemplate: process.env.MINIO_PUBLIC_ENDPOINT_TEMPLATE,
    publicPort: process.env.MINIO_PUBLIC_PORT ? parseInt(process.env.MINIO_PUBLIC_PORT, 10) : 443,
    publicUseSSL: process.env.MINIO_PUBLIC_USE_SSL !== 'false',

    region: process.env.MINIO_REGION || 'us-east-1',
    accessKey: rootUser,
    secretKey: rootPassword,
    bucketStrategy: (process.env.MINIO_BUCKET_STRATEGY as 'per-tenant' | 'shared') || 'per-tenant',
  };
}

export function validateS3Config(config: S3Config): void {
  if (!config.endpoint) {
    throw new Error('S3 endpoint is required');
  }

  if (!config.accessKey || !config.secretKey) {
    throw new Error('S3 credentials are required');
  }
}

/**
 * Get bucket name for tenant
 * Based on bucket strategy (per-tenant or shared)
 * @param tenantSlug - Tenant slug (e.g., "um1ygn") - NOT the MongoDB ID
 * @param strategy - Bucket strategy
 */
export function getBucketName(tenantSlug: string, strategy: 'per-tenant' | 'shared' = 'per-tenant'): string {
  if (strategy === 'per-tenant') {
    return tenantSlug; // Use slug directly as bucket name
  }
  return 'tenants'; // Single shared bucket
}

/**
 * Build public endpoint URL for tenant
 * Replaces {tenantRootDomain} placeholder with actual domain
 */
export function buildPublicEndpoint(template: string | undefined, tenantRootDomain: string): string {
  if (!template) {
    throw new Error('MINIO_PUBLIC_ENDPOINT_TEMPLATE not configured');
  }
  return template.replace('{tenantRootDomain}', tenantRootDomain);
}
