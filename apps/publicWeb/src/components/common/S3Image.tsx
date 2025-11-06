"use client";

import Image, { ImageProps } from "next/image";

/**
 * S3Image Component
 *
 * A wrapper around Next.js Image component that automatically handles S3/storage URLs
 * by bypassing Next.js image optimization for external storage domains.
 *
 * This solves the multi-tenant problem where you can't predict all storage domains upfront.
 *
 * Usage:
 * ```tsx
 * <S3Image src="https://storage.um1ygn.edu.mm/path/to/image.jpg" alt="Logo" width={80} height={80} />
 * <S3Image src="https://minio.example.com/bucket/image.png" alt="Photo" width={100} height={100} />
 * <S3Image src="https://s3.amazonaws.com/bucket/image.jpg" alt="AWS" width={150} height={150} />
 * ```
 *
 * Features:
 * - Automatically detects S3/storage URLs and bypasses optimization
 * - Supports all Next.js Image props
 * - Works with ANY storage domain regardless of TLD (multi-tenant friendly)
 * - Falls back to optimized images for local/CDN URLs
 * - Supports: MinIO, AWS S3, Cloudflare R2, DigitalOcean Spaces, etc.
 */
export function S3Image({ src, ...props }: ImageProps) {
  // Check if the image is from a storage/S3 domain
  // Pattern-based detection works across all TLDs (.com, .edu, .mm, .io, etc.)
  const isStorageUrl = typeof src === 'string' && (
    src.includes('storage.') ||      // storage.um1ygn.edu.mm, storage.tenant.com
    src.includes('s3.') ||            // s3.amazonaws.com, s3.eu-west-1.amazonaws.com
    src.includes('minio.') ||         // minio.example.com, minio.tenant.io
    src.includes('.s3.') ||           // bucket.s3.amazonaws.com
    src.includes('.r2.') ||           // Cloudflare R2: *.r2.cloudflarestorage.com
    src.includes('digitaloceanspaces.com') || // DigitalOcean Spaces
    src.includes('blob.core.windows.net') ||  // Azure Blob Storage
    src.includes('storage.googleapis.com') || // Google Cloud Storage
    src.includes('cdn.') ||           // Generic CDN that might serve from storage
    src.includes('assets.')           // Generic assets subdomain for storage
  );

  return (
    <Image
      src={src}
      {...props}
      unoptimized={isStorageUrl}
    />
  );
}

export default S3Image;
