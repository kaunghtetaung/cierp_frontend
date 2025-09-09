// Test native Redis cache implementation
const path = require('path');

// Ensure we're using Node v20
console.log('Node version:', process.version);

// Import the cache module
const { getCacheInstance, CacheKeys, CacheTTL } = require('./libs/cache');

async function testCache() {
  console.log('\n=== Testing Native Redis Cache Implementation ===\n');
  
  // Initialize cache with test configuration
  const cache = getCacheInstance({
    host: 'localhost',
    port: 6379,
    password: undefined, // No password for now
    db: 0,
    keyPrefix: 'test',
    lazyConnect: false,
    enableLogging: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    connectTimeout: 5000,
    commandTimeout: 2000
  });

  try {
    // Test 1: Health Check
    console.log('\n📋 Test 1: Health Check');
    const health = await cache.healthCheck();
    console.log('Health:', health);
    
    // Test 2: Basic Set/Get
    console.log('\n📋 Test 2: Basic Set/Get');
    const testKey = 'simpleKey';
    const testValue = { message: 'Hello from native Redis!', timestamp: Date.now() };
    
    const setResult = await cache.set(testKey, testValue, 60);
    console.log('Set result:', setResult);
    
    const getValue = await cache.get(testKey);
    console.log('Get result:', getValue);
    
    // Test 3: TTL Check
    console.log('\n📋 Test 3: TTL Check');
    const ttl = await cache.ttl(testKey);
    console.log('TTL remaining:', ttl, 'seconds');
    
    // Test 4: Exists Check
    console.log('\n📋 Test 4: Exists Check');
    const exists = await cache.exists(testKey);
    console.log('Key exists:', exists);
    
    // Test 5: GetSet Pattern
    console.log('\n📋 Test 5: GetSet Pattern');
    let fetchCount = 0;
    const fetchFunction = async () => {
      fetchCount++;
      console.log('  Fetching from source... (call #' + fetchCount + ')');
      return { data: 'Expensive computation result', fetchCount };
    };
    
    const result1 = await cache.getSet('computedKey', fetchFunction, 60);
    console.log('First getSet result:', result1);
    
    const result2 = await cache.getSet('computedKey', fetchFunction, 60);
    console.log('Second getSet result (from cache):', result2);
    console.log('Total fetch calls:', fetchCount, '(should be 1)');
    
    // Test 6: Delete Key
    console.log('\n📋 Test 6: Delete Key');
    const deleteResult = await cache.del(testKey);
    console.log('Delete result:', deleteResult);
    
    const afterDelete = await cache.get(testKey);
    console.log('After delete:', afterDelete, '(should be null)');
    
    // Test 7: Pattern Operations
    console.log('\n📋 Test 7: Pattern Operations');
    await cache.set('pattern:1', 'value1');
    await cache.set('pattern:2', 'value2');
    await cache.set('pattern:3', 'value3');
    
    const keys = await cache.getKeysPattern('test:pattern:*');
    console.log('Keys matching pattern:', keys);
    
    const deletedCount = await cache.deletePattern('test:pattern:*');
    console.log('Deleted keys count:', deletedCount);
    
    // Test 8: Cache Stats
    console.log('\n📋 Test 8: Cache Stats');
    const stats = await cache.getStats();
    console.log('Cache stats:', stats);
    
    // Test 9: Tenant-specific keys (using CacheKeys utility)
    console.log('\n📋 Test 9: Tenant-specific Keys');
    const tenantId = 'tenant123';
    const userId = 'user456';
    
    const tokenKey = CacheKeys.tenantAccessToken(tenantId);
    console.log('Generated token key:', tokenKey);
    
    await cache.set(tokenKey, { token: 'abc123', expires: Date.now() + 3600000 }, CacheTTL.TOKEN);
    const tokenValue = await cache.get(tokenKey);
    console.log('Token value:', tokenValue);
    
    // Test 10: Error Handling (non-existent key)
    console.log('\n📋 Test 10: Error Handling');
    const nonExistent = await cache.get('nonExistentKey');
    console.log('Non-existent key result:', nonExistent, '(should be null)');
    
    // Clean up
    console.log('\n🧹 Cleaning up test keys...');
    await cache.del(tokenKey);
    await cache.del('computedKey');
    
    console.log('\n✅ All cache tests completed successfully!');
    
    // Disconnect
    await cache.disconnect();
    console.log('📴 Disconnected from Redis');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testCache().then(() => {
  console.log('\n🎉 Native Redis cache implementation is working perfectly!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});