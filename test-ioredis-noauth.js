const Redis = require('ioredis');

console.log('Testing ioredis without authentication...\n');

const redis = new Redis({
  host: 'localhost',
  port: 6379
  // No password required
});

redis.on('connect', () => console.log('✅ Connected'));
redis.on('ready', () => console.log('✅ Ready'));
redis.on('error', (err) => console.error('❌ Error:', err.message));

async function test() {
  try {
    const pingResult = await redis.ping();
    console.log('✅ PING result:', pingResult);
    
    await redis.set('test', 'ioredis works without password!');
    console.log('✅ SET successful');
    
    const value = await redis.get('test');
    console.log('✅ GET result:', value);
    
    await redis.del('test');
    console.log('✅ DELETE successful');
    
    redis.disconnect();
    console.log('✅ Test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

// Wait for ready event before testing
redis.once('ready', test);

setTimeout(() => {
  console.error('\n⏱️ Timeout after 5 seconds');
  process.exit(1);
}, 5000);