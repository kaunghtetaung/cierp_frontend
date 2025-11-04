/**
 * Pre-signed URL Strategy
 * For public resources like images, logos, banners
 */

import type { S3Operation, S3OperationContext, PresignedUrlConfig } from '../types';
import { RESOURCE_CONFIGS } from '../types';
import { BaseS3Strategy } from './base-strategy';
import { TenantS3Client } from '../client/tenant-s3-client';
import { getResourceType } from '../utils/path-resolver';
import type { RedisCache } from '@repo/cache';

export class PreSignedUrlStrategy extends BaseS3Strategy {
  name = 'PreSignedUrlStrategy';
  private cache?: RedisCache;

  constructor(cache?: RedisCache) {
    super();
    this.cache = cache;
  }

  /**
   * Can handle public resources and standard files (JPG, PNG, etc.)
   */
  canHandle(path: string, operation: S3Operation): boolean {
    // Handle public folders
    if (path.includes('/public/')) {
      return true;
    }

    // Handle common image/document types
    const imagePDFExtensions = /\.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx)$/i;
    if (imagePDFExtensions.test(path)) {
      // Exclude library PDFs which need special handling
      if (path.includes('/library/') && path.endsWith('.pdf')) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Execute the operation
   */
  async execute(context: S3OperationContext): Promise<unknown> {
    const { tenantId, app, path, operation } = context;

    // Create tenant-scoped client
    const client = new TenantS3Client({ tenantId, app });

    switch (operation) {
      case 'getPreSignedUrl':
        return this.getPreSignedUrl(client, path, context);

      case 'getObject':
        // For direct download, generate pre-signed URL
        return this.getPreSignedUrl(client, path, context);

      case 'listObjects':
        return this.listObjectsWithUrls(client, path, context);

      case 'putObject':
        // For uploads, return pre-signed PUT URL
        return this.getPreSignedPutUrl(client, path, context);

      default:
        throw new Error(`Operation ${operation} not supported by PreSignedUrlStrategy`);
    }
  }

  /**
   * Get pre-signed URL with caching
   */
  private async getPreSignedUrl(
    client: TenantS3Client,
    path: string,
    context: S3OperationContext
  ): Promise<string> {
    const resourceType = getResourceType(path);
    const config = RESOURCE_CONFIGS[resourceType] || RESOURCE_CONFIGS.default;

    // Check cache if enabled
    if (config.cache && this.cache) {
      const cacheKey = this.buildCacheKey(context.tenantId, context.app, path);
      const cached = await this.cache.get<string>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    // Generate pre-signed URL
    const url = await client.getPreSignedUrl(path, {
      expiresIn: config.ttl,
    });

    // Cache if enabled
    if (config.cache && this.cache) {
      const cacheKey = this.buildCacheKey(context.tenantId, context.app, path);
      // Cache for slightly less than TTL to ensure URL is always valid
      await this.cache.set(cacheKey, url, config.ttl - 60);
    }

    return url;
  }

  /**
   * Get pre-signed PUT URL for client-side uploads
   */
  private async getPreSignedPutUrl(
    client: TenantS3Client,
    path: string,
    context: S3OperationContext
  ): Promise<string> {
    const contentType = context.options?.contentType as string | undefined;
    const expiresIn = (context.options?.expiresIn as number | undefined) || 3600;

    return client.getPreSignedPutUrl(path, contentType, expiresIn);
  }

  /**
   * List objects and include pre-signed URLs
   */
  private async listObjectsWithUrls(
    client: TenantS3Client,
    path: string,
    context: S3OperationContext
  ): Promise<unknown> {
    const result = await client.listObjects(path);

    // Generate URLs for each object
    const objectsWithUrls = await Promise.all(
      result.objects.map(async obj => {
        const url = await this.getPreSignedUrl(client, obj.key, context);
        return {
          ...obj,
          url,
        };
      })
    );

    return {
      ...result,
      objects: objectsWithUrls,
    };
  }

  /**
   * Build cache key for pre-signed URLs
   */
  private buildCacheKey(tenantId: string, app: string, path: string): string {
    return `presigned:${tenantId}:${app}:${path}`;
  }

  /**
   * Get config for resource type
   */
  static getConfigForResource(path: string): PresignedUrlConfig {
    const resourceType = getResourceType(path);
    return RESOURCE_CONFIGS[resourceType] || RESOURCE_CONFIGS.default;
  }
}
