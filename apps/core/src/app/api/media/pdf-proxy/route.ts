/**
 * PDF Proxy API Route for core app
 * Streams private PDF files from S3 with page-by-page watermark overlay
 *
 * How it works:
 * 1. First request: Fetch entire PDF from S3 → Cache in Redis (24h TTL)
 * 2. Page requests: Get from Redis → Watermark only requested page → Send that page
 *
 * Query parameters:
 * - file: S3 file path (required)
 * - app: App name for S3 bucket (default: 'core')
 * - watermark: Watermark text (optional)
 * - page: Page number to fetch (1-indexed, optional - if not provided, sends full PDF)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createTenantS3Client } from '@repo/s3/client';
import { validateRequest } from '@repo/auth/core';
import { COOKIE_NAMES } from '@repo/utils/common/constants';
import { getCacheInstance, CacheKeys } from '@repo/cache';

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
    const app = searchParams.get('app') || 'core';
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
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // Validate session
    const sessionInfo = await validateRequest(sessionId, {
      ipAddress: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    });

    if (!sessionInfo.isAuthenticated || !sessionInfo.session) {
      console.log('[PDF_PROXY] Session validation failed');
      return NextResponse.json({ error: 'Session not found or invalid' }, { status: 401 });
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

      const s3Client = await createTenantS3Client({
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

    // If page number is specified, return only that page with watermark
    if (pageNum) {
      const page = parseInt(pageNum, 10);
      if (isNaN(page) || page < 1) {
        return NextResponse.json(
          { error: 'Invalid page number' },
          { status: 400 }
        );
      }

      console.log('[PDF_PROXY] Extracting page', page);

      const singlePagePdf = await extractAndWatermarkPage(
        pdfBuffer,
        page,
        watermarkText || '',
        { userId, userEmail }
      );

      return new NextResponse(singlePagePdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': singlePagePdf.length.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Content-Disposition': 'inline',
        },
      });
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
 * Extract a single page from PDF and add watermark
 * @param pdfBuffer - Full PDF buffer (from cache or S3)
 * @param pageNumber - Page number to extract (1-indexed)
 * @param watermarkText - Text to use for center watermark
 * @param session - User session info for footer watermark
 * @returns Buffer containing single-page PDF with watermarks
 */
async function extractAndWatermarkPage(
  pdfBuffer: Buffer,
  pageNumber: number,
  watermarkText: string,
  session: { userId: string; userEmail?: string }
): Promise<Buffer> {
  try {
    // Load the original PDF
    const originalPdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const totalPages = originalPdf.getPageCount();

    // Validate page number
    if (pageNumber < 1 || pageNumber > totalPages) {
      throw new Error(`Invalid page number: ${pageNumber}. PDF has ${totalPages} pages.`);
    }

    console.log('[PDF_PROXY] Extracting page', pageNumber, 'of', totalPages);

    // Create a new PDF document for the single page
    const newPdf = await PDFDocument.create();

    // Copy the requested page (0-indexed in pdf-lib)
    const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNumber - 1]);
    const page = newPdf.addPage(copiedPage);

    // Add watermarks if watermarkText is provided
    if (watermarkText) {
      // Embed font
      const font = await newPdf.embedFont(StandardFonts.HelveticaBold);

      // Create timestamp
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const { width, height } = page.getSize();

      // Center diagonal watermark - CONFIDENTIAL
      const confidentialText = 'CONFIDENTIAL';
      const confidentialFontSize = 60;
      const confidentialWidth = font.widthOfTextAtSize(confidentialText, confidentialFontSize);

      page.drawText(confidentialText, {
        x: (width - confidentialWidth) / 2,
        y: height / 2 + 40,
        size: confidentialFontSize,
        font: font,
        color: rgb(0.9, 0.1, 0.1), // Red color for confidential
        opacity: 0.15,
        rotate: { angle: -45, type: 'degrees' },
      });

      // Center diagonal watermark - Document title
      const centerFontSize = 36;
      const centerWidth = font.widthOfTextAtSize(watermarkText, centerFontSize);

      page.drawText(watermarkText, {
        x: (width - centerWidth) / 2,
        y: height / 2 - 20,
        size: centerFontSize,
        font: font,
        color: rgb(0.85, 0.85, 0.85),
        opacity: 0.25,
        rotate: { angle: -45, type: 'degrees' },
      });

      // Footer watermark with user info and page number
      const footerText = `CONFIDENTIAL - ${session.userEmail || session.userId} - ${timestamp} - Page ${pageNumber}/${totalPages}`;
      page.drawText(footerText, {
        x: 50,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
        opacity: 0.7,
      });
    }

    // Save the single-page PDF
    const pdfBytes = await newPdf.save();
    console.log('[PDF_PROXY] Page extracted and watermarked, size:', pdfBytes.length, 'bytes');

    return Buffer.from(pdfBytes);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[PDF_PROXY] Error extracting/watermarking page:', errorMsg);
    throw error;
  }
}

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
