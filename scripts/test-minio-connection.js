#!/usr/bin/env node

/**
 * Test MinIO Connection
 *
 * Quick test to verify MinIO credentials and connectivity
 */

const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true,
});

async function testConnection() {
  console.log('🔌 Testing MinIO Connection...\n');
  console.log('Configuration:');
  console.log(`  Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
  console.log(`  User: ${process.env.MINIO_ROOT_USER}`);
  console.log(`  Region: ${process.env.MINIO_REGION || 'us-east-1'}\n`);

  try {
    // Test 1: List buckets
    console.log('📦 Listing buckets...');
    const listResult = await s3Client.send(new ListBucketsCommand({}));
    console.log(`✅ Found ${listResult.Buckets?.length || 0} buckets:`);
    listResult.Buckets?.forEach(bucket => {
      console.log(`   - ${bucket.Name}`);
    });

    // Test 2: Check if 'um1' bucket exists
    console.log('\n🔍 Checking um1 bucket...');
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: 'um1' }));
      console.log('✅ Bucket "um1" exists and is accessible');
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log('❌ Bucket "um1" does not exist');
        console.log('   Create it with: mc mb myminio/um1');
      } else {
        throw error;
      }
    }

    console.log('\n✨ Connection test successful!');
    console.log('You can now run: node scripts/upload-pdfs-to-minio.js');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if MinIO server is running');
    console.error('  2. Verify .env credentials');
    console.error('  3. Check network connectivity');
    process.exit(1);
  }
}

testConnection();
