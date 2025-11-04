# MinIO OIDC Integration Guide

## Overview

Configure MinIO to use JWT tokens from your OIDC server for authentication and authorization. This enables **S3-level access control** based on JWT claims, eliminating the need for application-level enforcement or MinIO IAM user management.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  1. User logs in via OIDC server                            │
│  2. Receives JWT with claims: { role, orgSlug, deptSlug }   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ JWT Token
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  MinIO S3 Request                            │
│  Authorization: Bearer {jwt-token}                           │
│  OR                                                          │
│  Use JWT as temporary credentials (AssumeRoleWithWebIdentity)│
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MinIO Server                              │
│  1. Validate JWT signature with OIDC server                 │
│  2. Extract claims: { role, orgSlug, deptSlug, username }   │
│  3. Look up policy by role name                             │
│  4. Apply policy with variable substitution                 │
│     ${jwt:orgSlug}, ${jwt:deptSlug}, ${jwt:username}        │
│  5. Enforce access at S3 level                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Your JWT Token Structure

```json
{
  "sub": "68e0b62131f65aa7c3783438",
  "username": "admin",
  "email": "admin@crystal-image.net",
  "role": "systemAdmin",
  "roles": [
    {
      "Organization": "*",
      "OrgSlug": "all",
      "Department": "*",
      "DeptSlug": "all",
      "Role": "systemAdmin"
    }
  ],
  "organizationId": "68d12d98e776d47ad2004ef6",
  "departmentId": "68d12d98e776d47ad2005201",
  "orgSlug": "crystal-image",
  "deptSlug": "crystal-image-ict-department",
  "iss": "http://www.crystal-image.net:3332",
  "aud": "3xYfhMvgNUPjh0Xbb7gAmSnCORPawCTvIMSq4KHQ8",
  "exp": 1761805966,
  "iat": 1761802366
}
```

### Claims Available for MinIO Policies:

- `${jwt:username}` → `"admin"`
- `${jwt:role}` → `"systemAdmin"` (policy name)
- `${jwt:orgSlug}` → `"crystal-image"` (bucket name)
- `${jwt:deptSlug}` → `"crystal-image-ict-department"`
- `${jwt:sub}` → User ID
- `${jwt:email}` → User email

---

## Step 1: Configure MinIO OIDC

### Option A: Using Environment Variables (Recommended for Docker)

Add to your MinIO server environment:

```bash
# MinIO OIDC Configuration
MINIO_IDENTITY_OPENID_CONFIG_URL="http://www.crystal-image.net:3332/.well-known/openid-configuration"
MINIO_IDENTITY_OPENID_CLIENT_ID="minio-client"
MINIO_IDENTITY_OPENID_CLIENT_SECRET="your-client-secret"  # If required by your OIDC
MINIO_IDENTITY_OPENID_CLAIM_NAME="role"                   # JWT claim that contains policy name
MINIO_IDENTITY_OPENID_CLAIM_PREFIX=""                     # No prefix needed
MINIO_IDENTITY_OPENID_SCOPES="openid,profile,email"
MINIO_IDENTITY_OPENID_REDIRECT_URI="http://localhost:9001/oauth_callback"  # MinIO Console callback
MINIO_IDENTITY_OPENID_DISPLAY_NAME="OIDC Login"
```

### Option B: Using MinIO Client (mc)

```bash
# Add OIDC configuration
mc admin config set myminio identity_openid \
  config_url="http://www.crystal-image.net:3332/.well-known/openid-configuration" \
  client_id="minio-client" \
  client_secret="your-client-secret" \
  claim_name="role" \
  claim_prefix="" \
  scopes="openid,profile,email" \
  redirect_uri="http://localhost:9001/oauth_callback" \
  display_name="OIDC Login"

# Restart MinIO to apply configuration
mc admin service restart myminio
```

### Verify Configuration

```bash
mc admin config get myminio identity_openid
```

