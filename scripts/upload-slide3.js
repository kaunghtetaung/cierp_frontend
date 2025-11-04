#!/usr/bin/env node

const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: 'http://203.81.66.116:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'cidb1234',
  },
  forcePathStyle: true,
});

async function upload() {
  console.log('📸 Uploading slider-3.webp...');

  const file = fs.readFileSync('/Users/kaunghtet/Projects/ciapp/tools/um1data/slider-3.webp');

  await s3.send(new PutObjectCommand({
    Bucket: 'um1',
    Key: 'ctms/public/hero-slide-3.webp',
    Body: file,
    ContentType: 'image/webp',
  }));

  console.log('✅ Uploaded: hero-slide-3.webp');
  console.log('\n✅ Complete! URL: https://storage.um1ygn.edu.mm/ctms/public/hero-slide-3.webp');
}

upload().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
