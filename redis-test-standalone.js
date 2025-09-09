const Redis = require('ioredis');

console.log('🚀 Starting Redis test...\n');

// Create Redis instance with correct config
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'cidb1234!@',  // Password only, no username
  db: 0,
  lazyConnect: false,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Could not connect after 3 attempts');
      return null;
    }
    return Math.min(times * 100, 2000);
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('ready', async () => {
  console.log('✅ Redis ready for commands\n');
  
  try {
    // Test write
    console.log('📝 Testing WRITE...');
    const testKey = 'ciApp:RedisTest:TestData';
    const testValue = {
      message: 'Hello from standalone test!',
      timestamp: new Date().toISOString()
    };
    
    await redis.setex(testKey, 3600, JSON.stringify(testValue));
    console.log('✅ Write successful');
    console.log('   Key:', testKey);
    console.log('   Value:', JSON.stringify(testValue));
    
    // Test read
    console.log('\n📖 Testing READ...');
    const storedValue = await redis.get(testKey);
    const parsed = JSON.parse(storedValue);
    console.log('✅ Read successful');
    console.log('   Retrieved:', parsed);
    
    // Test TTL
    console.log('\n⏱️ Testing TTL...');
    const ttl = await redis.ttl(testKey);
    console.log('✅ TTL check successful');
    console.log('   TTL remaining:', ttl, 'seconds');
    
    // Test delete
    console.log('\n🗑️ Testing DELETE...');
    await redis.del(testKey);
    console.log('✅ Delete successful');
    
    // Verify deletion
    const afterDelete = await redis.get(testKey);
    console.log('   Verification:', afterDelete === null ? '✅ Key deleted' : '❌ Key still exists');
    
    console.log('\n🎉 All Redis operations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
});

// Timeout handler
setTimeout(() => {
  console.error('\n⏱️ Timeout - Redis operations took too long');
  process.exit(1);
}, 10000);