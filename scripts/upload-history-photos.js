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

const files = [
  { source: 'history-1.jpg', target: 'history-1.jpg' },
  { source: 'history-2.jpg', target: 'history-2.jpg' },
  { source: 'history-3.jpg', target: 'history-3.jpg' },
];

async function uploadAll() {
  console.log('📸 Uploading 3 history photos...\n');

  for (const file of files) {
    const filePath = `/Users/kaunghtet/Projects/ciapp/tools/um1data/${file.source}`;
    const fileContent = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    await s3.send(new PutObjectCommand({
      Bucket: 'um1',
      Key: `ctms/public/${file.target}`,
      Body: fileContent,
      ContentType: 'image/jpeg',
    }));

    console.log(`✅ Uploaded: ${file.target} (${(stats.size / 1024).toFixed(2)} KB)`);
  }

  console.log('\n✅ All photos uploaded!');
}

uploadAll().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
