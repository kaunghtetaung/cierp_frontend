#!/usr/bin/env node

const Redis = require('ioredis');
const crypto = require('crypto');

// Redis configuration
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'cidb1234!@',
  db: 0,
  connectTimeout: 3000,
  commandTimeout: 3000,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: () => null // Disable retry
});

async function testRedisOAuth() {
  console.log('Testing Redis connection and OAuth key storage...\n');
  
  try {
    // Test connection
    const ping = await redis.ping();
    console.log('✅ Redis connected:', ping);
    
    // Generate test state for PKCE
    const testState = crypto.randomBytes(16).toString('hex');
    const testCodeVerifier = crypto.randomBytes(32).toString('base64url');
    
    // Test with correct ciApp prefix
    const pkceKey = `ciApp:PKCE:${testState}`;
    const pkceData = {
      codeVerifier: testCodeVerifier,
      redirectUri: 'http://www.crystal-image.net/dashboard',
      timestamp: Date.now()
    };
    
    console.log('\nStoring PKCE data:');
    console.log('- Key:', pkceKey);
    console.log('- Data:', JSON.stringify(pkceData, null, 2));
    
    // Store with 5 minute TTL
    await redis.setex(pkceKey, 300, JSON.stringify(pkceData));
    console.log('✅ PKCE data stored successfully');
    
    // Retrieve to verify
    const retrieved = await redis.get(pkceKey);
    const parsed = JSON.parse(retrieved);
    console.log('\n✅ PKCE data retrieved successfully:');
    console.log('- Code Verifier matches:', parsed.codeVerifier === testCodeVerifier);
    
    // Check all keys with ciApp prefix
    console.log('\nAll Redis keys with ciApp prefix:');
    const keys = await redis.keys('ciApp:*');
    keys.forEach(key => console.log('- ', key));
    
    // Clean up test key
    await redis.del(pkceKey);
    console.log('\n✅ Test key cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    redis.disconnect();
    console.log('\n✅ Redis connection closed');
  }
}

testRedisOAuth();