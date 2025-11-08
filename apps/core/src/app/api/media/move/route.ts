/**
 * Media Move API Route
 * POST /api/media/move
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceKeys, destinationPath } = body as {
      sourceKeys: string[];
      destinationPath: string;
    };

    if (!sourceKeys || sourceKeys.length === 0 || !destinationPath) {
      return NextResponse.json(
        { error: 'Source keys and destination path are required' },
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

    // Move each file
    await Promise.all(
      sourceKeys.map(async (sourceKey) => {
        const fileName = sourceKey.split('/').pop() || sourceKey;
        const destKey = destinationPath ? `${destinationPath}/${fileName}` : fileName;
        await s3Client.moveObject(sourceKey, destKey);
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Move error:', error);
    return NextResponse.json(
      { error: 'Failed to move files' },
      { status: 500 }
    );
  }
}
