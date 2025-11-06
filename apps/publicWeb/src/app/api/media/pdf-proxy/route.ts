/**
 * PDF Proxy API Route for publicWeb app
 * Streams private PDF files from S3 with page-by-page watermark overlay
 *
 * How it works:
 * 1. Validate session and permissions
 * 2. For page requests: Call PDF watermark service
 * 3. For metadata requests: Fetch full PDF from S3 (cached 24h)
 *
 * The PDF watermark service handles:
 * - Fetching from S3
 * - Redis caching (3min TTL)
 * - Page extraction
 * - Watermark application (diagonal grid pattern)
 *
 * Query parameters:
 * - file: S3 file path (required)
 * - app: App name for S3 bucket (default: 'publicWeb')
 * - watermark: Watermark text (optional)
 * - page: Page number to fetch (1-indexed, optional - if not provided, sends full PDF)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createTenantS3Client } from '@repo/s3/client';
import { validateRequest } from '@repo/auth/core';
import { COOKIE_NAMES } from '@repo/utils/common/constants';
import { getCacheInstance, CacheKeys } from '@repo/cache';
import { createPdfServiceClient } from '@repo/pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache TTL for PDFs in Redis (24 hours)
const PDF_CACHE_TTL = 24 * 60 * 60;

/**
 * GET handler for PDF proxy with watermark
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('file');
    const app = searchParams.get('app') || 'publicWeb';
    const watermarkText = searchParams.get('watermark');
    const pageNum = searchParams.get('page'); // Optional: page number (1-indexed)

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing file parameter' },
        { status: 400 }
      );
    }

    // Validate session using cookies
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (!sessionId) {
      console.log('[PDF_PROXY] No session cookie found');
      return NextResponse.json({ error: 'No active session. Please log in to read eBooks.' }, { status: 401 });
    }

    // Validate session
    const sessionInfo = await validateRequest(sessionId, {
      ipAddress: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    });

    if (!sessionInfo.isAuthenticated || !sessionInfo.session) {
      console.log('[PDF_PROXY] Session validation failed');
      return NextResponse.json({ error: 'Session not found or invalid. Please log in to read eBooks.' }, { status: 401 });
    }

    const { tenantId, userId } = sessionInfo.session;
    const userEmail = sessionInfo.user?.email;

    console.log('[PDF_PROXY] Session validated:', {
      userId,
      userEmail,
      tenantId,
    });

    console.log('[PDF_PROXY] Request:', {
      filePath,
      app,
      pageNum,
      hasWatermark: !!watermarkText,
    });

    // Get tenant slug from cache
    const tenantSlug = await getTenantSlugFromCache(tenantId);

    if (!tenantSlug) {
      console.log('[PDF_PROXY] Failed to resolve tenant slug');
      return NextResponse.json({ error: 'Failed to resolve tenant' }, { status: 500 });
    }

    // Extract root domain from host header
    const host = request.headers.get('host');
    const tenantRootDomain = host ? extractRootDomain(host) : undefined;

    // Extract relative path (remove app prefix and leading slash if present)
    let relativePath = filePath;
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }
    if (relativePath.startsWith(`${app}/`)) {
      relativePath = relativePath.substring(`${app}/`.length);
    }

    // Create cache key for this PDF
    const cache = getCacheInstance();
    const pdfCacheKey = `pdf:${tenantId}:${app}:${relativePath}`;

    console.log('[PDF_PROXY] Cache key:', pdfCacheKey);

    // Try to get PDF from Redis cache
    let pdfBuffer: Buffer;
    const cachedPdf = await cache.get(pdfCacheKey);

    if (cachedPdf && Buffer.isBuffer(cachedPdf)) {
      console.log('[PDF_PROXY] PDF found in cache');
      pdfBuffer = cachedPdf;
    } else {
      // Not in cache - fetch from S3
      console.log('[PDF_PROXY] PDF not in cache, fetching from S3...');

      const s3Client = createTenantS3Client({
        tenantId,
        tenantSlug,
        tenantRootDomain,
        app,
        basePath: '',
      });

      pdfBuffer = await s3Client.getObject(relativePath);
      console.log('[PDF_PROXY] PDF fetched from S3, size:', pdfBuffer.length, 'bytes');

      // Cache the PDF in Redis for 24 hours
      await cache.set(pdfCacheKey, pdfBuffer, PDF_CACHE_TTL);
      console.log('[PDF_PROXY] PDF cached in Redis');
    }

    // If page number is specified, use PDF watermark service
    if (pageNum) {
      const page = parseInt(pageNum, 10);
      if (isNaN(page) || page < 1) {
        return NextResponse.json(
          { error: 'Invalid page number' },
          { status: 400 }
        );
      }

      console.log('[PDF_PROXY] Requesting watermarked page from PDF service:', page);

      try {
        const pdfServiceClient = createPdfServiceClient();

        const watermarkedPage = await pdfServiceClient.getWatermarkedPage({
          filePath: relativePath,
          pageNumber: page,
          userName: userEmail || userId,
          userId: userId,
          watermarkText: watermarkText || 'CONFIDENTIAL',
          tenantId: tenantId,
          tenantName: tenantSlug,
          outputFormat: 'pdf', // Use PDF format for viewer compatibility
        });

        console.log('[PDF_PROXY] Watermarked page received from PDF service');

        return new NextResponse(watermarkedPage, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': watermarkedPage.length.toString(),
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Content-Disposition': 'inline',
          },
        });
      } catch (pdfServiceError) {
        console.error('[PDF_PROXY] PDF service error:', pdfServiceError);
        return NextResponse.json(
          { error: 'Failed to watermark PDF page', details: pdfServiceError instanceof Error ? pdfServiceError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    // No page specified - return full PDF (for initial metadata/page count)
    // Don't watermark the full PDF, let the viewer request pages individually
    console.log('[PDF_PROXY] Returning full PDF (no watermark)');
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('[PDF_PROXY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * NOTE: Watermarking is now handled by the centralized PDF watermark service
 * The old extractAndWatermarkPage function has been removed
 * See PDF_IMPLEMENTATION_BACKUP.md for the original implementation
 */

/**
 * Get tenant slug from cache
 */
async function getTenantSlugFromCache(tenantId: string): Promise<string | null> {
  try {
    const cache = getCacheInstance();
    const tenantSettings = await cache.get(CacheKeys.tenantSettings(tenantId));

    if (tenantSettings && typeof tenantSettings === 'object' && 'slug' in tenantSettings) {
      return (tenantSettings as any).slug;
    }

    return null;
  } catch (error) {
    console.error('[PDF_PROXY] Failed to get tenant slug from cache:', error);
    return null;
  }
}

/**
 * Extract root domain from host
 */
function extractRootDomain(host: string): string {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Split by dots
  const parts = hostname.split('.');

  // If only 2 parts (e.g., example.com), return as is
  if (parts.length <= 2) {
    return hostname;
  }

  // If 3+ parts (e.g., app.um1ygn.edu.mm), remove first part
  // Return: um1ygn.edu.mm
  return parts.slice(1).join('.');
}
