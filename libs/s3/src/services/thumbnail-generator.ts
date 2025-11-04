import sharp from 'sharp';

export interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
  quality: number;
}

export const THUMBNAIL_SIZES: Record<string, ThumbnailSize> = {
  small: { name: 'small', width: 150, height: 150, quality: 70 },
  medium: { name: 'medium', width: 300, height: 300, quality: 75 },
  large: { name: 'large', width: 600, height: 600, quality: 80 },
};

export interface ThumbnailResult {
  size: string;
  buffer: Buffer;
  key: string;
}

/**
 * Generate thumbnails for an image buffer
 * @param buffer - Original image buffer
 * @param originalKey - Original S3 key (e.g., "core/public/image.jpg")
 * @returns Array of thumbnail results with buffers and keys
 */
export async function generateImageThumbnails(
  buffer: Buffer,
  originalKey: string
): Promise<ThumbnailResult[]> {
  const results: ThumbnailResult[] = [];

  // Remove leading slash if present (S3 keys should be relative)
  const cleanKey = originalKey.replace(/^\/+/, '');

  // Extract directory and filename from original key
  const lastSlashIndex = cleanKey.lastIndexOf('/');
  const directory = lastSlashIndex > 0 ? cleanKey.substring(0, lastSlashIndex) : '';
  const filename = cleanKey.substring(lastSlashIndex + 1);
  const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  for (const [sizeName, sizeConfig] of Object.entries(THUMBNAIL_SIZES)) {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(sizeConfig.width, sizeConfig.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: sizeConfig.quality })
        .toBuffer();

      // Build thumbnail key: {directory}/.thumbnails/{filename}_{size}.webp
      // If directory is empty, don't add leading slash
      const thumbnailKey = directory
        ? `${directory}/.thumbnails/${filenameWithoutExt}_${sizeName}.webp`
        : `.thumbnails/${filenameWithoutExt}_${sizeName}.webp`;

      results.push({
        size: sizeName,
        buffer: thumbnailBuffer,
        key: thumbnailKey,
      });
    } catch (error) {
      console.error(`[ThumbnailGenerator] Failed to generate ${sizeName} thumbnail:`, error);
      // Continue with other sizes even if one fails
    }
  }

  return results;
}

/**
 * Check if file MIME type is an image that can be thumbnailed
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/') && !mimeType.includes('svg');
}

/**
 * Get thumbnail key for a given original key and size
 */
export function getThumbnailKey(originalKey: string, size: keyof typeof THUMBNAIL_SIZES): string {
  // Remove leading slash if present (S3 keys should be relative)
  const cleanKey = originalKey.replace(/^\/+/, '');

  const lastSlashIndex = cleanKey.lastIndexOf('/');
  const directory = lastSlashIndex > 0 ? cleanKey.substring(0, lastSlashIndex) : '';
  const filename = cleanKey.substring(lastSlashIndex + 1);
  const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  return `${directory}/.thumbnails/${filenameWithoutExt}_${size}.webp`;
}

/**
 * Check if thumbnails exist for a given file (images only)
 */
export function hasThumbnailSupport(filename: string, mimeType?: string): boolean {
  // If we have MIME type, use it
  if (mimeType) {
    return isImageFile(mimeType);
  }

  // Fallback to extension check
  const ext = filename.toLowerCase().split('.').pop();
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'];
  return supportedExtensions.includes(ext || '');
}