---

## Step 2: Create MinIO Policies

### 1. systemAdmin Policy

**File:** `systemAdmin.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": ["arn:aws:s3:::*"]
    }
  ]
}
```

**Apply:**
```bash
mc admin policy create myminio systemAdmin systemAdmin.json
```

---

### 2. organizationAdmin Policy

**File:** `organizationAdmin.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FullAccessPrivateCommon",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/core/private/common/*"
      ]
    },
    {
      "Sid": "ReadOnlyDepartments",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/core/private/departments/*"
      ]
    },
    {
      "Sid": "FullAccessPublic",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/core/public/*",
        "arn:aws:s3:::${jwt:orgSlug}/publicWeb/public/*"
      ]
    },
    {
      "Sid": "FullAccessOwnPersonal",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/personal/${jwt:username}/*"
      ]
    }
  ]
}
```

**Apply:**
```bash
mc admin policy create myminio organizationAdmin organizationAdmin.json
```

---

### 3. departmentAdmin Policy

**File:** `departmentAdmin.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FullAccessOwnDepartment",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/core/private/departments/${jwt:deptSlug}/*"
      ]
    },
    {
      "Sid": "ReadOnlyCommon",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/core/private/common/*"
      ]
    },
    {
      "Sid": "FullAccessPublic",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/core/public/*"
      ]
    },
    {
      "Sid": "FullAccessOwnPersonal",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/personal/${jwt:username}/*"
      ]
    }
  ]
}
```

**Apply:**
```bash
mc admin policy create myminio departmentAdmin departmentAdmin.json
```

---

### 4. user Policy (Regular User)

**File:** `user.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyPublic",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/*/public/*"
      ]
    },
    {
      "Sid": "FullAccessOwnPersonal",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${jwt:orgSlug}",
        "arn:aws:s3:::${jwt:orgSlug}/personal/${jwt:username}/*"
      ]
    }
  ]
}
```

**Apply:**
```bash
mc admin policy create myminio user user.json
```

---

### List All Policies

```bash
mc admin policy list myminio
```

Expected output:
```
systemAdmin
organizationAdmin
departmentAdmin
user
```

---

## Step 3: Update S3 Client to Use JWT

You need to use **AssumeRoleWithWebIdentity** to exchange JWT for temporary S3 credentials.

### Create JWT-to-S3 Credentials Function

**File:** `/libs/s3/src/auth/oidc-credentials.ts`

```typescript
import { STSClient, AssumeRoleWithWebIdentityCommand } from '@aws-sdk/client-sts';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

export interface OIDCCredentialsParams {
  jwtToken: string;
  stsEndpoint: string;      // MinIO endpoint
  roleArn?: string;         // Optional - MinIO may not require
  sessionName?: string;
}

/**
 * Exchange OIDC JWT token for temporary S3 credentials
 * Uses STS AssumeRoleWithWebIdentity
 */
export async function getS3CredentialsFromJWT(
  params: OIDCCredentialsParams
): Promise<AwsCredentialIdentity> {
  const { jwtToken, stsEndpoint, roleArn, sessionName = 'minio-session' } = params;

  const stsClient = new STSClient({
    endpoint: stsEndpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'unused',
      secretAccessKey: 'unused',
    },
  });

  const command = new AssumeRoleWithWebIdentityCommand({
    WebIdentityToken: jwtToken,
    RoleArn: roleArn || 'arn:aws:iam::1:role/dummy', // MinIO may not validate ARN
    RoleSessionName: sessionName,
    DurationSeconds: 3600, // 1 hour
  });

  try {
    const response = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error('No credentials returned from STS');
    }

    return {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken,
      expiration: response.Credentials.Expiration,
    };
  } catch (error) {
    console.error('[OIDC] Failed to get credentials from JWT:', error);
    throw error;
  }
}
```

---

### Update S3 Client Configuration

**File:** `/libs/s3/src/config.ts`

