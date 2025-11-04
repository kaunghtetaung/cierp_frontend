#!/usr/bin/env node

const fs = require('fs');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const SOURCE_FILE = '/Users/kaunghtet/Projects/ciapp/tools/um1data/um1slider.webp';
const BUCKET_NAME = 'um1';
const TARGET_KEY = 'ctms/public/hero-slide-2.webp';
const OLD_KEY = 'ctms/public/hero-slide-2.png';

const endpoint = process.env.MINIO_PORT
  ? `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
  : `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}`;

const s3Client = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true,
});

async function main() {
  console.log('📸 Uploading um1slider.webp...');

  const fileContent = fs.readFileSync(SOURCE_FILE);

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: TARGET_KEY,
    Body: fileContent,
    ContentType: 'image/webp',
  }));

  console.log('✅ Uploaded:', TARGET_KEY);

  // Delete old PNG file
  console.log('\n🗑️  Deleting old hero-slide-2.png...');
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: OLD_KEY,
    }));
    console.log('✅ Deleted:', OLD_KEY);
  } catch (err) {
    console.log('⚠️  Old file not found or already deleted');
  }

  console.log('\n✅ Done! New URL: https://storage.um1ygn.edu.mm/' + TARGET_KEY);
}

main().catch(console.error);
