# MinIO Setup Guide

## Architecture

```
Public Internet
    ↓
storage.{tenantRootDomain}:443 (HTTPS)
    ↓
Reverse Proxy Server (192.168.200.33:3)
    ↓
MinIO Server (192.168.200.33:9000) - Internal
```

## Server Access

```bash
# MinIO Server
ssh -i ~/.ssh/ciservers -p 33 ciadmin@192.168.200.33

# Reverse Proxy
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@192.168.200.33
```

## MinIO Credentials

```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cidb1234
MINIO_ADDRESS=:9000
MINIO_CONSOLE=:9001
```

## Step 1: Install MinIO Client (mc)

On MinIO server or your local machine:

```bash
# Download mc
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure alias for your MinIO server
mc alias set myminio http://192.168.200.33:9000 minioadmin cidb1234
```

## Step 2: Create Tenant Bucket Script

Create `/root/setup-tenant-bucket.sh`:

```bash
#!/bin/bash
# setup-tenant-bucket.sh - Create tenant bucket with proper structure

if [ -z "$1" ]; then
    echo "Usage: $0 <tenant-id>"
    echo "Example: $0 tenant123"
    exit 1
fi

TENANT_ID=$1
BUCKET_NAME="tenant-${TENANT_ID}"

echo "Creating bucket for tenant: ${TENANT_ID}"

# Create bucket
mc mb myminio/${BUCKET_NAME}

echo "✓ Bucket created: ${BUCKET_NAME}"

# Create folder structure (using placeholder files)
echo "Creating folder structure..."

mc cp /dev/null myminio/${BUCKET_NAME}/core/public/.keep
mc cp /dev/null myminio/${BUCKET_NAME}/core/private/common/.keep
mc cp /dev/null myminio/${BUCKET_NAME}/core/private/personal/.keep
mc cp /dev/null myminio/${BUCKET_NAME}/core/private/departments/.keep
mc cp /dev/null myminio/${BUCKET_NAME}/core/private/library/.keep
mc cp /dev/null myminio/${BUCKET_NAME}/publicWeb/public/.keep

echo "✓ Folder structure created"

# Set anonymous download policy for public folders
echo "Setting public read access for public folders..."

cat > /tmp/public-policy-${TENANT_ID}.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::${BUCKET_NAME}/core/public/*",
        "arn:aws:s3:::${BUCKET_NAME}/publicWeb/public/*"
      ]
    }
  ]
}
EOF

mc anonymous set-json /tmp/public-policy-${TENANT_ID}.json myminio/${BUCKET_NAME}

rm /tmp/public-policy-${TENANT_ID}.json

echo "✓ Public access policies set"
echo ""
echo "Bucket setup complete for tenant: ${TENANT_ID}"
echo "Bucket name: ${BUCKET_NAME}"
echo ""
echo "Public folders (read-only):"
echo "  - ${BUCKET_NAME}/core/public/*"
echo "  - ${BUCKET_NAME}/publicWeb/public/*"
echo ""
echo "Private folders:"
echo "  - ${BUCKET_NAME}/core/private/common/* (org members read)"
echo "  - ${BUCKET_NAME}/core/private/personal/{userId}/* (owner only)"
echo "  - ${BUCKET_NAME}/core/private/departments/{deptId}/* (dept members)"
echo "  - ${BUCKET_NAME}/core/private/library/* (protected PDFs)"
```

Make it executable:

```bash
chmod +x /root/setup-tenant-bucket.sh
```

## Step 3: Create Tenant Buckets

For each tenant:

```bash
# Example: Create bucket for tenant "tenant123"
/root/setup-tenant-bucket.sh tenant123

# List buckets to verify
mc ls myminio/

# List folder structure
mc tree myminio/tenant-tenant123/
```

## Step 4: Configure Reverse Proxy

On reverse proxy server (192.168.200.33:3), add Nginx configuration:

```nginx
# /etc/nginx/sites-available/storage-proxy

# Catch-all for storage.{domain}
server {
    listen 443 ssl http2;
    server_name ~^storage\.(?<tenant_domain>.+)$;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Large file uploads
    client_max_body_size 500M;
    proxy_request_buffering off;

    location / {
        # Proxy to internal MinIO
        proxy_pass http://192.168.200.33:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for MinIO console if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for large files
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/storage-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Test Configuration

```bash
# From MinIO server or your machine with mc installed

# Upload test file
echo "Hello World" > /tmp/test.txt
mc cp /tmp/test.txt myminio/tenant-tenant123/core/public/test.txt

# Generate pre-signed URL
mc share download myminio/tenant-tenant123/core/public/test.txt

# Test public access (should work without auth)
curl https://storage.tenant123.example.com/tenant-tenant123/core/public/test.txt
```

## Step 6: Application Configuration

In your Next.js app `.env.local`:

```bash
# Internal endpoint (server-side)
MINIO_ENDPOINT=192.168.200.33
MINIO_PORT=9000
MINIO_USE_SSL=false

# Public endpoint (client-side via reverse proxy)
MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
MINIO_PUBLIC_PORT=443
MINIO_PUBLIC_USE_SSL=true

# Credentials
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cidb1234

# Bucket strategy
MINIO_BUCKET_STRATEGY=per-tenant
```

## Maintenance Scripts

### List all tenant buckets
```bash
mc ls myminio/ | grep "tenant-"
```

### Get bucket size
```bash
mc du myminio/tenant-tenant123
```

### Delete tenant bucket (careful!)
```bash
mc rb --force myminio/tenant-tenant123
```

### Backup tenant bucket
```bash
mc mirror myminio/tenant-tenant123 /backup/tenant-tenant123
```

## Access Policies (TODO: After JWT structure provided)

Will need to configure IAM policies based on:
- User roles (organizationAdmin, departmentAdmin, etc.)
- User ID for personal folders
- Department IDs for department folders

**Next step:** Provide JWT token structure to complete access policy configuration.

## Troubleshooting

### Check MinIO service
```bash
systemctl status minio
journalctl -u minio -f
```

### Test internal access
```bash
curl http://192.168.200.33:9000/minio/health/live
```

### Test public access
```bash
curl https://storage.tenant123.example.com/minio/health/live
```

### View MinIO logs
```bash
# On MinIO server
tail -f /var/log/minio/minio.log
```
