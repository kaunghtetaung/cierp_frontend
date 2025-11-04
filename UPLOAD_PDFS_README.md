# PDF Batch Upload to MinIO Guide

## Overview

This guide explains how to upload 594 PDF files from `/Users/kaunghtet/Projects/ciapp/tools/um1data/pdfNews` to MinIO S3 storage.

**Target Location:**
- Bucket: `um1`
- Path: `library/public/abstracts/`
- Files: All PDF files with UUID filenames (e.g., `015c2751-51cc-4301-bef4-af1d6a17e733.pdf`)

## Prerequisites

1. **MinIO Server Running**
   ```bash
   # Verify MinIO is accessible
   curl http://192.168.200.33:9000/minio/health/live
   ```

2. **Environment Variables Set**
   - Ensure `.env` file exists with MinIO credentials:
   ```bash
   MINIO_ENDPOINT=192.168.200.33
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=cidb1234
   MINIO_REGION=us-east-1
   ```

3. **Dependencies Installed**
   ```bash
   pnpm install
   ```

## Usage

### Step 1: Review the Script

Check what will be uploaded:
```bash
ls -lh /Users/kaunghtet/Projects/ciapp/tools/um1data/pdfNews | head -20
```

### Step 2: Run the Upload Script

```bash
cd /Users/kaunghtet/Projects/frontend
node scripts/upload-pdfs-to-minio.js
```

### Step 3: Monitor Progress

The script will:
- ✅ Show progress for each file
- ⏭️  Skip files that already exist (safe to re-run)
- ❌ Report any errors
- 📊 Display summary at the end

**Example Output:**
```
📦 PDF Batch Upload to MinIO
════════════════════════════════════════════════════════
Source: /Users/kaunghtet/Projects/ciapp/tools/um1data/pdfNews
Bucket: um1
Target: library/public/abstracts/
MinIO: 192.168.200.33:9000
════════════════════════════════════════════════════════

📁 Found 594 PDF files

Starting upload in 3 seconds... (Press Ctrl+C to cancel)

[1/594] ✅ Uploaded: 015c2751-51cc-4301-bef4-af1d6a17e733.pdf
[2/594] ✅ Uploaded: 01748527-bb47-4bd9-b87f-4083a483d1ad.pdf
[3/594] ⏭️  Skipping (already exists): 018c1342-2739-4aa0-98be-274dda15348e.pdf
...

════════════════════════════════════════════════════════
📊 Upload Summary
════════════════════════════════════════════════════════
Total files:    594
✅ Uploaded:    590
⏭️  Skipped:     3
❌ Failed:      1
════════════════════════════════════════════════════════

✨ Done!
```

## Features

### Smart Upload
- **Skip Duplicates**: Automatically skips files that already exist
- **Safe to Re-run**: Can be stopped and restarted without issues
- **Progress Tracking**: Shows current file being uploaded
- **Error Handling**: Continues uploading even if some files fail

### Metadata
Each uploaded file includes:
- `original-filename`: Original PDF filename
- `upload-date`: Timestamp of upload
- `upload-source`: "batch-upload-script"

## Verify Upload

### Using MinIO Console
1. Open: http://192.168.200.33:9000
2. Login with credentials
3. Navigate to: `um1 → library/public/abstracts/`
4. Verify files are present

### Using mc CLI
```bash
mc alias set myminio http://192.168.200.33:9000 minioadmin cidb1234
mc ls myminio/um1/library/public/abstracts/ | head -20
mc ls myminio/um1/library/public/abstracts/ | wc -l  # Should show 594
```

### Using the Script
```bash
# Check if a specific file exists
mc stat myminio/um1/library/public/abstracts/015c2751-51cc-4301-bef4-af1d6a17e733.pdf
```

## Troubleshooting

### Connection Error
```
❌ Failed to upload: connect ECONNREFUSED 192.168.200.33:9000
```
**Solution**: Verify MinIO server is running and accessible

### Authentication Error
```
❌ Failed to upload: Access Denied
```
**Solution**: Check MINIO_ROOT_USER and MINIO_ROOT_PASSWORD in .env

### Bucket Not Found
```
❌ Failed to upload: The specified bucket does not exist
```
**Solution**: Create the bucket first:
```bash
mc mb myminio/um1
```

### Permission Error
```
❌ Error reading file: EACCES
```
**Solution**: Check file permissions on source directory

## Clean Up

If you need to remove uploaded files:

```bash
# Remove all files
mc rm --recursive --force myminio/um1/library/public/abstracts/

# Remove specific file
mc rm myminio/um1/library/public/abstracts/015c2751-51cc-4301-bef4-af1d6a17e733.pdf
```

## Performance

- **Upload Speed**: ~10-50 files/second (depends on file size and network)
- **Total Time**: Approximately 1-5 minutes for 594 files
- **Rate Limiting**: 100ms delay between uploads to avoid overwhelming the server

## Notes

- Files are uploaded with `ContentType: application/pdf`
- Original filenames are preserved (UUID format)
- The script is idempotent - safe to run multiple times
- Failed uploads can be retried by running the script again

## Support

If you encounter issues:
1. Check MinIO server logs
2. Verify network connectivity
3. Ensure bucket and path exist
4. Check file permissions
