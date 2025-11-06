/**
 * PDF Proxy API Route for publicWeb app
 * Proxy for PDF watermark service with session validation
 *
 * Flow:
 * 1. Browser → Next.js API Route (validate session)
 * 2. Next.js → PDF Service (with S3 path + user info)
 * 3. PDF Service → S3 (fetch PDF with caching)
 * 4. PDF Service → Watermark + Cache
 * 5. PDF Service → Next.js → Browser
 *
 * The PDF watermark service handles:
 * - S3 file fetching
 * - Redis caching (input PDFs and output pages)
 * - Page extraction
 * - Watermark application (diagonal grid pattern)
 *
 * Query parameters:
 * - file: S3 file path from backend (e.g., /private/common/ebooks/xxx.pdf)
 * - app: App name for S3 bucket (default: 'publicWeb')
 * - watermark: Watermark text (optional)
 * - page: Page number to fetch (1-indexed, required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateRequest } from '@repo/auth/core';
import { COOKIE_NAMES } from '@repo/utils/common/constants';
import { getCacheInstance, CacheKeys } from '@repo/cache';
import { createPdfServiceClient } from '@repo/pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET handler for PDF proxy with watermark
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('file');
    const app = searchParams.get('app') || 'library';
    const watermarkText = searchParams.get('watermark');
    const pageNum = searchParams.get('page'); // Required: page number (1-indexed)

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing file parameter' },
        { status: 400 }
      );
    }

    if (!pageNum) {
      return NextResponse.json(
        { error: 'Missing page parameter' },
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

    // Get tenant slug from cache
    const tenantSlug = await getTenantSlugFromCache(tenantId);

    if (!tenantSlug) {
      console.log('[PDF_PROXY] Failed to resolve tenant slug');
      return NextResponse.json({ error: 'Failed to resolve tenant' }, { status: 500 });
    }

    // Extract relative path (remove leading slash if present)
    let relativePath = filePath;
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }

    // Build S3 path: {tenantSlug}/{app}/{relativePath}
    // Example: um1/library/private/common/ebooks/68d14ff9125447a7a4f8161c.pdf
    const s3Path = `${tenantSlug}/${app}/${relativePath}`;

    const page = parseInt(pageNum, 10);
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    console.log('[PDF_PROXY] Requesting page', page, 'from PDF service. S3 path:', s3Path);

    try {
      const pdfServiceClient = createPdfServiceClient();

      const watermarkedPage = await pdfServiceClient.getWatermarkedPage({
        filePath: s3Path, // Full S3 path: bucket/app/file
        pageNumber: page,
        userName: userEmail || userId,
        userId: userId,
        watermarkText: watermarkText || 'CONFIDENTIAL',
        tenantId: tenantId,
        tenantName: tenantSlug,
        outputFormat: 'pdf', // PDF format for viewer compatibility
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
