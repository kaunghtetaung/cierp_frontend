/**
 * Student Photo Upload Action
 * Specialized upload action for student profile photos with custom path structure
 */

'use server';

import { headers } from 'next/headers';
import { createTenantS3Client } from '@repo/s3';
import { getMimeType } from '@repo/s3/utils';
import { logger } from '@repo/utils/common/logger';

/**
 * Resolve tenant info and get organization slug from tenant settings
 * Returns organizationSlug from tenantSettings.slug field
 */
async function resolveTenantInfo(tenantId: string) {
  try {
    logger.info('[resolveTenantInfo] Resolving tenant info', {
      component: 'student-photo-upload',
      tenantId,
    });

    // Get tenant settings from cache
    const { getCacheInstance, CacheKeys } = await import('@repo/cache');
    const cache = getCacheInstance();
    const tenantSettings = await cache.get(CacheKeys.tenantSettings(tenantId));

    if (!tenantSettings || typeof tenantSettings !== 'object') {
      throw new Error('Failed to resolve tenant settings');
    }

    // Extract organization slug and root domain from tenant settings
    const organizationSlug = (tenantSettings as any).slug;
    const tenantRootDomain = (tenantSettings as any).rootDomain || '';

    if (!organizationSlug) {
      throw new Error('No organization slug found in tenant settings');
    }

    if (!tenantRootDomain) {
      throw new Error('No root domain found in tenant settings');
    }

    logger.info('[resolveTenantInfo] Successfully resolved tenant info', {
      component: 'student-photo-upload',
      tenantId,
      organizationSlug,
      tenantRootDomain,
    });

    return {
      tenantId,
      organizationSlug,
      tenantRootDomain,
    };
  } catch (error) {
    logger.error('Failed to resolve tenant info', {
      component: 'student-photo-upload',
      operation: 'resolveTenantInfo',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Upload student photo with custom path structure
 *
 * Path structure: {organizationSlug}/cpms/private/common/students/photos/{randomFilename}
 * Signed URL: storage.{organizationSlug}.{rootDomain}/cpms/private/common/students/photos/{randomFilename}
 * Database value: {organizationSlug}/cpms/private/common/students/photos/{randomFilename}
 */
export async function uploadStudentPhotoAction(params: {
  tenantId: string;
  file: File;
  filename: string;
}): Promise<{
  s3Key: string;        // For database storage
  signedUrl: string;    // For immediate preview (1 day expiry)
  filename: string;     // Random generated filename
}> {
  try {
    const { tenantId, file, filename } = params;

    logger.info('Upload student photo request', {
      component: 'student-photo-upload',
      operation: 'upload',
      tenantId,
      filename,
      fileSize: file.size,
    });

    // Resolve tenant info (gets organizationSlug from tenant settings)
    const tenantInfo = await resolveTenantInfo(tenantId);

    // Build S3 key (path within bucket): cpms/private/common/students/photos/{filename}
    // Bucket name will be: um1 (organizationSlug)
    const s3Key = `cpms/private/common/students/photos/${filename}`;

    // Full database path includes organization slug prefix
    const dbPath = `${tenantInfo.organizationSlug}/${s3Key}`;

    logger.info('Building S3 path for student photo', {
      component: 'student-photo-upload',
      organizationSlug: tenantInfo.organizationSlug,
      filename,
      s3Key,
      dbPath,
    });

    // Create S3 client with organizationSlug as bucket name
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.organizationSlug, // Bucket name in MinIO
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app: 'cpms',
      basePath: '', // Empty basePath, we'll use full path with skipPathResolution
    });

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3 with skipPathResolution
    // Uploads to: bucket=um1, key=cpms/private/common/students/photos/{filename}
    const uploadedKey = await s3Client.putObject(
      s3Key,
      buffer,
      {
        contentType: file.type || getMimeType(filename),
      },
      true // skipPathResolution - use key as-is
    );

    logger.info('Uploaded student photo to S3', {
      component: 'student-photo-upload',
      uploadedKey,
      bucket: tenantInfo.organizationSlug,
      s3Key,
    });

    // Generate thumbnails for images
    const {
      isImageFile,
      generateImageThumbnails,
    } = await import('@repo/s3/services/thumbnail-generator');
    const mimeType = file.type || getMimeType(filename);

    let thumbnailUrls: { small?: string; medium?: string; large?: string } | undefined;

    if (isImageFile(mimeType)) {
      try {
        logger.info('Generating image thumbnails for student photo', {
          component: 'student-photo-upload',
          operation: 'thumbnail-generation',
          filename,
          fileType: mimeType,
        });

        const thumbnails = await generateImageThumbnails(buffer, s3Key);

        // Upload thumbnails to S3
        const tempThumbnailUrls: { small?: string; medium?: string; large?: string } = {};

        for (const thumbnail of thumbnails) {
          await s3Client.putObject(
            thumbnail.key,
            thumbnail.buffer,
            {
              contentType: 'image/webp',
            },
            true // skipPathResolution
          );

          // Generate signed URL for thumbnail (1 day expiry)
          const thumbnailUrl = await s3Client.getPreSignedUrl(
            thumbnail.key,
            {
              expiresIn: 86400, // 1 day
            },
            true // skipPathResolution
          );

          tempThumbnailUrls[thumbnail.size as 'small' | 'medium' | 'large'] = thumbnailUrl;
        }

        thumbnailUrls = tempThumbnailUrls;

        logger.info('Thumbnails generated successfully for student photo', {
          component: 'student-photo-upload',
          operation: 'thumbnail-generation',
          filename,
          thumbnailCount: thumbnails.length,
        });
      } catch (thumbnailError) {
        // Don't fail the upload if thumbnail generation fails
        logger.error('Thumbnail generation failed for student photo, but upload succeeded', {
          component: 'student-photo-upload',
          operation: 'thumbnail-generation',
          filename,
          error: thumbnailError instanceof Error ? thumbnailError.message : String(thumbnailError),
        });
      }
    }

    // Generate signed URL for preview (1 day expiry)
    // URL format: storage.um1ygn.edu.mm/cpms/private/common/students/photos/{filename}
    const signedUrl = await s3Client.getPreSignedUrl(
      s3Key,
      {
        expiresIn: 86400, // 1 day (24 hours)
      },
      true // skipPathResolution
    );

    logger.info('Generated signed URL for student photo', {
      component: 'student-photo-upload',
      filename,
      signedUrlGenerated: !!signedUrl,
      hasThumbnails: !!thumbnailUrls,
      expiresIn: '1 day',
    });

    const result = {
      s3Key: dbPath, // Database value: um1/cpms/private/common/students/photos/{filename}
      signedUrl, // Preview URL with 1 day expiry
      filename,
      thumbnails: thumbnailUrls, // Thumbnail URLs for preview
    };

    logger.info('Upload student photo successful', {
      component: 'student-photo-upload',
      operation: 'upload',
      tenantId,
      bucket: tenantInfo.organizationSlug,
      dbPath: result.s3Key,
    });

    return result;
  } catch (error) {
    logger.error('Upload student photo failed', {
      component: 'student-photo-upload',
      operation: 'upload',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
