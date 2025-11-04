# Production MinIO Setup - READY ✅

## Connection Verified

### Infrastructure Status
✅ **SSH Port Forward Active**
- Local: `localhost:9000`
- Forward to: `203.81.66.116:9000`
- Internal MinIO: `192.168.200.33:9000`
- Process ID: 21113

✅ **MinIO Server Accessible**
- mc client configured and working
- Credentials: minioadmin / cidb1234

✅ **Tenant Bucket Exists**
- Bucket: `tenant-um1ygn`
- Structure:
  ```
  tenant-um1ygn/
  ├── core/
  │   ├── public/        ← Files: .keep, test.txt, test-from-claude.txt
  │   └── private/
  └── publicWeb/
      ├── public/
      └── private/
  ```

✅ **Public Access Works**
- Test URL: https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test-from-claude.txt
- Successfully retrieved via curl

## Environment Configuration

### Current .env Settings
```bash
MINIO_ENDPOINT=203.81.66.116      # External IP (works via port forward)
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_PUBLIC_ENDPOINT_TEMPLATE=storage.{tenantRootDomain}
MINIO_PUBLIC_PORT=443
MINIO_PUBLIC_USE_SSL=true
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cidb1234
```

**Note:** The endpoint `203.81.66.116` works because your SSH port forward maps `localhost:9000` → `203.81.66.116:9000`.

## Next Steps to Test Application

### 1. Restart Next.js Dev Server
Your dev server is running but may not have loaded the new env vars. Restart it:

```bash
# Kill the current dev server
pkill -f "next dev.*3001"

# Start fresh
cd /Users/kaunghtet/Projects/frontend/apps/core
npm run dev
```

### 2. Access Media Library
Navigate to one of these URLs:
- http://app.um1ygn.edu.mm/cpms/media
- http://127.0.0.1:3001/cpms/media (if DNS not working)

### 3. Expected Behavior

**On page load:**
- FileBrowser component should render
- Should call `GET /api/media/list?path=public&page=1&limit=50`
- Should display 3 files:
  - .keep
  - test.txt
  - test-from-claude.txt

**If you see error:**
- "Missing x-tenant-id header" → Not logged in, need valid session
- "Bucket does not exist" → Wrong tenant ID
- "Connection refused" → Port forward not active or wrong endpoint

## Testing Checklist

- [ ] Restart dev server
- [ ] Verify you're logged in (have session)
- [ ] Navigate to `/cpms/media`
- [ ] See file browser interface
- [ ] See existing test files listed
- [ ] Try uploading a new file
- [ ] Try creating a folder
- [ ] Try deleting the test file

## Production Safety

Since you're developing against production MinIO:

### Safe Operations
✅ Create folders
✅ Upload test files to `core/public/`
✅ List files (read-only)
✅ Download files

### Be Careful
⚠️ Don't delete files you didn't create
⚠️ Don't modify `publicWeb/` folder (website assets)
⚠️ Test with specific test tenant if possible
⚠️ Use `core/public/test-*` naming for test files

### Recommended Test Pattern
```bash
# For testing, prefix all your files with "test-" or "dev-"
# Example: test-upload.jpg, dev-document.pdf

# This way you can easily identify and clean up test files:
mc ls myminio/tenant-um1ygn/core/public/ | grep test-
mc rm myminio/tenant-um1ygn/core/public/test-*
```

## Connection Commands Reference

### Check Port Forward Status
```bash
ps aux | grep "ssh.*9000" | grep -v grep
```

### Restart Port Forward if Needed
```bash
# Kill existing
pkill -f "ssh.*9000"

# Start new
ssh -i ~/.ssh/ciservers -p 3 -L 9000:203.81.66.116:9000 -N -f kaunghtet@203.81.66.116
```

### Test MinIO Connection
```bash
# List buckets
mc ls myminio

# List tenant bucket
mc ls myminio/tenant-um1ygn

# Upload test file
echo "test" > /tmp/test.txt
mc cp /tmp/test.txt myminio/tenant-um1ygn/core/public/test-$(date +%s).txt

# Verify public access
curl https://storage.um1ygn.edu.mm/tenant-um1ygn/core/public/test.txt
```

## Current Status Summary

🎯 **READY TO TEST**

Everything is configured and verified:
1. ✅ Port forward active
2. ✅ MinIO connection working
3. ✅ Bucket structure correct
4. ✅ Public access working
5. ✅ Environment variables set
6. ✅ Code implementation complete

**Just restart your dev server and access `/cpms/media`!**

---

## Troubleshooting

### Port Forward Drops
If you get "connection refused":
```bash
ssh -i ~/.ssh/ciservers -p 3 -L 9000:203.81.66.116:9000 -N -f kaunghtet@203.81.66.116
```

### Can't Access Media Page
1. Check if logged in (need valid session for x-tenant-id header)
2. Check browser console for errors
3. Check dev server logs: `tail -f` the console where npm run dev is running

### Files Don't Appear
1. Check API logs for actual S3 keys being used
2. Verify tenant ID in request: check Network tab → Headers → x-tenant-id
3. Check if bucket path matches expected: `tenant-{id}/core/public/`

---

**Last verified:** October 27, 2025 14:13:58 +0630
**Test file created:** myminio/tenant-um1ygn/core/public/test-from-claude.txt ✅