Add new function:

```typescript
import { getS3CredentialsFromJWT } from './auth/oidc-credentials';

export interface JWTBasedS3Config {
  jwtToken: string;
  endpoint: string;
  port?: number;
  useSSL?: boolean;
  region?: string;
}

/**
 * Get S3 config using JWT token (OIDC-based)
 */
export async function getS3ConfigFromJWT(params: JWTBasedS3Config): Promise<S3Config> {
  const { jwtToken, endpoint, port, useSSL = false, region = 'us-east-1' } = params;

  // Get temporary credentials from JWT
  const credentials = await getS3CredentialsFromJWT({
    jwtToken,
    stsEndpoint: `${useSSL ? 'https' : 'http'}://${endpoint}${port ? `:${port}` : ''}`,
  });

  return {
    endpoint,
    port,
    useSSL,
    region,
    accessKey: credentials.accessKeyId,
    secretKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
    bucketStrategy: 'per-tenant',
  };
}
```

---

### Update TenantS3Client to Support JWT

**File:** `/libs/s3/src/client/tenant-s3-client.ts`

Add JWT-based constructor:

```typescript
export class TenantS3Client {
  // ... existing code

  /**
   * Create TenantS3Client with JWT authentication
   */
  static async createWithJWT(
    context: TenantS3Context,
    jwtToken: string
  ): Promise<TenantS3Client> {
    const baseConfig = getS3Config();

    // Get temporary credentials from JWT
    const s3Config = await getS3ConfigFromJWT({
      jwtToken,
      endpoint: baseConfig.endpoint,
      port: baseConfig.port,
      useSSL: baseConfig.useSSL,
      region: baseConfig.region,
    });

    const tenantConfig: S3Config = {
      ...s3Config,
      bucketName: context.tenantSlug,
    };

    const client = new S3Client(tenantConfig);
    return new TenantS3Client(context, client);
  }
}
```

---

## Step 4: Update PDF Proxy to Use JWT

**File:** `/apps/core/src/app/api/media/pdf-proxy/route.ts`

```typescript
import { TenantS3Client } from '@repo/s3/client';

export async function GET(request: NextRequest) {
  // ... existing session validation

  // Extract JWT token from session or header
  const jwtToken = extractJWTToken(sessionInfo); // You need to implement this

  // Create S3 client with JWT (no root admin credentials!)
  const s3Client = await TenantS3Client.createWithJWT(
    {
      tenantId,
      tenantSlug,
      tenantRootDomain,
      app,
      basePath: '',
    },
    jwtToken
  );

  // MinIO will enforce access control based on JWT claims
  // No need for application-level checkS3Access()
  const pdfBuffer = await s3Client.getObject(relativePath);

  // ... rest of PDF processing
}
```

---

## Step 5: Update Media Actions

**File:** `/apps/core/src/actions/media.ts`

```typescript
import { TenantS3Client } from '@repo/s3/client';

export async function listMediaAction(params: { ... }) {
  // Get session and extract JWT
  const session = await getServerSession();
  const jwtToken = session.accessToken; // Assuming session contains JWT

  // Create S3 client with JWT
  const s3Client = await TenantS3Client.createWithJWT(
    {
      tenantId: tenantInfo.tenantId,
      tenantSlug: tenantInfo.tenantSlug,
      tenantRootDomain: tenantInfo.tenantRootDomain,
      app,
      basePath: params.path || '',
    },
    jwtToken
  );

  // Access control is enforced by MinIO - no application checks needed
  const result = await s3Client.listObjects(params.path || '');

  return result;
}
```

---

## Step 6: Testing

### Test 1: System Admin - Full Access

```bash
# Login as systemAdmin and get JWT
TOKEN="eyJhbG..."  # Your JWT token

# Try accessing any bucket/path - should succeed
aws s3 ls s3://crystal-image/core/private/common/ \
  --endpoint-url http://localhost:9000 \
  --profile oidc  # Configure profile to use JWT

