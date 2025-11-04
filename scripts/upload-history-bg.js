#!/usr/bin/env node

/**
 * Upload History Background Image to MinIO S3
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Configuration
const SOURCE_FILE = '/Users/kaunghtet/Projects/frontend/photos/2025.jpg';
const BUCKET_NAME = 'um1';
const TARGET_KEY = 'ctms/public/history-bg.jpg';

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

async function uploadFile() {
  console.log('📦 Upload History Background Image');
  console.log('════════════════════════════════════════════════════════');
  console.log(`Source: ${SOURCE_FILE}`);
  console.log(`Target: ${BUCKET_NAME}/${TARGET_KEY}`);
  console.log(`Endpoint: ${endpoint}\n`);

  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ File not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(SOURCE_FILE);
    const stats = fs.statSync(SOURCE_FILE);

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TARGET_KEY,
      Body: fileContent,
      ContentType: 'image/jpeg',
      Metadata: {
        'original-filename': '2025.jpg',
        'upload-date': new Date().toISOString(),
      },
    }));

    console.log(`✅ Uploaded: ${TARGET_KEY} (${(stats.size / 1024).toFixed(2)} KB)`);

    const publicUrl = process.env.MINIO_PUBLIC_URL || endpoint;
    console.log('\n🌐 Public URL:');
    console.log(`   https://storage.um1ygn.edu.mm/${BUCKET_NAME}/${TARGET_KEY}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Failed to upload:`, error.message);
    process.exit(1);
  }
}

uploadFile();
