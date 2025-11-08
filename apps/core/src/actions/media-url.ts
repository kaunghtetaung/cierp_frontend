/**
 * Media URL Generation Actions
 * Server actions to generate signed URLs for S3 private files
 */

'use server';

import { createTenantS3Client } from '@repo/s3';
import { logger } from '@repo/utils/common/logger';
import { withServerActionErrorHandler } from '@repo/utils/server';

/**
 * Get signed URL for a private S3 file
 * @param s3Key - The full S3 key path (format: {organizationSlug}/app/private/path/filename)
 * @param tenantId - The tenant ID
 * @param tenantSlug - The organization slug (bucket name)
 * @param tenantRootDomain - The root domain
 * @param app - The app name (e.g., 'cpms', 'core')
 * @param includeThumbnails - Whether to generate thumbnail URLs for images (default: false)
 */
export async function getPrivateFileUrl(params: {
  s3Key: string;
  tenantId: string;
  tenantSlug: string;
  tenantRootDomain: string;
  app?: string;
  includeThumbnails?: boolean;
}) {
  return withServerActionErrorHandler(async () => {
    const { s3Key, tenantId, tenantSlug, tenantRootDomain, app = 'cpms', includeThumbnails = false } = params;

    logger.info('Getting private file URL', {
      component: 'media-url-actions',
      operation: 'getPrivateFileUrl',
      s3Key,
      tenantSlug,
      app,
      includeThumbnails,
    });

    // Extract the actual S3 key (remove organization slug prefix if present)
    // s3Key format: um1/cpms/private/common/students/photos/{filename}
    // We need: cpms/private/common/students/photos/{filename}
    const keyParts = s3Key.split('/');
    const actualKey = keyParts.slice(1).join('/'); // Remove first part (organization slug)

    logger.info('Extracted actual S3 key', {
      component: 'media-url-actions',
      operation: 'getPrivateFileUrl',
      originalKey: s3Key,
      actualKey,
    });

    // Create S3 client
    const s3Client = await createTenantS3Client({
      tenantId,
      tenantSlug, // Bucket name
      tenantRootDomain,
      app,
      basePath: '',
    });

    // Generate signed URL (7 days expiry - AWS S3 maximum)
    const signedUrl = await s3Client.getPreSignedUrl(
      actualKey,
      {
        expiresIn: 604800, // 7 days (max allowed by AWS S3)
      },
      true // skipPathResolution
    );

    logger.info('Generated signed URL for private file', {
      component: 'media-url-actions',
      operation: 'getPrivateFileUrl',
      signedUrlGenerated: !!signedUrl,
    });

    // Generate thumbnail URLs if requested
    let thumbnails: { small?: string; medium?: string; large?: string } | undefined;

    if (includeThumbnails) {
      try {
        const { getThumbnailKey, THUMBNAIL_SIZES } = await import('@repo/s3/services/thumbnail-generator');

        const thumbnailUrls: { small?: string; medium?: string; large?: string } = {};

        for (const sizeName of Object.keys(THUMBNAIL_SIZES)) {
          const thumbnailKey = getThumbnailKey(actualKey, sizeName as keyof typeof THUMBNAIL_SIZES);

          const thumbnailUrl = await s3Client.getPreSignedUrl(
            thumbnailKey,
            {
              expiresIn: 604800, // 7 days
            },
            true // skipPathResolution
          );

          thumbnailUrls[sizeName as 'small' | 'medium' | 'large'] = thumbnailUrl;
        }

        thumbnails = thumbnailUrls;

        logger.info('Generated thumbnail URLs for private file', {
          component: 'media-url-actions',
          operation: 'getPrivateFileUrl',
          thumbnailCount: Object.keys(thumbnailUrls).length,
        });
      } catch (error) {
        logger.error('Failed to generate thumbnail URLs', {
          component: 'media-url-actions',
          operation: 'getPrivateFileUrl',
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue without thumbnails
      }
    }

    return {
      success: true,
      signedUrl,
      thumbnails,
    };
  }, {
    operation: 'get-private-file-url',
    component: 'media-url-actions'
  });
}

/**
 * Transform form data to convert S3 keys to signed URLs
 * This is useful for mediaUploader fields that store S3 keys in the database
 *
 * @param data - Form data object
 * @param fields - Array of field names that contain S3 keys
 * @param context - Tenant context for generating URLs
 */
export async function transformS3KeysToUrls(
  data: Record<string, any>,
  fields: string[],
  context: {
    tenantId: string;
    tenantSlug: string;
    tenantRootDomain: string;
    app?: string;
  }
): Promise<Record<string, any>> {
  const transformedData = { ...data };

  for (const fieldName of fields) {
    const value = data[fieldName];

    // Check if value exists and looks like an S3 key
    if (value && typeof value === 'string' && value.includes('/') && !value.startsWith('http')) {
      logger.info('Transforming S3 key to URL with thumbnails', {
        component: 'media-url-actions',
        operation: 'transformS3KeysToUrls',
        fieldName,
        s3Key: value,
      });

      try {
        const result = await getPrivateFileUrl({
          s3Key: value,
          ...context,
          includeThumbnails: true, // Always include thumbnails for display
        });

        if (result.success && result.signedUrl) {
          transformedData[fieldName] = result.signedUrl;

          // Store thumbnails in a separate field if they exist
          if (result.thumbnails) {
            transformedData[`${fieldName}_thumbnails`] = result.thumbnails;
          }

          logger.info('Successfully transformed S3 key to URL with thumbnails', {
            component: 'media-url-actions',
            operation: 'transformS3KeysToUrls',
            fieldName,
            hasThumbnails: !!result.thumbnails,
          });
        }
      } catch (error) {
        logger.error('Failed to transform S3 key to URL', {
          component: 'media-url-actions',
          operation: 'transformS3KeysToUrls',
          fieldName,
          error: error instanceof Error ? error.message : String(error),
        });
        // Keep original value if transformation fails
      }
    }
  }

  return transformedData;
}
