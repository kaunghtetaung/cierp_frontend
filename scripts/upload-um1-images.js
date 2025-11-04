#!/usr/bin/env node

/**
 * Upload UM1 Images to MinIO S3
 * - Hero cover: um1.jpg -> um1/ctms/public/hero-cover.jpg
 * - Rector photo: rector.jpg -> um1/ctms/public/rector.jpg
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Configuration
const SOURCE_DIR = '/Users/kaunghtet/Projects/ciapp/tools/um1data';
const BUCKET_NAME = 'um1';
const TARGET_PREFIX = 'ctms/public/';

// Files to upload
const FILES = [
  { source: 'um1.jpg', target: 'hero-cover.jpg', contentType: 'image/jpeg' },
  { source: 'um1slider.webp', target: 'hero-slide-2.webp', contentType: 'image/webp' },
  { source: 'rector.jpg', target: 'rector.jpg', contentType: 'image/jpeg' },
];

// Build endpoint URL
const endpoint = process.env.MINIO_PORT
  ? `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
  : `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}`;

// S3 Client
const s3Client = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true,
});

async function uploadFile(sourceFile, targetFile, contentType) {
  const sourcePath = path.join(SOURCE_DIR, sourceFile);
  const key = `${TARGET_PREFIX}${targetFile}`;

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ File not found: ${sourcePath}`);
    return { success: false, error: 'File not found' };
  }

  try {
    const fileContent = fs.readFileSync(sourcePath);
    const stats = fs.statSync(sourcePath);

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'original-filename': sourceFile,
        'upload-date': new Date().toISOString(),
      },
    }));

    console.log(`✅ Uploaded: ${key} (${(stats.size / 1024).toFixed(2)} KB)`);
    return { success: true, key, size: stats.size };
  } catch (error) {
    console.error(`❌ Failed to upload ${sourceFile}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('📦 UM1 Image Upload to MinIO');
  console.log('════════════════════════════════════════════════════════');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target: ${BUCKET_NAME}/${TARGET_PREFIX}`);
  console.log(`Endpoint: ${endpoint}\n`);

  const results = [];

  for (const file of FILES) {
    console.log(`\n📸 Uploading: ${file.source} -> ${file.target}`);
    const result = await uploadFile(file.source, file.target, file.contentType);
    results.push({ ...file, ...result });
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 Upload Summary');
  console.log('════════════════════════════════════════════════════════');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n📁 Uploaded files:');
    successful.forEach(r => {
      console.log(`   - ${BUCKET_NAME}/${r.key}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    failed.forEach(r => {
      console.log(`   - ${r.source}: ${r.error}`);
    });
  }

  console.log('════════════════════════════════════════════════════════\n');

  // Print public URLs
  if (successful.length > 0) {
    console.log('🌐 Public URLs (use in your application):');
    const publicUrl = process.env.MINIO_PUBLIC_URL || endpoint;
    successful.forEach(r => {
      console.log(`   ${publicUrl}/${BUCKET_NAME}/${r.key}`);
    });
    console.log('');
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
