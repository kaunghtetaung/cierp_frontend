/**
 * Media Create Folder API Route
 * POST /api/media/create-folder
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, folderName } = body as { path: string; folderName: string };

    if (!folderName) {
      return NextResponse.json(
        { error: 'Folder name is required' },
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
      basePath: path,
    });

    // Create folder
    await s3Client.createFolder(folderName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
