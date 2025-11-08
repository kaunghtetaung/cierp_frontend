/**
 * Tenant-Scoped S3 Client
 * Automatically prefixes all operations with tenant context
 */

import type {
  TenantS3Context,
  S3Object,
  S3ListResult,
  PreSignedUrlOptions,
  UploadOptions,
  S3Config,
} from '../types';
import { S3Client } from './s3-client';
import { buildS3Key, validatePath, getFileName, getFolderPath } from '../utils/path-resolver';
import { getS3Config } from '../config';

export class TenantS3Client {
  private client: S3Client;
  private context: TenantS3Context;
  private initializationPromise: Promise<void> | null = null;

  constructor(context: TenantS3Context, client: S3Client) {
    this.context = context;
    this.client = client;

    // Initialize bucket in background (only runs once per bucket)
    this.initializationPromise = this.ensureBucketInitialized();
  }

  /**
   * Create TenantS3Client instance from config service
   * This static factory method loads config asynchronously
   */
  static async create(context: TenantS3Context, client?: S3Client): Promise<TenantS3Client> {
    let finalClient: S3Client;

    if (client) {
      finalClient = client;
    } else {
      const baseConfig = await getS3Config();
      const tenantConfig: S3Config = {
        ...baseConfig,
        bucketName: context.tenantSlug, // Use tenant slug as bucket name
      };
      finalClient = new S3Client(tenantConfig);
    }

    return new TenantS3Client(context, finalClient);
  }

  /**
   * Ensure bucket is initialized before any operations
   * Intelligently creates bucket + current app folder structure on first use
   */
  private async ensureBucketInitialized(): Promise<void> {
    try {
      const bucketName = this.context.tenantSlug; // Use slug directly as bucket name
      const currentApp = this.context.app;

      console.log(`[TenantS3Client] Ensuring bucket and app structure exists: ${bucketName}/${currentApp}`);

      // Initialize bucket with current app
      // This will create bucket if needed + ensure current app folder structure exists
      await this.client.initializeTenantBucket(bucketName, [currentApp]);
    } catch (error) {
      console.error('[TenantS3Client] Failed to initialize bucket:', error);
      // Don't throw - let individual operations fail if needed
    }
  }

  /**
   * Wait for initialization to complete
   */
  private async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Ensure personal folder exists if accessing personal storage
   */
  private async ensurePersonalFolderIfNeeded(): Promise<void> {
    const { basePath } = this.context;

    // Check if this is a personal folder path (personal/{username})
    if (basePath?.startsWith('personal/')) {
      const username = basePath.split('/')[1];
      if (username) {
        await this.client.ensurePersonalFolder(this.context.tenantSlug, username);
      }
    }
  }

  /**
   * Build full S3 key with tenant context
   */
  private buildKey(relativePath: string): string {
    if (!validatePath(relativePath)) {
      throw new Error(`Invalid path: ${relativePath}`);
    }
    return buildS3Key(this.context, relativePath);
  }

  /**
   * Upload a file
   * @param skipPathResolution - If true, use relativePath as-is without building full key
   */
  async putObject(
    relativePath: string,
    body: Buffer | Uint8Array | string,
    options?: UploadOptions,
    skipPathResolution?: boolean
  ): Promise<string> {
    await this.waitForInitialization();
    await this.ensurePersonalFolderIfNeeded();
    const key = skipPathResolution ? relativePath : this.buildKey(relativePath);
    await this.client.putObject(key, body, options);
    return key;
  }

  /**
   * Download a file
   */
  async getObject(relativePath: string): Promise<Buffer> {
    const key = this.buildKey(relativePath);
    return this.client.getObject(key);
  }

  /**
   * Delete a file
   */
  async deleteObject(relativePath: string): Promise<void> {
    const key = this.buildKey(relativePath);
    await this.client.deleteObject(key);
  }

  /**
   * Delete multiple files
   */
  async deleteObjects(relativePaths: string[]): Promise<void> {
    const keys = relativePaths.map(path => this.buildKey(path));
    await this.client.deleteObjects(keys);
  }

