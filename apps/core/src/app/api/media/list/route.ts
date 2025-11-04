/**
 * Media List API Route
 * GET /api/media/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';
import type { ListMediaResponse } from '@repo/media';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    // Get tenant info from headers
    // Requires: x-tenant-id header (MongoDB ObjectID)
    const tenantInfo = await resolveTenantFromHeaders(request);

    // Get app from x-app-id header (e.g., "cpms", "library", "core", "ctms")
    const app = request.headers.get('x-app-id') || 'core';

    // Create S3 client with tenant context
    const s3Client = createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: path,
    });

    // List objects
    const result = await s3Client.listObjects('');

    // Generate pre-signed URLs for files
    const filesWithUrls = await Promise.all(
      result.objects
        .filter((obj) => !obj.key.endsWith('/')) // Exclude folder markers
        .map(async (obj) => {
          const url = await s3Client.getPreSignedUrl(obj.key, {
            expiresIn: 3600,
          });

          return {
            key: obj.key,
            name: obj.key.split('/').pop() || obj.key,
            size: obj.size,
            type: '', // TODO: Get from metadata
            url,
            lastModified: obj.lastModified,
            isFolder: false,
          };
        })
    );

    // Format folders
    const folders = result.folders.map((folder) => {
      const folderName = folder.split('/').filter(Boolean).pop() || folder;
      return {
        name: folderName,
        path: folder,
      };
    });

    const response: ListMediaResponse = {
      files: filesWithUrls,
      folders,
      total: filesWithUrls.length + folders.length,
      hasMore: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Media list error:', error);
    return NextResponse.json(
      { error: 'Failed to list media' },
      { status: 500 }
    );
  }
}
