/**
 * Media Upload API Route
 * POST /api/media/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { getMimeType } from '@repo/s3/utils';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
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

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const key = await s3Client.putObject(file.name, buffer, {
      contentType: file.type || getMimeType(file.name),
    });

    // Generate pre-signed URL for the uploaded file
    const url = await s3Client.getPreSignedUrl(file.name, {
      expiresIn: 3600,
    });

    return NextResponse.json({
      key,
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      lastModified: new Date(),
      isFolder: false,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