  /**
   * List objects in current context with optional sub-path
   * Automatically filters out hidden files/folders (starting with ".")
   */
  async listObjects(
    relativePath: string = '',
    options?: { maxKeys?: number; continuationToken?: string }
  ): Promise<S3ListResult> {
    await this.waitForInitialization();
    await this.ensurePersonalFolderIfNeeded();
    const prefix = this.buildKey(relativePath);
    // Ensure prefix ends with / for folder listing
    const normalizedPrefix = prefix && !prefix.endsWith('/') ? `${prefix}/` : prefix;

    const result = await this.client.listObjects(normalizedPrefix, {
      ...options,
      delimiter: '/',
    });

    // Strip tenant context from keys for cleaner API
    const contextPrefix = buildS3Key(this.context, '');
    const stripPrefix = (key: string) => {
      if (key.startsWith(contextPrefix)) {
        return key.substring(contextPrefix.length + 1); // +1 for the trailing /
      }
      return key;
    };

    // Filter out hidden files/folders (starting with ".")
    const isHidden = (name: string) => {
      const fileName = name.split('/').pop() || name;
      return fileName.startsWith('.');
    };

    return {
      objects: result.objects
        .map(obj => ({
          ...obj,
          key: stripPrefix(obj.key),
        }))
        .filter(obj => !isHidden(obj.key)), // Hide files starting with "."
      folders: result.folders
        .map(folder => stripPrefix(folder))
        .filter(folder => !isHidden(folder)), // Hide folders starting with "."
      prefix: stripPrefix(result.prefix),
      continuationToken: result.continuationToken,
    };
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(relativePath: string): Promise<S3Object> {
    const key = this.buildKey(relativePath);
    const metadata = await this.client.getObjectMetadata(key);

    // Strip tenant context from key
    const contextPrefix = buildS3Key(this.context, '');
    return {
      ...metadata,
      key: metadata.key.startsWith(contextPrefix)
        ? metadata.key.substring(contextPrefix.length + 1)
        : metadata.key,
    };
  }

  /**
   * Generate URL for file access
   *
   * PUBLIC FILES (/public/* paths):
   *   - Returns simple public URL without signature
   *   - URL format: https://storage.{domain}/{app}/public/{file}
   *   - No expiration, accessible by anyone
   *   - Reverse proxy automatically adds bucket name to path
   *   - Example: https://storage.um1ygn.edu.mm/core/public/logo.png
   *
   * PRIVATE FILES (/private/* paths):
   *   - Returns AWS pre-signed URL with temporary signature
   *   - URL format: https://...?X-Amz-Signature=...&X-Amz-Expires=3600
   *   - Expires after specified time (default 1 hour)
   *   - Example: https://storage.um1ygn.edu.mm/core/private/doc.pdf?X-Amz-Signature=abc123...
   *
   * @param skipPathResolution - If true, use relativePath as-is without building full key
   */
  async getPreSignedUrl(
    relativePath: string,
    options?: PreSignedUrlOptions,
    skipPathResolution?: boolean
  ): Promise<string> {
    const key = skipPathResolution ? relativePath : this.buildKey(relativePath);

    // PUBLIC FILES: Return simple URL (no signature)
    // Check if path contains '/public/' OR starts with 'public/'
    const isPublicPath = key.includes('/public/') || key.startsWith('public/');

    if (isPublicPath && this.context.tenantRootDomain) {
      const publicEndpoint = `storage.${this.context.tenantRootDomain}`;
      const protocol = process.env.MINIO_PUBLIC_USE_SSL !== 'false' ? 'https' : 'http';
      const port = process.env.MINIO_PUBLIC_PORT;
      const portSuffix = (port && port !== '443' && port !== '80') ? `:${port}` : '';

      // Encode the key properly to handle spaces and special characters
      // Split by '/' to encode each segment, preserving the path structure
      const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');

      // Clean public URL without bucket name (reverse proxy adds it)
      // https://storage.um1ygn.edu.mm/core/public/file.jpg
      return `${protocol}://${publicEndpoint}${portSuffix}/${encodedKey}`;
    }

    // PRIVATE FILES: Return pre-signed URL with signature
    // Generate signed URL with public endpoint so signature is valid through reverse proxy
    if (this.context.tenantRootDomain) {
      const protocol = process.env.MINIO_PUBLIC_USE_SSL !== 'false' ? 'https' : 'http';
      const port = process.env.MINIO_PUBLIC_PORT;
      const portSuffix = (port && port !== '443' && port !== '80') ? `:${port}` : '';

      // Build public endpoint URL
      const publicEndpoint = `${protocol}://storage.${this.context.tenantRootDomain}${portSuffix}`;

      // Generate signed URL using public endpoint
      // This ensures the signature is calculated for the public URL, making it valid
      const signedUrl = await this.client.getPreSignedUrl(key, options, publicEndpoint);

      // Remove bucket name from the URL path for reverse proxy
      // From: https://storage.um1ygn.edu.mm/um1/cpms/private/...?signature
      // To:   https://storage.um1ygn.edu.mm/cpms/private/...?signature
      try {
        const url = new URL(signedUrl);
        const bucketName = this.context.tenantSlug;

        // Check if path starts with /bucketName/
        if (url.pathname.startsWith(`/${bucketName}/`)) {
          // Remove the bucket name prefix
          url.pathname = url.pathname.substring(bucketName.length + 1);
          return url.toString();
        }

        return signedUrl;
      } catch (error) {
        console.error('[TenantS3Client] Failed to transform signed URL:', error);
        return signedUrl;
      }
    }

    // Fallback: generate with internal endpoint
    return await this.client.getPreSignedUrl(key, options);
  }

  /**
   * Generate pre-signed PUT URL for client-side uploads
   */
  async getPreSignedPutUrl(
    relativePath: string,
    contentType?: string,
    expiresIn?: number
  ): Promise<string> {
    const key = this.buildKey(relativePath);
    return this.client.getPreSignedPutUrl(key, contentType, expiresIn);
  }

  /**
   * Copy object within tenant context
   */
  async copyObject(sourceRelativePath: string, destRelativePath: string): Promise<void> {
    const sourceKey = this.buildKey(sourceRelativePath);
    const destKey = this.buildKey(destRelativePath);
    await this.client.copyObject(sourceKey, destKey);
  }

  /**
   * Move object within tenant context
   */
  async moveObject(sourceRelativePath: string, destRelativePath: string): Promise<void> {
    const sourceKey = this.buildKey(sourceRelativePath);
    const destKey = this.buildKey(destRelativePath);
    await this.client.moveObject(sourceKey, destKey);
  }

  /**
   * Rename object (move to same folder with new name)
   */
  async renameObject(relativePath: string, newName: string): Promise<void> {
    const folderPath = getFolderPath(relativePath);
    const newPath = folderPath ? `${folderPath}/${newName}` : newName;
    await this.moveObject(relativePath, newPath);
  }

  /**
   * Check if object exists
   */
  async objectExists(relativePath: string): Promise<boolean> {
    const key = this.buildKey(relativePath);
    return this.client.objectExists(key);
  }

  /**
   * Create a folder
   */
  async createFolder(relativePath: string): Promise<void> {
    const key = this.buildKey(relativePath);
    await this.client.createFolder(key);
  }

  /**
   * Get thumbnail URLs for an image file
   * Checks cache first, generates URLs if not cached
   * @param fileKey - Original file key (e.g., "core/public/image.jpg")
   * @returns Object with thumbnail URLs for each size
   */
  async getThumbnailUrls(fileKey: string): Promise<{
    small?: string;
    medium?: string;
    large?: string;
  } | null> {
    try {
      const { getCacheInstance } = await import('@repo/cache');
      const cache = getCacheInstance();
      const cacheKey = `thumbnail:${this.context.tenantId}:${fileKey}`;

      // Check cache first
      const cachedUrls = await cache.get(cacheKey);
      if (cachedUrls) {
        return cachedUrls as { small?: string; medium?: string; large?: string };
      }

      // Generate fresh URLs for thumbnails
      const { getThumbnailKey, THUMBNAIL_SIZES } = await import('../services/thumbnail-generator');
      const thumbnailUrls: { small?: string; medium?: string; large?: string } = {};

      for (const sizeName of Object.keys(THUMBNAIL_SIZES)) {
        const thumbnailKey = getThumbnailKey(fileKey, sizeName as keyof typeof THUMBNAIL_SIZES);

        // Check if thumbnail exists
        const exists = await this.client.objectExists(thumbnailKey);
        if (exists) {
          // Use this.getPreSignedUrl() which handles public vs private URLs
          const url = await this.getPreSignedUrl(thumbnailKey, { expiresIn: 3600 }, true);
          thumbnailUrls[sizeName as 'small' | 'medium' | 'large'] = url;
        }
      }

      // Cache the URLs
      if (Object.keys(thumbnailUrls).length > 0) {
        await cache.set(cacheKey, thumbnailUrls, 3600); // 1 hour TTL
        return thumbnailUrls;
      }

      return null;
    } catch (error) {
      console.error('[TenantS3Client] Failed to get thumbnail URLs:', error);
      return null;
    }
  }

  /**
   * Get current context
   */
  getContext(): TenantS3Context {
    return { ...this.context };
  }

  /**
   * Create a new client with updated context
   */
  withContext(updates: Partial<TenantS3Context>): TenantS3Client {
    return new TenantS3Client(
      {
        ...this.context,
        ...updates,
      },
      this.client
    );
  }

  /**
   * Create a new client with appended base path
   */
  withBasePath(additionalPath: string): TenantS3Client {
    const currentBasePath = this.context.basePath || '';
    const newBasePath = currentBasePath
      ? `${currentBasePath}/${additionalPath}`
      : additionalPath;

    return this.withContext({ basePath: newBasePath });
  }
}

/**
 * Factory function to create tenant-scoped S3 client
 * Asynchronously creates the S3 client with proper configuration
 */
export async function createTenantS3Client(context: TenantS3Context): Promise<TenantS3Client> {
  return await TenantS3Client.create(context);
}
