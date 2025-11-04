#!/usr/bin/env node

/**
 * Upload PDF files to MinIO S3 Storage
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Configuration
const SOURCE_DIR = '/Users/kaunghtet/Projects/ciapp/tools/um1data/pdfNews';
const BUCKET_NAME = 'um1';
const TARGET_PREFIX = 'library/public/abstracts/';

// Build endpoint URL (same pattern as libs/s3)
const endpoint = process.env.MINIO_PORT
  ? `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
  : `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}`;

// MinIO Client
const s3Client = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true,
});

async function fileExists(bucket, key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
}

async function uploadFile(filePath, fileName) {
  const fileContent = fs.readFileSync(filePath);
  const key = `${TARGET_PREFIX}${fileName}`;
  
  const exists = await fileExists(BUCKET_NAME, key);
  if (exists) {
    console.log(`⏭️  Skip: ${fileName}`);
    return { success: true, skipped: true };
  }

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: 'application/pdf',
      Metadata: {
        'original-filename': fileName,
        'upload-date': new Date().toISOString(),
      },
    }));
    console.log(`✅ OK: ${fileName}`);
    return { success: true, skipped: false };
  } catch (error) {
    console.error(`❌ FAIL: ${fileName} - ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

async function main() {
  console.log('📦 PDF Batch Upload to MinIO');
  console.log('════════════════════════════════════════════════════════');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target: ${BUCKET_NAME}/${TARGET_PREFIX}`);
  console.log(`Endpoint: ${endpoint}\n`);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.toLowerCase().endsWith('.pdf')).sort();
  console.log(`📁 Found ${files.length} PDF files\n`);

  if (files.length === 0) {
    console.log('No files to upload.');
    process.exit(0);
  }

  console.log('Starting in 3 seconds... (Ctrl+C to cancel)\n');
  await new Promise(r => setTimeout(r, 3000));

  const stats = { total: files.length, uploaded: 0, skipped: 0, failed: 0, errors: [] };

  for (let i = 0; i < files.length; i++) {
    process.stdout.write(`[${i + 1}/${files.length}] `);
    const result = await uploadFile(path.join(SOURCE_DIR, files[i]), files[i]);
    
    if (result.success) {
      result.skipped ? stats.skipped++ : stats.uploaded++;
    } else {
      stats.failed++;
      stats.errors.push({ file: files[i], error: result.error });
    }
    
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 Summary');
  console.log('════════════════════════════════════════════════════════');
  console.log(`Total:    ${stats.total}`);
  console.log(`✅ OK:    ${stats.uploaded}`);
  console.log(`⏭️  Skip:  ${stats.skipped}`);
  console.log(`❌ Fail:  ${stats.failed}`);
  console.log('════════════════════════════════════════════════════════\n');

  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
