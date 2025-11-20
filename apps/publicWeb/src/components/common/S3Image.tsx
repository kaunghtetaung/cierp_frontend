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
  // Normalize the src to ensure it's valid for Next.js Image
  let normalizedSrc = src;

  if (typeof src === 'string') {
    // If it's a relative path (doesn't start with / or http:// or https://), prepend /
    if (!src.startsWith('/') && !src.startsWith('http://') && !src.startsWith('https://')) {
      normalizedSrc = `/${src}`;
    }
  }

  // Check if the image is from a storage/S3 domain
  // Pattern-based detection works across all TLDs (.com, .edu, .mm, .io, etc.)
  const isStorageUrl = typeof normalizedSrc === 'string' && (
    normalizedSrc.includes('storage.') ||      // storage.um1ygn.edu.mm, storage.tenant.com
    normalizedSrc.includes('s3.') ||            // s3.amazonaws.com, s3.eu-west-1.amazonaws.com
    normalizedSrc.includes('minio.') ||         // minio.example.com, minio.tenant.io
    normalizedSrc.includes('.s3.') ||           // bucket.s3.amazonaws.com
    normalizedSrc.includes('.r2.') ||           // Cloudflare R2: *.r2.cloudflarestorage.com
    normalizedSrc.includes('digitaloceanspaces.com') || // DigitalOcean Spaces
    normalizedSrc.includes('blob.core.windows.net') ||  // Azure Blob Storage
    normalizedSrc.includes('storage.googleapis.com') || // Google Cloud Storage
    normalizedSrc.includes('cdn.') ||           // Generic CDN that might serve from storage
    normalizedSrc.includes('assets.')           // Generic assets subdomain for storage
  );

  return (
    <Image
      src={normalizedSrc}
      {...props}
      unoptimized={isStorageUrl}
    />
  );
}

export default S3Image;
