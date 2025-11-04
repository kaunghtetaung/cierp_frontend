/**
 * Example: Media API Route with JWT Access Control
 *
 * This shows how to integrate JWT-based access control in your API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { validateS3Access, createUserContextFromJWT } from '@repo/s3/middleware/access-control';
import type { UserS3Context } from '@repo/s3/types/roles';

// ============================================================================
// EXAMPLE 1: List Files with Access Control
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    // Get JWT from your session/auth system
    const jwt = await getJWTFromSession(request); // Your implementation

    // Create user context from JWT
    const userContext = createUserContextFromJWT(jwt);

    // Validate access
    const accessCheck = validateS3Access(userContext, 'list', path);

    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: 'Access denied', reason: accessCheck.reason },
        { status: 403 }
      );
    }

    // Create S3 client with user's tenant
    const s3Client = createTenantS3Client({
      tenantId: userContext.tenantId,
      tenantRootDomain: userContext.tenantRootDomain,
      app: 'core',
      basePath: path,
    });

    // List objects
    const result = await s3Client.listObjects('');

    // Generate pre-signed URLs for files user can access
    const filesWithUrls = await Promise.all(
      result.objects
        .filter((obj) => !obj.key.endsWith('/'))
        .map(async (obj) => {
          // Check if user can read this file
          const canRead = validateS3Access(userContext, 'read', `${path}/${obj.key}`);

          if (!canRead.allowed) {
            return null; // Skip files user can't access
          }

          const url = await s3Client.getPreSignedUrl(obj.key, {
            expiresIn: 3600,
          });

          return {
            key: obj.key,
            name: obj.key.split('/').pop() || obj.key,
            size: obj.size,
            type: obj.contentType || '',
            url,
            lastModified: obj.lastModified,
            isFolder: false,
          };
        })
    );

    const filteredFiles = filesWithUrls.filter(Boolean);

    return NextResponse.json({
      files: filteredFiles,
      folders: result.folders,
      total: filteredFiles.length,
    });
  } catch (error) {
    console.error('Media list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list media' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 2: Upload File with Access Control
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get JWT and create user context
    const jwt = await getJWTFromSession(request);
    const userContext = createUserContextFromJWT(jwt);

    // Validate write access
    const accessCheck = validateS3Access(userContext, 'write', path);

    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: 'Access denied', reason: accessCheck.reason },
        { status: 403 }
      );
    }

    // Create S3 client
    const s3Client = createTenantS3Client({
      tenantId: userContext.tenantId,
      tenantRootDomain: userContext.tenantRootDomain,
      app: 'core',
      basePath: path,
    });

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const key = await s3Client.putObject(file.name, buffer, {
      contentType: file.type,
    });

    // Generate pre-signed URL
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
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 3: Delete File with Access Control
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { keys } = body as { keys: string[] };

    if (!keys || keys.length === 0) {
      return NextResponse.json({ error: 'No keys provided' }, { status: 400 });
    }

    // Get JWT and create user context
    const jwt = await getJWTFromSession(request);
    const userContext = createUserContextFromJWT(jwt);

    // Validate delete access for each key
    for (const key of keys) {
      const accessCheck = validateS3Access(userContext, 'delete', key);

      if (!accessCheck.allowed) {
        return NextResponse.json(
          {
            error: 'Access denied',
            reason: `Cannot delete ${key}: ${accessCheck.reason}`,
          },
          { status: 403 }
        );
      }
    }

    // Create S3 client
    const s3Client = createTenantS3Client({
      tenantId: userContext.tenantId,
      tenantRootDomain: userContext.tenantRootDomain,
      app: 'core',
    });

    // Delete objects
    await s3Client.deleteObjects(keys);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete files' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper: Get JWT from Session
// ============================================================================

/**
 * Get JWT from your session/auth system
 * Replace this with your actual implementation
 */
async function getJWTFromSession(request: NextRequest): Promise<any> {
  // Option 1: From cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  // Decode JWT (use your JWT library)
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // For now, return mock JWT structure
  // REPLACE THIS WITH YOUR ACTUAL JWT DECODING
  return {
    sub: 'user-123',
    email: 'user@example.com',
    tenantId: 'um1ygn',
    tenantRootDomain: 'um1ygn.edu.mm',
    roles: ['organizationMember'], // or ['organizationAdmin']
    departmentIds: ['dept-cs', 'dept-it'],
  };
}

// ============================================================================
// Example JWT Structures for Different Users
// ============================================================================

/*
// Organization Admin (full access)
{
  "sub": "admin-001",
  "email": "admin@um1ygn.edu.mm",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["organizationAdmin"],
  "departmentIds": []
}

// Organization Member (read common, read/write personal)
{
  "sub": "user-123",
  "email": "user@um1ygn.edu.mm",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["organizationMember"],
  "departmentIds": []
}

// Department Admin (manage department folder)
{
  "sub": "dept-admin-cs",
  "email": "cs-admin@um1ygn.edu.mm",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["departmentAdmin", "organizationMember"],
  "departmentIds": ["dept-cs"]
}

// Department Member (read department folder)
{
  "sub": "student-456",
  "email": "student@um1ygn.edu.mm",
  "tenantId": "um1ygn",
  "tenantRootDomain": "um1ygn.edu.mm",
  "roles": ["departmentMember", "organizationMember"],
  "departmentIds": ["dept-cs", "dept-it"]
}
*/
