/**
 * Updated API Example with Header-Based Tenant Resolution
 *
 * This shows the correct implementation using:
 * - x-tenant-id header (MongoDB ObjectID)
 * - host header (for tenant root domain)
 * - JWT token (for user roles and permissions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import {
  validateS3Access,
  createUserContextFromJWT,
} from '@repo/s3/middleware/access-control';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';

// ============================================================================
// EXAMPLE 1: List Files with Complete Access Control
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    // Step 1: Get tenant info from headers
    // x-tenant-id: MongoDB ObjectID (e.g., "507f1f77bcf86cd799439011")
    // host: Full hostname (e.g., "app.um1ygn.edu.mm")
    const tenantInfo = resolveTenantFromHeaders(request);
    // Returns: { tenantId: "507f1f77bcf86cd799439011", tenantRootDomain: "um1ygn.edu.mm" }

    // Step 2: Get and decode JWT from your auth system
    const jwt = await getJWTFromSession(request); // Your implementation
    // JWT contains: { sub, roles, departmentIds, ... }

    // Step 3: Create user context (combines JWT + tenant headers)
    const userContext = createUserContextFromJWT(
      jwt,
      tenantInfo.tenantId,
      tenantInfo.tenantRootDomain
    );

    // Step 4: Validate access
    const accessCheck = validateS3Access(userContext, 'list', path);

    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: 'Access denied', reason: accessCheck.reason },
        { status: 403 }
      );
    }

    // Step 5: Create S3 client with tenant from header
    const s3Client = createTenantS3Client({
      tenantId: tenantInfo.tenantId, // MongoDB ID from header
      tenantRootDomain: tenantInfo.tenantRootDomain, // From host
      app: 'core',
      basePath: path,
    });

    // Step 6: List objects
    const result = await s3Client.listObjects('');

    // Step 7: Generate pre-signed URLs
    const filesWithUrls = await Promise.all(
      result.objects
        .filter((obj) => !obj.key.endsWith('/'))
        .map(async (obj) => {
          const canRead = validateS3Access(userContext, 'read', `${path}/${obj.key}`);

          if (!canRead.allowed) {
            return null;
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
// EXAMPLE 2: Upload File
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get tenant from headers
    const tenantInfo = resolveTenantFromHeaders(request);

    // Get JWT
    const jwt = await getJWTFromSession(request);

    // Create user context
    const userContext = createUserContextFromJWT(
      jwt,
      tenantInfo.tenantId,
      tenantInfo.tenantRootDomain
    );

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
      tenantId: tenantInfo.tenantId,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app: 'core',
      basePath: path,
    });

    // Upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await s3Client.putObject(file.name, buffer, {
      contentType: file.type,
    });

    // Generate URL
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
// Helper: Get JWT from Session (Your Implementation)
// ============================================================================

/**
 * Get JWT from your session/auth system
 * Replace this with your actual implementation
 */
async function getJWTFromSession(request: NextRequest): Promise<any> {
  // Get token from cookies or headers
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  // Decode JWT using your library
  // Example with jose:
  // import { jwtVerify } from 'jose';
  // const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  // const { payload } = await jwtVerify(token, secret);
  // return payload;

  // For now, return mock structure
  // REPLACE WITH YOUR ACTUAL JWT DECODING
  return {
    sub: 'user-123',
    email: 'user@example.com',
    roles: ['organizationMember'],
    departmentIds: ['dept-cs'],
  };
}

// ============================================================================
// Example Request Headers
// ============================================================================

/*
INCOMING REQUEST HEADERS:

GET /api/media/list?path=core/public HTTP/1.1
Host: app.um1ygn.edu.mm
x-tenant-id: 507f1f77bcf86cd799439011
Cookie: auth_token=eyJhbGc...

EXTRACTED VALUES:

tenantInfo = {
  tenantId: "507f1f77bcf86cd799439011",      // From x-tenant-id header (MongoDB ID)
  tenantRootDomain: "um1ygn.edu.mm"          // Extracted from host header
}

jwt = {
  sub: "user-123",                           // User ID
  roles: ["organizationMember"],             // User roles
  departmentIds: ["dept-cs"]                 // User departments
}

userContext = {
  userId: "user-123",                        // From JWT
  tenantId: "507f1f77bcf86cd799439011",     // From header
  tenantRootDomain: "um1ygn.edu.mm",        // From header
  roles: ["organizationMember"],             // From JWT
  departmentIds: ["dept-cs"]                 // From JWT
}

S3 BUCKET NAME:
tenant-507f1f77bcf86cd799439011

S3 PUBLIC URL:
https://storage.um1ygn.edu.mm/tenant-507f1f77bcf86cd799439011/core/public/file.jpg
*/

// ============================================================================
// Testing Examples
// ============================================================================

/*
// Test with curl

# List public files (any user)
curl -H "x-tenant-id: 507f1f77bcf86cd799439011" \
     -H "Cookie: auth_token=<user-jwt>" \
     https://app.um1ygn.edu.mm/api/media/list?path=core/public

# Upload to personal folder (own files only)
curl -X POST \
     -H "x-tenant-id: 507f1f77bcf86cd799439011" \
     -H "Cookie: auth_token=<user-jwt>" \
     -F "file=@photo.jpg" \
     -F "path=core/private/personal/user-123" \
     https://app.um1ygn.edu.mm/api/media/upload

# Try to access another user's files (should fail)
curl -H "x-tenant-id: 507f1f77bcf86cd799439011" \
     -H "Cookie: auth_token=<user-jwt>" \
     https://app.um1ygn.edu.mm/api/media/list?path=core/private/personal/user-456
# Expected: 403 Forbidden

# Admin accessing everything (should succeed)
curl -H "x-tenant-id: 507f1f77bcf86cd799439011" \
     -H "Cookie: auth_token=<admin-jwt>" \
     https://app.um1ygn.edu.mm/api/media/list?path=core/private
# Expected: 200 OK
*/
