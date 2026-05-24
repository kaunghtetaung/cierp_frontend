/**
 * Media Server Actions
 * Server-side actions for media operations with tenant context
 */

'use server';

import { headers } from 'next/headers';
import { createTenantS3Client } from '@repo/s3';
import { getMimeType } from '@repo/s3/utils';
import { logger } from '@repo/utils/common/logger';
import type { ListMediaResponse } from '@repo/media';
import { getApiDomain } from '@repo/utils/server';
import {
  MediaMetadataService,
  type MediaMetadata,
  type CreateMediaMetadataInput,
} from '../services/media-metadata.service';

/** SHA-256 hash of an upload buffer — used for dedup / integrity. */
async function computeBufferChecksum(buf: Buffer): Promise<string> {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Merge backend Media metadata into the S3-listing file objects so that the
 * UI sees a single shape (id, alt, caption, tags, visibility, ...) without
 * having to know whether the file has been registered yet.
 *
 * @param files     S3-listing rows (must contain `key` relative to basePath).
 * @param toFullKey Function that turns a relative key into the full
 *                  tenant-scoped key stored in the Media collection.
 */
async function enrichFilesWithMetadata<
  T extends { key: string } & Record<string, unknown>,
>(files: T[], toFullKey: (relativeKey: string) => string): Promise<T[]> {
  if (files.length === 0) return files;
  const metadataService = await getMediaMetadataService();
  if (!metadataService) return files;

  const fullKeys = files.map((f) => toFullKey(f.key));
  try {
    const result = await metadataService.findByKeys(fullKeys);
    if (!result.success || !result.data) return files;
    const byKey = new Map<string, MediaMetadata>(
      (result.data as MediaMetadata[]).map((m) => [m.key, m]),
    );
    return files.map((f) => {
      const fullKey = toFullKey(f.key);
      const meta = byKey.get(fullKey);
      if (!meta) return f;
      return {
        ...f,
        id: meta._id || meta.id,
        alt: meta.alt,
        caption: meta.caption,
        tags: meta.tags,
        visibility: meta.visibility,
        width: meta.width,
        height: meta.height,
        durationSeconds: meta.durationSeconds,
        checksum: meta.checksum,
        folderPath: meta.folderPath,
      } as T;
    });
  } catch (err) {
    logger.warn('enrichFilesWithMetadata failed — returning S3-only data', {
      component: 'media-actions',
      error: err instanceof Error ? err.message : String(err),
    });
    return files;
  }
}

/**
 * Build a MediaMetadataService bound to the current request's auth context.
 * Returns null if any required header is missing — callers treat metadata
 * sync as best-effort (S3 ops still succeed without metadata persistence).
 */
async function getMediaMetadataService(): Promise<MediaMetadataService | null> {
  try {
    const headerStore = await headers();
    const tenantId = headerStore.get('x-tenant-id') ?? undefined;
    const userSessionId = headerStore.get('x-session-id') ?? undefined;
    const userId = headerStore.get('x-user-id') ?? undefined;
    if (!tenantId) return null;
    const baseURL = await getApiDomain();
    return new MediaMetadataService(baseURL, {
      tenantId,
      userSessionId,
      userId,
    });
  } catch (err) {
    logger.warn('getMediaMetadataService failed — metadata sync skipped', {
      component: 'media-actions',
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Resolve tenant info from headers or cookies server-side
 * Tries headers first (set by middleware), then falls back to cookies
 */
async function resolveTenantInfo(tenantId: string, app: string) {
  try {
    // Try to get session ID and tenant ID from headers (set by middleware)
    const headersList = await headers();
    let sessionId = headersList.get('x-session-id');
    let tenantIdFromHeader = headersList.get('x-tenant-id');

    logger.info('[resolveTenantInfo] Session ID from headers', {
      component: 'media-actions',
      sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : null,
      tenantId: tenantIdFromHeader,
    });

    // Fallback: Get session and tenant from cookies if headers not available
    if (!sessionId || !tenantIdFromHeader) {
      logger.info('[resolveTenantInfo] Checking cookies for missing values', {
        component: 'media-actions',
        needsSession: !sessionId,
        needsTenant: !tenantIdFromHeader,
      });

      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();

      if (!sessionId) {
        const sessionCookie = cookieStore.get('session');
        sessionId = sessionCookie?.value || null;
      }

      if (!tenantIdFromHeader) {
        const tenantCookie = cookieStore.get('x-tenant-id');
        tenantIdFromHeader = tenantCookie?.value || null;
      }

      logger.info('[resolveTenantInfo] Values from cookies', {
        component: 'media-actions',
        sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : null,
        tenantId: tenantIdFromHeader,
      });
    }

    if (!sessionId) {
      throw new Error('No session found in headers or cookies');
    }

    // Get session from cache
    const { getSession } = await import('@repo/auth/core');
    const session = await getSession(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Use tenantId priority: header/cookie > session > parameter
    const actualTenantId = tenantIdFromHeader || session.tenantId || tenantId;

    if (!actualTenantId) {
      throw new Error('No tenant ID found in headers, session, or parameters');
    }

    // Get user's access token (JWT) from cache
    const { getUserAccessToken } = await import('@repo/auth/core');

    logger.info('[resolveTenantInfo] Getting user access token', {
      component: 'media-actions',
      tenantId: actualTenantId,
      userId: session.userId,
    });

    const jwtToken = await getUserAccessToken(actualTenantId, session.userId);

    logger.info('[resolveTenantInfo] User access token result', {
      component: 'media-actions',
      hasToken: !!jwtToken,
    });

    if (!jwtToken) {
      throw new Error('Failed to retrieve user JWT from session');
    }

    // Parse JWT to get roles
    const jwt = parseJWTString(jwtToken);

    if (!jwt || !jwt.roles || jwt.roles.length === 0) {
      throw new Error('Missing or invalid JWT token');
    }

    // Get tenant slug from cache
    const { getCacheInstance, CacheKeys } = await import('@repo/cache');
    const cache = getCacheInstance();
    const tenantSettings = await cache.get(CacheKeys.tenantSettings(actualTenantId));

    if (!tenantSettings || typeof tenantSettings !== 'object' || !('slug' in tenantSettings)) {
      throw new Error('Failed to resolve tenant slug from tenant settings');
    }

    const currentTenantSlug = (tenantSettings as any).slug;
    const tenantRootDomain = (tenantSettings as any).rootDomain || '';

    // Validate user access to tenant
    const hasAccess = jwt.roles.some(
      (role: any) =>
        role.OrgSlug === 'all' || // SystemAdmin with all orgs
        role.OrgSlug === currentTenantSlug // Has access to this specific org
    );

    if (!hasAccess) {
      throw new Error(`User does not have access to tenant: ${currentTenantSlug}`);
    }

    return {
      tenantId: actualTenantId,
      tenantSlug: currentTenantSlug,
      tenantRootDomain, // Required for generating clean public URLs
    };
  } catch (error) {
    logger.error('Failed to resolve tenant info', {
      component: 'media-actions',
      operation: 'resolveTenantInfo',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Parse JWT token string
 */
function parseJWTString(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64Payload = parts[1];
    base64Payload = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Payload.length % 4) {
      base64Payload += '=';
    }

    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch (error) {
    logger.error('Failed to parse JWT', {
      component: 'media-actions',
      operation: 'parseJWTString',
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * List media files and folders
 */
export async function listMediaAction(params: {
  tenantId: string;
  app: string;
  path?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ListMediaResponse> {
  try {
    const { tenantId, app, path = '', page = 1, limit = 50, search } = params;

    logger.info('List media request', {
      component: 'media-actions',
      operation: 'list',
      tenantId,
      app,
      path,
    });

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Import cache utilities
    const { getCacheInstance, CacheKeys, CacheTTL } = await import('@repo/cache');
    const cache = getCacheInstance();

    // Build cache key for this folder listing
    const cacheKey = CacheKeys.mediaFolderListing(tenantInfo.tenantId, app, path);

    // Try to get cached folder listing
    try {
      const cachedResult = await cache.get<ListMediaResponse>(cacheKey);
      if (cachedResult) {
        logger.info('List media cache hit', {
          component: 'media-actions',
          operation: 'list',
          tenantId,
          app,
          path,
          cacheKey,
        });
        return cachedResult;
      }
    } catch (cacheError) {
      // Cache miss or error - continue to S3
      logger.warn('Cache read failed, falling back to S3', {
        component: 'media-actions',
        operation: 'list',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    // Cache miss - fetch from S3
    logger.info('List media cache miss, fetching from S3', {
      component: 'media-actions',
      operation: 'list',
      tenantId,
      app,
      path,
      cacheKey,
    });

    // Create S3 client with tenant context
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path,
    });

    // List objects
    const result = await s3Client.listObjects('');

    // Generate pre-signed URLs for files and thumbnails
    const { hasThumbnailSupport } = await import('@repo/s3/services/thumbnail-generator');
    const { buildS3Key } = await import('@repo/s3/utils/path-resolver');

    const filesWithUrls = await Promise.all(
      result.objects
        .filter((obj) => !obj.key.endsWith('/')) // Exclude folder markers
        .filter((obj) => !obj.key.endsWith('.keep')) // Exclude .keep files
        .filter((obj) => obj.size > 0) // Exclude 0-byte marker files
        .map(async (obj) => {
          const url = await s3Client.getPreSignedUrl(obj.key, {
            expiresIn: 3600,
          });

          const fileName = obj.key.split('/').pop() || obj.key;

          // Get thumbnails for images
          // Build full S3 key for thumbnail lookup
          const fullS3Key = buildS3Key(
            {
              tenantId: tenantInfo.tenantId,
              tenantSlug: tenantInfo.tenantSlug,
              tenantRootDomain: tenantInfo.tenantRootDomain,
              app,
              basePath: path,
            },
            obj.key
          );

          let thumbnails: { small?: string; medium?: string; large?: string } | undefined;

          // Check for image thumbnails (auto-generated)
          if (hasThumbnailSupport(fileName, obj.contentType)) {
            thumbnails = (await s3Client.getThumbnailUrls(fullS3Key)) || undefined;
          }

          // Check for PDF manual thumbnails
          if (obj.contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
            try {
              // Try to get thumbnail URLs for PDF
              thumbnails = (await s3Client.getThumbnailUrls(fullS3Key)) || undefined;
            } catch (error) {
              // Thumbnails don't exist yet, that's okay
            }
          }

          return {
            key: obj.key, // Use relative key (relative to basePath) so delete can build the full key
            name: fileName,
            size: obj.size,
            type: obj.contentType || '',
            url,
            lastModified: obj.lastModified,
            isFolder: false,
            thumbnails,
          };
        })
    );

    // Format folders
    const folders = result.folders.map((folder) => {
      const folderName = folder.split('/').filter(Boolean).pop() || folder;
      return {
        name: folderName,
        path: folder,
      };
    });

    // Enrich files with backend Media metadata (id, alt, caption, tags).
    // Best-effort: if metadata lookup fails, files are returned with S3-only
    // info. Existing consumers keep working since the new fields are optional.
    const { buildS3Key: buildS3KeyForLookup } = await import(
      '@repo/s3/utils/path-resolver'
    );
    const enrichedFiles = await enrichFilesWithMetadata(
      filesWithUrls,
      (relativeKey) =>
        buildS3KeyForLookup(
          {
            tenantId: tenantInfo.tenantId,
            tenantSlug: tenantInfo.tenantSlug,
            tenantRootDomain: tenantInfo.tenantRootDomain,
            app,
            basePath: path,
          },
          relativeKey,
        ),
    );

    logger.info('List media successful', {
      component: 'media-actions',
      operation: 'list',
      tenantId,
      app,
      filesCount: enrichedFiles.length,
      foldersCount: folders.length,
    });

    const response: ListMediaResponse = {
      files: enrichedFiles,
      folders,
      total: enrichedFiles.length + folders.length,
      hasMore: false,
    };

    // Cache the result for future requests
    try {
      await cache.set(cacheKey, response, CacheTTL.MEDIUM); // 1 hour TTL
      logger.info('Cached folder listing', {
        component: 'media-actions',
        operation: 'list',
        cacheKey,
        ttl: CacheTTL.MEDIUM,
      });
    } catch (cacheError) {
      // Cache write failed - log but don't fail the request
      logger.warn('Failed to cache folder listing', {
        component: 'media-actions',
        operation: 'list',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return response;
  } catch (error) {
    logger.error('List media failed', {
      component: 'media-actions',
      operation: 'list',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Upload media file with automatic thumbnail generation
 */
export async function uploadMediaAction(params: {
  tenantId: string;
  app: string;
  path?: string;
  file: File;
  /** Optional metadata to persist with the Media record. */
  alt?: { en?: string; mm?: string };
  caption?: { en?: string; mm?: string };
  tags?: string[];
}): Promise<{
  /** Mongo Media._id when the metadata record was registered. */
  id?: string;
  key: string;
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified: Date;
  isFolder: boolean;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}> {
  try {
    const { tenantId, app, path = '', file, alt, caption, tags } = params;

    logger.info('Upload media request', {
      component: 'media-actions',
      operation: 'upload',
      tenantId,
      app,
      fileName: file.name,
      fileSize: file.size,
    });

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path,
    });

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload original file to S3
    const key = await s3Client.putObject(file.name, buffer, {
      contentType: file.type || getMimeType(file.name),
    });

    // Generate URL for the uploaded file (public or signed based on path)
    const url = await s3Client.getPreSignedUrl(file.name, {
      expiresIn: 3600,
    });

    // Build full database key with tenant slug prefix
    // Format: {tenantSlug}/{key}
    // Example: um1/cpms/private/common/students/photos/file.jpg
    const fullKey = `${tenantInfo.tenantSlug}/${key}`;

    logger.info('[uploadMediaAction] Generated URL for uploaded file', {
      component: 'media-actions',
      operation: 'upload',
      fileName: file.name,
      s3Key: key,
      fullKey: fullKey,
      url,
      isPublicPath: key.includes('/public/') || key.startsWith('public/'),
      tenantRootDomain: tenantInfo.tenantRootDomain,
    });

    const result = {
      key: fullKey, // Store full key with tenant slug prefix for database
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      lastModified: new Date(),
      isFolder: false,
      thumbnails: undefined as { small?: string; medium?: string; large?: string } | undefined,
      requiresThumbnailGeneration: false as boolean,
    };

    // Generate thumbnails for images only
    const {
      isImageFile,
      generateImageThumbnails,
    } = await import('@repo/s3/services/thumbnail-generator');
    const mimeType = file.type || getMimeType(file.name);

    if (isImageFile(mimeType)) {
      // Generate image thumbnails directly
      try {
        logger.info('Generating image thumbnails', {
          component: 'media-actions',
          operation: 'upload',
          fileName: file.name,
          fileType: mimeType,
        });

        const thumbnails = await generateImageThumbnails(buffer, key);

        // Upload thumbnails to S3
        const thumbnailUrls: { small?: string; medium?: string; large?: string } = {};

        for (const thumbnail of thumbnails) {
          await s3Client.putObject(
            thumbnail.key,
            thumbnail.buffer,
            {
              contentType: 'image/webp',
            },
            true // skipPathResolution - use key as-is
          );

          // Generate pre-signed URL for thumbnail
          const thumbnailUrl = await s3Client.getPreSignedUrl(
            thumbnail.key,
            {
              expiresIn: 3600,
            },
            true
          ); // skipPathResolution

          thumbnailUrls[thumbnail.size as 'small' | 'medium' | 'large'] = thumbnailUrl;
        }

        result.thumbnails = thumbnailUrls;

        logger.info('Thumbnails generated successfully', {
          component: 'media-actions',
          operation: 'upload',
          fileName: file.name,
          thumbnailCount: thumbnails.length,
        });

        // Cache thumbnail URLs in Redis
        const { getCacheInstance, CacheKeys } = await import('@repo/cache');
        const cache = getCacheInstance();
        const cacheKey = `thumbnail:${tenantId}:${key}`;
        await cache.set(cacheKey, thumbnailUrls, 3600); // 1 hour TTL
      } catch (thumbnailError) {
        // Don't fail the upload if thumbnail generation fails
        logger.error('Image thumbnail generation failed, but upload succeeded', {
          component: 'media-actions',
          operation: 'upload',
          fileName: file.name,
          error: thumbnailError instanceof Error ? thumbnailError.message : String(thumbnailError),
        });
      }
    }

    logger.info('Upload media successful', {
      component: 'media-actions',
      operation: 'upload',
      tenantId,
      app,
      key,
      hasThumbnails: !!result.thumbnails,
    });

    // Invalidate folder listing cache (new file added to folder)
    try {
      const { getCacheInstance, CacheKeys } = await import('@repo/cache');
      const cache = getCacheInstance();
      const folderCacheKey = CacheKeys.mediaFolderListing(tenantInfo.tenantId, app, path);
      await cache.del(folderCacheKey);
      logger.info('Invalidated folder listing cache after upload', {
        component: 'media-actions',
        operation: 'upload',
        cacheKey: folderCacheKey,
      });
    } catch (cacheError) {
      // Cache invalidation failed - log but don't fail the request
      logger.warn('Failed to invalidate folder listing cache', {
        component: 'media-actions',
        operation: 'upload',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    // Register metadata in the backend Media collection. Best-effort: an S3
    // upload that succeeds without a metadata record will simply lack a
    // Mongo `id` — the file is still browsable via S3 listing. An orphan
    // cleanup job (Phase 5) will reconcile.
    let mediaId: string | undefined;
    try {
      const metadataService = await getMediaMetadataService();
      if (metadataService) {
        const visibility: 'public' | 'private' | 'personal' = key.includes(
          '/public/',
        )
          ? 'public'
          : key.includes('/personal/')
          ? 'personal'
          : 'private';

        const checksum = await computeBufferChecksum(buffer);

        const metadataInput: CreateMediaMetadataInput = {
          key: fullKey,
          url: result.url,
          filename: file.name,
          mimeType: file.type || getMimeType(file.name),
          size: file.size,
          checksum,
          storageProvider: 'minio',
          visibility,
          folderPath: path || undefined,
          thumbnails: result.thumbnails,
          alt,
          caption,
          tags,
        };

        const metadataResult = await metadataService.create(metadataInput);
        if (metadataResult.success && metadataResult.data) {
          mediaId = metadataResult.data._id || metadataResult.data.id;
          logger.info('Registered media metadata', {
            component: 'media-actions',
            operation: 'upload',
            mediaId,
            key: fullKey,
          });
        } else {
          logger.warn('Media metadata register returned non-success', {
            component: 'media-actions',
            operation: 'upload',
            key: fullKey,
            error: metadataResult.error,
          });
        }
      }
    } catch (metadataError) {
      logger.error('Media metadata register failed (best-effort)', {
        component: 'media-actions',
        operation: 'upload',
        key: fullKey,
        error:
          metadataError instanceof Error
            ? metadataError.message
            : String(metadataError),
      });
    }

    return { id: mediaId, ...result };
  } catch (error) {
    logger.error('Upload media failed', {
      component: 'media-actions',
      operation: 'upload',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Delete media files/folders
 */
export async function deleteMediaAction(params: {
  tenantId: string;
  app: string;
  path?: string;
  keys: string[];
  /** Soft delete (default — file stays in S3 so it can be restored), or
   *  hard delete (remove from MinIO too). */
  mode?: 'soft' | 'hard';
}): Promise<{ success: boolean }> {
  try {
    const { tenantId, app, path = '', keys, mode = 'soft' } = params;

    logger.info('Delete media request', {
      component: 'media-actions',
      operation: 'delete',
      tenantId,
      app,
      keysCount: keys.length,
      mode,
    });

    if (!keys || keys.length === 0) {
      throw new Error('No keys provided');
    }

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path,
    });

    // --- soft-delete metadata records first ---
    // For both soft and hard mode, we mark Media docs deleted so they stop
    // showing up in the picker UI even if S3 cleanup is delayed/skipped.
    try {
      const metadataService = await getMediaMetadataService();
      if (metadataService) {
        const { buildS3Key: buildS3KeyForLookup } = await import(
          '@repo/s3/utils/path-resolver'
        );
        const fullKeys = keys.map((k) =>
          buildS3KeyForLookup(
            {
              tenantId: tenantInfo.tenantId,
              tenantSlug: tenantInfo.tenantSlug,
              tenantRootDomain: tenantInfo.tenantRootDomain,
              app,
              basePath: path,
            },
            k,
          ),
        );
        const lookup = await metadataService.findByKeys(fullKeys);
        if (lookup.success && Array.isArray(lookup.data)) {
          for (const m of lookup.data) {
            const id = m._id || m.id;
            if (!id) continue;
            try {
              if (mode === 'hard') {
                await metadataService.hardDelete(id);
              } else {
                await metadataService.softDelete(id);
              }
            } catch (mErr) {
              logger.warn('Per-media metadata delete failed', {
                component: 'media-actions',
                operation: 'delete',
                id,
                key: m.key,
                error: mErr instanceof Error ? mErr.message : String(mErr),
              });
            }
          }
        }
      }
    } catch (metaErr) {
      logger.warn('Bulk metadata delete failed (best-effort)', {
        component: 'media-actions',
        operation: 'delete',
        error: metaErr instanceof Error ? metaErr.message : String(metaErr),
      });
    }

    // --- S3 side ---
    // Soft delete keeps the object in S3 (only metadata is hidden) so users
    // can restore from trash. Hard delete also removes the object.
    if (mode === 'hard') {
      logger.info('Deleting objects with keys', {
        component: 'media-actions',
        operation: 'delete',
        keys,
        basePath: path,
        tenantSlug: tenantInfo.tenantSlug,
      });

      await s3Client.deleteObjects(keys);
    } else {
      logger.info('Soft delete — S3 objects preserved for restore', {
        component: 'media-actions',
        operation: 'delete',
        keys,
      });
    }

    logger.info('Delete media successful', {
      component: 'media-actions',
      operation: 'delete',
      tenantId,
      app,
      keysCount: keys.length,
    });

    // Invalidate folder listing cache (files removed from folder)
    try {
      const { getCacheInstance, CacheKeys } = await import('@repo/cache');
      const cache = getCacheInstance();
      const folderCacheKey = CacheKeys.mediaFolderListing(tenantInfo.tenantId, app, path);
      await cache.del(folderCacheKey);
      logger.info('Invalidated folder listing cache after delete', {
        component: 'media-actions',
        operation: 'delete',
        cacheKey: folderCacheKey,
      });
    } catch (cacheError) {
      // Cache invalidation failed - log but don't fail the request
      logger.warn('Failed to invalidate folder listing cache', {
        component: 'media-actions',
        operation: 'delete',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Delete media failed', {
      component: 'media-actions',
      operation: 'delete',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create folder
 */
export async function createFolderAction(params: {
  tenantId: string;
  app: string;
  path?: string;
  folderName: string;
}): Promise<{ success: boolean }> {
  try {
    const { tenantId, app, path = '', folderName } = params;

    logger.info('Create folder request', {
      component: 'media-actions',
      operation: 'create-folder',
      tenantId,
      app,
      folderName,
    });

    if (!folderName) {
      throw new Error('Folder name is required');
    }

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path,
    });

    // Create folder
    await s3Client.createFolder(folderName);

    logger.info('Create folder successful', {
      component: 'media-actions',
      operation: 'create-folder',
      tenantId,
      app,
      folderName,
    });

    // Invalidate parent folder listing cache (new subfolder created)
    try {
      const { getCacheInstance, CacheKeys } = await import('@repo/cache');
      const cache = getCacheInstance();
      const parentFolderKey = CacheKeys.mediaFolderListing(tenantInfo.tenantId, app, path);
      await cache.del(parentFolderKey);
      logger.info('Invalidated parent folder listing cache after folder creation', {
        component: 'media-actions',
        operation: 'create-folder',
        cacheKey: parentFolderKey,
      });
    } catch (cacheError) {
      // Cache invalidation failed - log but don't fail the request
      logger.warn('Failed to invalidate folder listing cache', {
        component: 'media-actions',
        operation: 'create-folder',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Create folder failed', {
      component: 'media-actions',
      operation: 'create-folder',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Rename media file/folder
 */
export async function renameMediaAction(params: {
  tenantId: string;
  app: string;
  key: string;
  newName: string;
}): Promise<{ success: boolean }> {
  try {
    const { tenantId, app, key, newName } = params;

    logger.info('Rename media request', {
      component: 'media-actions',
      operation: 'rename',
      tenantId,
      app,
      key,
      newName,
    });

    if (!key || !newName) {
      throw new Error('Key and new name are required');
    }

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
    });

    // Rename (move) object
    await s3Client.renameObject(key, newName);

    logger.info('Rename media successful', {
      component: 'media-actions',
      operation: 'rename',
      tenantId,
      app,
      key,
      newName,
    });

    // Invalidate parent folder listing cache (file renamed in folder)
    try {
      const { getCacheInstance, CacheKeys } = await import('@repo/cache');
      const cache = getCacheInstance();

      // Extract parent path from key
      const pathParts = key.split('/');
      pathParts.pop(); // Remove filename
      const parentPath = pathParts.join('/');

      const parentFolderKey = CacheKeys.mediaFolderListing(tenantInfo.tenantId, app, parentPath);
      await cache.del(parentFolderKey);
      logger.info('Invalidated parent folder listing cache after rename', {
        component: 'media-actions',
        operation: 'rename',
        cacheKey: parentFolderKey,
      });
    } catch (cacheError) {
      // Cache invalidation failed - log but don't fail the request
      logger.warn('Failed to invalidate folder listing cache', {
        component: 'media-actions',
        operation: 'rename',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Rename media failed', {
      component: 'media-actions',
      operation: 'rename',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Move media files
 */
export async function moveMediaAction(params: {
  tenantId: string;
  app: string;
  sourceKeys: string[];
  sourcePath?: string;
  destinationPath: string;
}): Promise<{ success: boolean }> {
  try {
    const { tenantId, app, sourceKeys, sourcePath = '', destinationPath } = params;

    logger.info('Move media request', {
      component: 'media-actions',
      operation: 'move',
      tenantId,
      app,
      sourceKeys,
      sourcePath,
      sourceKeysCount: sourceKeys.length,
      destinationPath,
    });

    if (!sourceKeys || sourceKeys.length === 0 || !destinationPath) {
      throw new Error('Source keys and destination path are required');
    }

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context (NO basePath - we'll build full keys manually)
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
    });

    // Move each file
    await Promise.all(
      sourceKeys.map(async (sourceKey) => {
        const fileName = sourceKey.split('/').pop() || sourceKey;

        // Build full source key: sourcePath + sourceKey
        const fullSourceKey = sourcePath ? `${sourcePath}/${sourceKey}` : sourceKey;

        // Build full destination key: destinationPath + fileName
        const fullDestKey = destinationPath ? `${destinationPath}/${fileName}` : fileName;

        logger.info('Moving file', {
          component: 'media-actions',
          operation: 'move-file',
          sourceKey,
          fullSourceKey,
          fullDestKey,
          fileName,
        });

        await s3Client.moveObject(fullSourceKey, fullDestKey);
      })
    );

    logger.info('Move media successful', {
      component: 'media-actions',
      operation: 'move',
      tenantId,
      app,
      sourceKeysCount: sourceKeys.length,
    });

    // Invalidate folder listing cache (files moved between folders)
    try {
      const { getCacheInstance, CacheKeys } = await import('@repo/cache');
      const cache = getCacheInstance();

      // Invalidate source folder cache
      const sourceFolderKey = CacheKeys.mediaFolderListing(tenantInfo.tenantId, app, sourcePath);
      await cache.del(sourceFolderKey);

      // Invalidate destination folder cache
      const destFolderKey = CacheKeys.mediaFolderListing(tenantInfo.tenantId, app, destinationPath);
      await cache.del(destFolderKey);

      logger.info('Invalidated folder listing caches after move', {
        component: 'media-actions',
        operation: 'move',
        sourceCacheKey: sourceFolderKey,
        destCacheKey: destFolderKey,
      });
    } catch (cacheError) {
      // Cache invalidation failed - log but don't fail the request
      logger.warn('Failed to invalidate folder listing caches', {
        component: 'media-actions',
        operation: 'move',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Move media failed', {
      component: 'media-actions',
      operation: 'move',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Upload PDF Thumbnail Action
 * Generates three sizes of thumbnails and stores them in .thumbnails folder
 */
export async function uploadPdfThumbnailAction({
  tenantId,
  app,
  pdfKey,
  thumbnailFile,
}: {
  tenantId: string;
  app: string;
  pdfKey: string;
  thumbnailFile: File;
}) {
  try {
    logger.info('Upload PDF thumbnail request', {
      component: 'media-actions',
      operation: 'upload-pdf-thumbnail',
      tenantId,
      app,
      pdfKey,
      thumbnailFileName: thumbnailFile.name,
      thumbnailFileSize: thumbnailFile.size,
    });

    // Get tenant info
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client
    const s3Client = await createTenantS3Client({
      tenantSlug: tenantInfo.tenantSlug,
      subdomain: tenantInfo.subdomain,
    });

    // Convert File to Buffer
    const arrayBuffer = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate thumbnails using the image thumbnail generator
    const { generateImageThumbnails } = await import('@repo/s3/services/thumbnail-generator');

    // Extract directory and PDF filename from the PDF key
    // pdfKey format: "core/public/document.pdf" or just "document.pdf"
    const lastSlashIndex = pdfKey.lastIndexOf('/');
    const directory = lastSlashIndex >= 0 ? pdfKey.substring(0, lastSlashIndex) : '';
    const pdfFileName = lastSlashIndex >= 0 ? pdfKey.substring(lastSlashIndex + 1) : pdfKey;
    const pdfBaseName = pdfFileName.replace(/\.pdf$/i, '');

    logger.info('Processing PDF thumbnail upload', {
      component: 'media-actions',
      operation: 'upload-pdf-thumbnail',
      pdfKey,
      directory,
      pdfFileName,
      pdfBaseName,
      uploadedImageName: thumbnailFile.name,
    });

    // Create a dummy key for thumbnail generation using PDF's base name
    // The generator will create paths like: {directory}/.thumbnails/{pdfBaseName}_{size}.webp
    // Important: We use PDF's name, NOT the uploaded image's name
    const dummyKey = directory ? `${directory}/${pdfBaseName}.jpg` : `${pdfBaseName}.jpg`;

    logger.info('Generating PDF thumbnails with PDF filename', {
      component: 'media-actions',
      operation: 'upload-pdf-thumbnail',
      dummyKey,
      willCreateThumbnails: directory ? [
        `${directory}/.thumbnails/${pdfBaseName}_small.webp`,
        `${directory}/.thumbnails/${pdfBaseName}_medium.webp`,
        `${directory}/.thumbnails/${pdfBaseName}_large.webp`,
      ] : [
        `.thumbnails/${pdfBaseName}_small.webp`,
        `.thumbnails/${pdfBaseName}_medium.webp`,
        `.thumbnails/${pdfBaseName}_large.webp`,
      ],
    });

    // Generate three sizes of thumbnails
    const thumbnails = await generateImageThumbnails(buffer, dummyKey);

    logger.info('Uploading PDF thumbnails to S3', {
      component: 'media-actions',
      operation: 'upload-pdf-thumbnail',
      thumbnailCount: thumbnails.length,
      thumbnailKeys: thumbnails.map((t) => t.key),
    });

    // Upload each thumbnail to S3
    // Use skipPathResolution=true because thumbnail.key already includes the full path
    await Promise.all(
      thumbnails.map(async (thumbnail) => {
        await s3Client.putObject(
          thumbnail.key,
          thumbnail.buffer,
          { contentType: 'image/webp' },
          true // skipPathResolution - thumbnail.key is already the full S3 key
        );
      })
    );

    logger.info('Upload PDF thumbnail successful', {
      component: 'media-actions',
      operation: 'upload-pdf-thumbnail',
      tenantId,
      app,
      pdfKey,
      thumbnailCount: thumbnails.length,
    });

    return {
      success: true,
      thumbnailKeys: thumbnails.map((t) => t.key),
    };
  } catch (error) {
    logger.error('Upload PDF thumbnail failed', {
      component: 'media-actions',
      operation: 'upload-pdf-thumbnail',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
