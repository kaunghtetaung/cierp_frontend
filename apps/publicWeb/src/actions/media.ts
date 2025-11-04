/**
 * Media Server Actions for PublicWeb
 * Server-side actions for media operations with tenant context
 * Simplified version for student registration profile photo upload
 */

'use server';

import { headers } from 'next/headers';
import { createTenantS3Client } from '@repo/s3';
import { getMimeType } from '@repo/s3/utils';
import { logger } from '@repo/utils/common/logger';
import type { ListMediaResponse } from '@repo/media';

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
      component: 'media-actions-publicweb',
      sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : null,
      tenantId: tenantIdFromHeader,
    });

    // Fallback: Get session and tenant from cookies if headers not available
    if (!sessionId || !tenantIdFromHeader) {
      logger.info('[resolveTenantInfo] Checking cookies for missing values', {
        component: 'media-actions-publicweb',
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
        component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
      tenantId: actualTenantId,
      userId: session.userId,
    });

    const jwtToken = await getUserAccessToken(actualTenantId, session.userId);

    logger.info('[resolveTenantInfo] User access token result', {
      component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
      operation: 'list',
      tenantId,
      app,
      path,
    });

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context
    const s3Client = createTenantS3Client({
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

    logger.info('List media successful', {
      component: 'media-actions-publicweb',
      operation: 'list',
      tenantId,
      app,
      filesCount: filesWithUrls.length,
      foldersCount: folders.length,
    });

    return {
      files: filesWithUrls,
      folders,
      total: filesWithUrls.length + folders.length,
      hasMore: false,
    };
  } catch (error) {
    logger.error('List media failed', {
      component: 'media-actions-publicweb',
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
}): Promise<{
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
    const { tenantId, app, path = '', file } = params;

    logger.info('Upload media request', {
      component: 'media-actions-publicweb',
      operation: 'upload',
      tenantId,
      app,
      fileName: file.name,
      fileSize: file.size,
    });

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context
    const s3Client = createTenantS3Client({
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
    // Note: S3 presigned URLs have a max expiration of 7 days (604800 seconds)
    const url = await s3Client.getPreSignedUrl(file.name, {
      expiresIn: 604800, // 7 days (max allowed by AWS S3)
    });

    logger.info('[uploadMediaAction] Generated URL for uploaded file', {
      component: 'media-actions-publicweb',
      operation: 'upload',
      fileName: file.name,
      key,
      url,
      isPublicPath: key.includes('/public/') || key.startsWith('public/'),
      tenantRootDomain: tenantInfo.tenantRootDomain,
    });

    const result = {
      key,
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
          component: 'media-actions-publicweb',
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
              expiresIn: 604800, // 7 days (max allowed by AWS S3)
            },
            true
          ); // skipPathResolution

          thumbnailUrls[thumbnail.size as 'small' | 'medium' | 'large'] = thumbnailUrl;
        }

        result.thumbnails = thumbnailUrls;

        logger.info('Thumbnails generated successfully', {
          component: 'media-actions-publicweb',
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
          component: 'media-actions-publicweb',
          operation: 'upload',
          fileName: file.name,
          error: thumbnailError instanceof Error ? thumbnailError.message : String(thumbnailError),
        });
      }
    }

    logger.info('Upload media successful', {
      component: 'media-actions-publicweb',
      operation: 'upload',
      tenantId,
      app,
      key,
      hasThumbnails: !!result.thumbnails,
    });

    return result;
  } catch (error) {
    logger.error('Upload media failed', {
      component: 'media-actions-publicweb',
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
}): Promise<{ success: boolean }> {
  try {
    const { tenantId, app, path = '', keys } = params;

    logger.info('Delete media request', {
      component: 'media-actions-publicweb',
      operation: 'delete',
      tenantId,
      app,
      keysCount: keys.length,
    });

    if (!keys || keys.length === 0) {
      throw new Error('No keys provided');
    }

    // Resolve tenant info with JWT validation
    const tenantInfo = await resolveTenantInfo(tenantId, app);

    // Create S3 client with tenant context
    const s3Client = createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path,
    });

    // Delete objects (keys are relative to basePath)
    logger.info('Deleting objects with keys', {
      component: 'media-actions-publicweb',
      operation: 'delete',
      keys,
      basePath: path,
      tenantSlug: tenantInfo.tenantSlug,
    });

    await s3Client.deleteObjects(keys);

    logger.info('Delete media successful', {
      component: 'media-actions-publicweb',
      operation: 'delete',
      tenantId,
      app,
      keysCount: keys.length,
    });

    return { success: true };
  } catch (error) {
    logger.error('Delete media failed', {
      component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
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
    const s3Client = createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path,
    });

    // Create folder
    await s3Client.createFolder(folderName);

    logger.info('Create folder successful', {
      component: 'media-actions-publicweb',
      operation: 'create-folder',
      tenantId,
      app,
      folderName,
    });

    return { success: true };
  } catch (error) {
    logger.error('Create folder failed', {
      component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
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
    const s3Client = createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
    });

    // Rename (move) object
    await s3Client.renameObject(key, newName);

    logger.info('Rename media successful', {
      component: 'media-actions-publicweb',
      operation: 'rename',
      tenantId,
      app,
      key,
      newName,
    });

    return { success: true };
  } catch (error) {
    logger.error('Rename media failed', {
      component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
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
    const s3Client = createTenantS3Client({
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
          component: 'media-actions-publicweb',
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
      component: 'media-actions-publicweb',
      operation: 'move',
      tenantId,
      app,
      sourceKeysCount: sourceKeys.length,
    });

    return { success: true };
  } catch (error) {
    logger.error('Move media failed', {
      component: 'media-actions-publicweb',
      operation: 'move',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
