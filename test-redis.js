const Redis = require('ioredis');

// Test Redis connection with your Docker setup
const redis = new Redis({
  host: 'localhost',  // Use localhost since you've port forwarded
  port: 6379,
  username: 'cidbaccess',
  password: 'cidb1234!@',
  db: 0,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Could not connect after 3 attempts');
      return null;
    }
    return Math.min(times * 100, 2000);
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// Test operations
async function testRedis() {
  try {
    // Test write
    console.log('\n📝 Testing WRITE...');
    await redis.set('test:key', JSON.stringify({ 
      test: true, 
      timestamp: new Date().toISOString() 
    }));
    console.log('✅ Write successful');

    // Test read
    console.log('\n📖 Testing READ...');
    const value = await redis.get('test:key');
    console.log('✅ Read successful:', value);

    // Test delete
    console.log('\n🗑️ Testing DELETE...');
    await redis.del('test:key');
    console.log('✅ Delete successful');

    // Test connection info
    console.log('\n📊 Connection Info:');
    const info = await redis.info('server');
    const lines = info.split('\r\n').slice(0, 5);
    lines.forEach(line => console.log('  ', line));

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Wait for connection then test
redis.once('ready', () => {
  console.log('🚀 Redis ready, starting tests...');
  testRedis();
});

setTimeout(() => {
  console.error('⏱️ Timeout - could not connect to Redis');
  process.exit(1);
}, 10000);
