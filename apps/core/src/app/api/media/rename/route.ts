/**
 * Media Rename API Route
 * POST /api/media/rename
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, newName } = body as { key: string; newName: string };

    if (!key || !newName) {
      return NextResponse.json(
        { error: 'Key and new name are required' },
        { status: 400 }
      );
    }

    // Get tenant info from x-tenant-id header
    const tenantInfo = await resolveTenantFromHeaders(request);
    // Get app from x-app-id header (e.g., "cpms", "library", "core", "ctms")
    const app = request.headers.get('x-app-id') || 'core';

    // Create S3 client with tenant context
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
    });

    // Rename (move) object
    await s3Client.renameObject(key, newName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rename error:', error);
    return NextResponse.json(
      { error: 'Failed to rename file' },
      { status: 500 }
    );
  }
}
