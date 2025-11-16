/**
 * Complete Media API Implementation
 * Using your actual JWT structure and x-tenant-id header
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantS3Client } from '@repo/s3';
import { validateS3Access } from '@repo/s3/middleware/access-control';
import { resolveTenantFromHeaders } from '@repo/s3/middleware/tenant-resolver';
import { parseJWTToS3Context, type CrystalImageJWT } from '@repo/s3/middleware/jwt-parser';
import type { ListMediaResponse } from '@repo/media';

// ============================================================================
// LIST API: GET /api/media/list
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    // Step 1: Get tenant from x-tenant-id header
    const tenantInfo = resolveTenantFromHeaders(request);
    // tenantInfo = { tenantId: "68e0b62131f65aa7c3783438", tenantRootDomain: "um1ygn.edu.mm" }

    // Step 2: Get JWT from session
    const jwt = await getJWTFromSession(request);
    /*
    jwt = {
      sub: "68e0b62131f65aa7c3783438",
      role: "systemAdmin",
      roles: [{
        Organization: "*",
        Department: "*",
        Role: "systemAdmin"
      }]
    }
    */

    // Step 3: Parse JWT to S3 context
    const userContext = parseJWTToS3Context(
      jwt,
      tenantInfo.tenantId,
      tenantInfo.tenantRootDomain
    );
    /*
    userContext = {
      userId: "68e0b62131f65aa7c3783438",
      tenantId: "68e0b62131f65aa7c3783438",
      tenantRootDomain: "um1ygn.edu.mm",
      roles: ["organizationAdmin"],
      departmentIds: []
    }
    */

    // Step 4: Validate access
    const accessCheck = validateS3Access(userContext, 'list', path);

    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: 'Access denied', reason: accessCheck.reason },
        { status: 403 }
      );
    }

    // Step 5: Create S3 client
    const s3Client = createTenantS3Client({
      tenantId: tenantInfo.tenantId,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app: 'core',
      basePath: path,
    });

    // Step 6: List objects
    const result = await s3Client.listObjects('');

    // Step 7: Generate pre-signed URLs (check permissions per file)
    const filesWithUrls = await Promise.all(
      result.objects
        .filter((obj) => !obj.key.endsWith('/'))
        .map(async (obj) => {
          // Check read permission for this specific file
          const canRead = validateS3Access(userContext, 'read', `${path}/${obj.key}`);

          if (!canRead.allowed) {
            return null; // Skip files user can't read
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

    const folders = result.folders.map((folder) => {
      const folderName = folder.split('/').filter(Boolean).pop() || folder;
      return {
        name: folderName,
        path: folder,
      };
    });

    const response: ListMediaResponse = {
      files: filteredFiles as any,
      folders,
      total: filteredFiles.length + folders.length,
      hasMore: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Media list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list media' },
      { status: 500 }
    );
  }
}

// ============================================================================
// UPLOAD API: POST /api/media/upload
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get tenant and user context
    const tenantInfo = resolveTenantFromHeaders(request);
    const jwt = await getJWTFromSession(request);
    const userContext = parseJWTToS3Context(jwt, tenantInfo.tenantId, tenantInfo.tenantRootDomain);

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

    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer());
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
// DELETE API: DELETE /api/media/delete
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { keys } = body as { keys: string[] };

    if (!keys || keys.length === 0) {
      return NextResponse.json({ error: 'No keys provided' }, { status: 400 });
    }

    // Get tenant and user context
    const tenantInfo = resolveTenantFromHeaders(request);
    const jwt = await getJWTFromSession(request);
    const userContext = parseJWTToS3Context(jwt, tenantInfo.tenantId, tenantInfo.tenantRootDomain);

    // Validate delete access for each file
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
      tenantId: tenantInfo.tenantId,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app: 'core',
    });

    // Delete files
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
 * Get and decode JWT from your authentication system
 * Replace this with your actual implementation
 */
async function getJWTFromSession(request: NextRequest): Promise<CrystalImageJWT> {
  // TODO: Replace with your actual session/JWT decoding
  // Example implementations:

  // Option 1: From cookie
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  // Option 2: Use your session library
  // import { getSession } from '@repo/security';
  // const session = await getSession(request);
  // return session.jwt;

  // Decode JWT (use your JWT library)
  // import { jwtVerify } from 'jose';
  // const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  // const { payload } = await jwtVerify(token, secret);
  // return payload as CrystalImageJWT;

  // For development, return mock JWT
  // REMOVE THIS IN PRODUCTION
  return {
    sub: '68e0b62131f65aa7c3783438',
    name: 'System Administrator',
    username: 'admin',
    email: 'admin@crystal-image.net',
    role: 'systemAdmin',
    roles: [
      {
        Organization: '*',
        Department: '*',
        Role: 'systemAdmin',
        _id: '68e0b62131f65aa7c3783439',
      },
    ],
  };
}

// ============================================================================
// Example Requests
// ============================================================================

/*
# List files (system admin)
curl -H "x-tenant-id: 68e0b62131f65aa7c3783438" \
     -H "Cookie: auth_token=<jwt>" \
     https://app.crystal-image.net/api/media/list?path=core/public

# Upload file (to personal folder)
curl -X POST \
     -H "x-tenant-id: 68e0b62131f65aa7c3783438" \
     -H "Cookie: auth_token=<jwt>" \
     -F "file=@photo.jpg" \
     -F "path=core/private/personal/68e0b62131f65aa7c3783438" \
     https://app.crystal-image.net/api/media/upload

# Delete file
curl -X DELETE \
     -H "x-tenant-id: 68e0b62131f65aa7c3783438" \
     -H "Cookie: auth_token=<jwt>" \
     -H "Content-Type: application/json" \
     -d '{"keys":["core/public/old-file.jpg"]}' \
     https://app.crystal-image.net/api/media/delete
*/

// ============================================================================
// JWT Examples for Different Users
// ============================================================================

/*
// System Admin (full access)
{
  sub: "68e0b62131f65aa7c3783438",
  role: "systemAdmin",
  roles: [{
    Organization: "*",
    Department: "*",
    Role: "systemAdmin"
  }]
}
→ S3 Roles: ["organizationAdmin"]
→ Can access everything

// Department Admin (CS Department)
{
  sub: "user123",
  roles: [{
    Organization: "org1",
    Department: "dept-cs",
    Role: "departmentAdmin"
  }]
}
→ S3 Roles: ["departmentAdmin", "organizationMember"]
→ Department IDs: ["dept-cs"]
→ Can manage core/private/departments/dept-cs/*

// Student (CS Department)
{
  sub: "student456",
  roles: [{
    Organization: "org1",
    Department: "dept-cs",
    Role: "student"
  }]
}
→ S3 Roles: ["departmentMember", "organizationMember"]
→ Department IDs: ["dept-cs"]
→ Can read core/private/departments/dept-cs/* (read-only)

// Regular Staff Member
{
  sub: "staff789",
  role: "staff"
}
→ S3 Roles: ["organizationMember"]
→ Department IDs: []
→ Can access public, common, and own personal folder
*/
