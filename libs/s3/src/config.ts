/**
 * S3 Configuration
 * Loads MinIO configuration from config service with fallback to environment variables
 *
 * Dual Endpoint Setup:
 * - Internal: Direct to MinIO server (server-side operations)
 * - Public: Via reverse proxy (client-side pre-signed URLs)
 */

import { configClient } from '@repo/config';
import type { S3Config } from './types';

export async function getS3Config(): Promise<S3Config> {
  // Load internal endpoint config
  const endpoint = await configClient.get('minio.internal.endpoint', process.env.MINIO_ENDPOINT);
  const port = await configClient.get('minio.internal.port', process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : undefined);
  const useSSL = await configClient.get('minio.internal.useSSL', process.env.MINIO_USE_SSL === 'true');

  // Load public endpoint config
  const publicEndpointTemplate = await configClient.get('minio.public.endpointTemplate', process.env.MINIO_PUBLIC_ENDPOINT_TEMPLATE);
  const publicPort = await configClient.get('minio.public.port', process.env.MINIO_PUBLIC_PORT ? parseInt(process.env.MINIO_PUBLIC_PORT, 10) : 443);
  const publicUseSSL = await configClient.get('minio.public.useSSL', process.env.MINIO_PUBLIC_USE_SSL !== 'false');

  // Load credentials
  const rootUser = await configClient.get('minio.credentials.rootUser', process.env.MINIO_ROOT_USER);
  const rootPassword = await configClient.get('minio.credentials.rootPassword', process.env.MINIO_ROOT_PASSWORD);

  // Load other settings
  const region = await configClient.get('minio.region', process.env.MINIO_REGION || 'us-east-1');
  const bucketStrategy = await configClient.get('minio.bucketStrategy', process.env.MINIO_BUCKET_STRATEGY || 'per-tenant') as 'per-tenant' | 'shared';

  if (!endpoint) {
    throw new Error('Missing MINIO_ENDPOINT - not found in config service or environment variables');
  }

  if (!rootUser || !rootPassword) {
    throw new Error('Missing MINIO_ROOT_USER or MINIO_ROOT_PASSWORD - not found in config service or environment variables');
  }

  return {
    // Internal endpoint for server-side operations
    endpoint,
    port,
    useSSL,

    // Public endpoint for pre-signed URLs (via reverse proxy)
    publicEndpointTemplate,
    publicPort,
    publicUseSSL,

    region,
    accessKey: rootUser,
    secretKey: rootPassword,
    bucketStrategy,
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
