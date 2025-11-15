# Reverse Proxy Setup Instructions

## Server Info
- **Server**: 203.81.66.115
- **User**: kaunghtet
- **SSH**: `ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.115`
- **Sudo Password**: `Cryst@l123!`

## Step 1: Check Current Nginx Configuration

```bash
# Connect to reverse proxy server
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.115

# Check if nginx is installed
nginx -v

# List current sites
ls -la /etc/nginx/sites-enabled/

# Check current configuration
cat /etc/nginx/nginx.conf

# Check for existing storage proxy config
ls -la /etc/nginx/sites-available/ | grep storage
```

## Step 2: Review Existing Configuration

Before adding the storage proxy, check:

1. **SSL Certificate Location**:
   ```bash
   # Find SSL certificates
   sudo find /etc -name "*.crt" -o -name "*.pem" 2>/dev/null | grep -E "(ssl|cert|letsencrypt)"
   ```

2. **Current Proxy Patterns**:
   ```bash
   # Check how other subdomains are configured
   grep -r "server_name" /etc/nginx/sites-enabled/
   ```

3. **Port Forwarding**:
   ```bash
   # Check if MinIO internal IP is accessible
   curl -I http://192.168.200.33:9000/minio/health/live
   ```

## Step 3: Install Storage Proxy Configuration

### Option A: From Local Machine

If you can access the proxy server:

```bash
# From your local machine
cd /Users/kaunghtet/Projects/frontend

# Copy config to server
scp -i ~/.ssh/ciservers -P 3 nginx-storage-proxy.conf kaunghtet@203.81.66.115:/tmp/

# SSH and install
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.115

# Move to nginx sites-available
echo 'Cryst@l123!' | sudo -S cp /tmp/nginx-storage-proxy.conf /etc/nginx/sites-available/storage-proxy

# Enable site
echo 'Cryst@l123!' | sudo -S ln -s /etc/nginx/sites-available/storage-proxy /etc/nginx/sites-enabled/

# Test configuration
echo 'Cryst@l123!' | sudo -S nginx -t

# If test passes, reload
echo 'Cryst@l123!' | sudo -S systemctl reload nginx
```

### Option B: Manual Configuration

If copying files doesn't work, manually create the config:

```bash
ssh -i ~/.ssh/ciservers -p 3 kaunghtet@203.81.66.115

# Create config file
echo 'Cryst@l123!' | sudo -S nano /etc/nginx/sites-available/storage-proxy
```

Then paste the content from `nginx-storage-proxy.conf`.

## Step 4: Update SSL Certificates

Depending on your current SSL setup:

### If using Let's Encrypt:

```bash
# Install certbot if not installed
echo 'Cryst@l123!' | sudo -S apt-get update
echo 'Cryst@l123!' | sudo -S apt-get install certbot python3-certbot-nginx

# Get certificate for storage subdomain
# Note: You need to do this for each tenant domain
echo 'Cryst@l123!' | sudo -S certbot --nginx -d storage.um1ygn.edu.mm
```

### If using Wildcard Certificate:

Update the nginx config to point to your wildcard cert:

```nginx
ssl_certificate /path/to/your/wildcard.crt;
ssl_certificate_key /path/to/your/wildcard.key;
```

## Step 5: Configure DNS

Ensure DNS records exist for storage subdomain:

```
Type: A or CNAME
Name: storage.um1ygn.edu.mm
Value: 203.81.66.115
```

## Step 6: Test Configuration

### From Reverse Proxy Server:

```bash
# Test internal MinIO access
curl http://192.168.200.33:9000/minio/health/live

# Test nginx config
echo 'Cryst@l123!' | sudo -S nginx -t

# Check nginx status
systemctl status nginx

# View nginx error log
echo 'Cryst@l123!' | sudo -S tail -f /var/log/nginx/error.log
```

### From External:

```bash
# Test HTTPS access
curl -I https://storage.um1ygn.edu.mm/minio/health/live

# Test file access
curl https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test.txt
```

## Step 7: Firewall Configuration

If connection fails, check firewall:

```bash
# Check if firewall is active
echo 'Cryst@l123!' | sudo -S ufw status

# Allow HTTPS if needed
echo 'Cryst@l123!' | sudo -S ufw allow 443/tcp

# Check iptables
echo 'Cryst@l123!' | sudo -S iptables -L -n | grep 443
```

## Troubleshooting

### Issue: Connection Timeout

```bash
# Check if nginx is listening on 443
echo 'Cryst@l123!' | sudo -S netstat -tlnp | grep :443

# Check if MinIO is accessible from proxy server
curl -v http://192.168.200.33:9000
```

### Issue: 502 Bad Gateway

```bash
# Check nginx error logs
echo 'Cryst@l123!' | sudo -S tail -100 /var/log/nginx/error.log

# Check if MinIO is running
curl http://192.168.200.33:9000/minio/health/live
```

### Issue: SSL Certificate Error

```bash
# Check certificate validity
echo 'Cryst@l123!' | sudo -S openssl x509 -in /path/to/cert.pem -text -noout

# Renew Let's Encrypt certificate
echo 'Cryst@l123!' | sudo -S certbot renew
```

## Expected Result

After successful setup, you should be able to access:

```bash
# Public file via HTTPS
https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test.txt

# MinIO health check
https://storage.um1ygn.edu.mm/minio/health/live
```

## Next Steps After Proxy Setup

1. Test file upload via Next.js API
2. Test pre-signed URL generation
3. Configure tenant domain resolution in application
4. Add more tenant buckets as needed

## Important Notes

- The reverse proxy server may not be accessible from external networks
- You may need to configure this from within your internal network
- SSL certificates need to be configured for each tenant domain
- Wildcard certificates (*.example.com) can cover all tenant subdomains
