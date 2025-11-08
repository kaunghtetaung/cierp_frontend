/**
 * Media Delete API Route
 * DELETE /api/media/delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';
import { logger } from '@repo/utils/common/logger';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, keys } = body as { path: string; keys: string[] };

    logger.info('Media delete request received', {
      component: 'media-delete-api',
      operation: 'delete',
      path,
      keysCount: keys?.length || 0,
    });

    if (!keys || keys.length === 0) {
      logger.warn('Delete request with no keys', {
        component: 'media-delete-api',
        operation: 'delete',
      });
      return NextResponse.json(
        { error: 'No keys provided' },
        { status: 400 }
      );
    }

    // Get tenant info from x-tenant-id header
    const tenantInfo = await resolveTenantFromHeaders(request);

    // Get app from x-app-id header (e.g., "cpms", "library", "core", "ctms")
    const app = request.headers.get('x-app-id') || 'core';

    logger.debug('Delete operation started', {
      component: 'media-delete-api',
      operation: 'delete',
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      path,
      keys,
    });

    // Create S3 client with tenant context and basePath
    const s3Client = await createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path, // Include the current folder path
    });

    // Delete objects (keys are relative to basePath)
    await s3Client.deleteObjects(keys);

    logger.info('Media delete successful', {
      component: 'media-delete-api',
      operation: 'delete',
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      app,
      path,
      keysCount: keys.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Media delete failed', {
      component: 'media-delete-api',
      operation: 'delete',
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to delete files',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