# Should succeed - systemAdmin has full access
```

### Test 2: Organization Admin - Private Common (Write)

```bash
# Login as organizationAdmin (orgSlug: "crystal-image")
TOKEN="eyJhbG..."

# Upload to private/common - should succeed
aws s3 cp test.pdf s3://crystal-image/core/private/common/test.pdf \
  --endpoint-url http://localhost:9000

# Try to access different org's bucket - should fail
aws s3 ls s3://different-org/core/private/common/ \
  --endpoint-url http://localhost:9000
# Error: Access Denied
```

### Test 3: Department Admin - Own Department (Write)

```bash
# Login as departmentAdmin (orgSlug: "crystal-image", deptSlug: "ict")
TOKEN="eyJhbG..."

# Upload to own department - should succeed
aws s3 cp doc.pdf s3://crystal-image/core/private/departments/ict/doc.pdf \
  --endpoint-url http://localhost:9000

# Try to upload to different department - should fail
aws s3 cp doc.pdf s3://crystal-image/core/private/departments/hr/doc.pdf \
  --endpoint-url http://localhost:9000
# Error: Access Denied
```

### Test 4: Regular User - Personal Folder Only

```bash
# Login as regular user (username: "john.doe")
TOKEN="eyJhbG..."

# Upload to personal folder - should succeed
aws s3 cp file.pdf s3://crystal-image/personal/john.doe/file.pdf \
  --endpoint-url http://localhost:9000

# Try to access private folder - should fail
aws s3 ls s3://crystal-image/core/private/common/ \
  --endpoint-url http://localhost:9000
# Error: Access Denied
```

---

## Benefits of OIDC Integration

✅ **S3-Level Security**: MinIO enforces access control, not your application
✅ **No Root Credentials**: Each user uses their JWT token
✅ **Dynamic Policies**: Variables like `${jwt:orgSlug}` adapt to each user
✅ **Audit Trail**: MinIO logs show actual user identity
✅ **Zero Trust**: Application doesn't need to be trusted
✅ **Simplified Code**: Remove application-level access checks

---

## Migration Checklist

- [ ] Configure MinIO OIDC with your OIDC server
- [ ] Create MinIO policies (systemAdmin, organizationAdmin, departmentAdmin, user)
- [ ] Implement `getS3CredentialsFromJWT()` function
- [ ] Update `TenantS3Client.createWithJWT()` method
- [ ] Update PDF proxy to use JWT credentials
- [ ] Update media actions to use JWT credentials
- [ ] Remove root admin credential usage
- [ ] Test each role's access permissions
- [ ] Remove application-level `checkS3Access()` (optional - can keep as fallback)
- [ ] Update documentation

---

## Troubleshooting

### Issue: JWT validation fails

```bash
# Check OIDC configuration
mc admin config get myminio identity_openid

# Verify OIDC discovery URL is accessible
curl http://www.crystal-image.net:3332/.well-known/openid-configuration

# Check MinIO logs
mc admin logs myminio
```

### Issue: Policy not found

```bash
# List all policies
mc admin policy list myminio

# Check if policy exists
mc admin policy info myminio systemAdmin
```

### Issue: Access denied despite correct role

- Verify JWT `role` claim matches policy name exactly
- Check policy JSON syntax
- Ensure policy variables (`${jwt:orgSlug}`) match JWT claim names
- Verify bucket names match `orgSlug` values

---

## Summary

With MinIO OIDC integration:

1. **OIDC server issues JWT** with `role`, `orgSlug`, `deptSlug`, `username` claims
2. **MinIO validates JWT** and extracts claims
3. **MinIO applies policy** matching the `role` claim
4. **Policy uses variables** like `${jwt:orgSlug}` for dynamic access
5. **S3 enforces access** - no application-level checks needed

This is the **enterprise-grade solution** for multi-tenant S3 access control!
