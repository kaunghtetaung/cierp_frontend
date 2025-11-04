/**
 * PDF Proxy API Route
 * Streams PDF files from S3 with watermark overlay
 * Supports HTTP Range requests for page-by-page loading
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

    console.log('[PDF_PROXY] Fetching PDF:', {
      filePath,
      app,
      hasWatermark: !!watermarkText,
    });

    // Get tenant slug from cache (instead of resolveTenantFromHeaders which fails in iframe)
    const tenantSlug = await getTenantSlugFromCache(tenantId);

    if (!tenantSlug) {
      console.log('[PDF_PROXY] Failed to resolve tenant slug');
      return NextResponse.json({ error: 'Failed to resolve tenant' }, { status: 500 });
    }

    // Extract root domain from host header
    const host = request.headers.get('host');
    const tenantRootDomain = host ? extractRootDomain(host) : undefined;

    console.log('[PDF_PROXY] Tenant info:', {
      tenantId,
      tenantSlug,
      tenantRootDomain,
    });

    // Create S3 client with tenant context
    const s3Client = createTenantS3Client({
      tenantId,
      tenantSlug,
      tenantRootDomain,
      app,
      basePath: '',
    });

    // Check if this is a Range request (for page-by-page loading)
    const rangeHeader = request.headers.get('range');

    // Extract relative path (remove app prefix if present)
    // filePath is like "core/public/file.pdf", we need "public/file.pdf"
    const relativePath = filePath.startsWith(`${app}/`)
      ? filePath.substring(`${app}/`.length)
      : filePath;

    console.log('[PDF_PROXY] Fetching file:', {
      originalPath: filePath,
      relativePath,
    });

    // Fetch the PDF from S3
    const pdfBuffer = await s3Client.getObject(relativePath);

    console.log('[PDF_PROXY] PDF fetched, size:', pdfBuffer.length, 'bytes');

    // Check if PDF is encrypted and add watermark if requested
    let finalPdfBuffer = pdfBuffer;
    if (watermarkText) {
      const isEncrypted = await isPdfEncrypted(pdfBuffer);

      if (isEncrypted) {
        console.log('[PDF_PROXY] PDF is encrypted/password-protected - skipping watermark');
      } else {
        console.log('[PDF_PROXY] PDF is not encrypted - adding watermark...');
        finalPdfBuffer = await addWatermarkToPdf(pdfBuffer, watermarkText, {
          userId,
          userEmail,
        });
      }
    }

    // Handle Range requests for partial content (page-by-page loading)
    if (rangeHeader) {
      console.log('[PDF_PROXY] Handling Range request:', rangeHeader);
      return handleRangeRequest(finalPdfBuffer, rangeHeader);
    }

    // Return the full PDF
    console.log('[PDF_PROXY] Returning full PDF');
    return new NextResponse(finalPdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': finalPdfBuffer.length.toString(),
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
 * Check if PDF is encrypted/password-protected
 */
async function isPdfEncrypted(pdfBuffer: Buffer): Promise<boolean> {
  try {
    // Try to load the PDF without ignoreEncryption
    await PDFDocument.load(pdfBuffer);
    // If it loads successfully, it's not encrypted
    return false;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // Check if the error is about encryption
    if (errorMsg.includes('encrypted') || errorMsg.includes('password')) {
      return true;
    }
    // Other errors (corrupted PDF, etc.) - treat as not encrypted
    return false;
  }
}

/**
 * Add watermark to PDF
 */
async function addWatermarkToPdf(
  pdfBuffer: Buffer,
  watermarkText: string,
  session: { userId: string; userEmail?: string }
): Promise<Buffer> {
  try {
    // Try to load the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Create watermark text with user info
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log('[PDF_PROXY] Adding watermark to', pages.length, 'pages');

    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();

      // Center diagonal watermark
      const centerText = watermarkText;
      const centerFontSize = 48;
      const centerWidth = font.widthOfTextAtSize(centerText, centerFontSize);

      page.drawText(centerText, {
        x: (width - centerWidth) / 2,
        y: height / 2,
        size: centerFontSize,
        font: font,
        color: rgb(0.85, 0.85, 0.85),
        opacity: 0.3,
        rotate: { angle: -45, type: 'degrees' },
      });

      // Footer watermark with user info
      const footerText = `${session.userEmail || session.userId} - ${timestamp}`;
      page.drawText(footerText, {
        x: 50,
        y: 30,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
        opacity: 0.6,
      });
    }

    // Save the modified PDF
    const watermarkedPdfBytes = await pdfDoc.save();
    console.log('[PDF_PROXY] Watermark added successfully');
    return Buffer.from(watermarkedPdfBytes);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log('[PDF_PROXY] Cannot add watermark (PDF may be encrypted):', errorMsg);
    // If watermarking fails (encrypted/password-protected), return original PDF
    return pdfBuffer;
  }
}

/**
 * Handle HTTP Range requests for partial content
 */
function handleRangeRequest(buffer: Buffer, rangeHeader: string): NextResponse {
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
  const chunkSize = end - start + 1;
  const chunk = buffer.subarray(start, end + 1);

  return new NextResponse(chunk, {
    status: 206, // Partial Content
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': chunkSize.toString(),
      'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
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
