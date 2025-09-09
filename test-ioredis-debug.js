const Redis = require('ioredis');

console.log('Testing ioredis with debug mode...\n');

// Enable debug mode
Redis.Promise = global.Promise;

const redis = new Redis({
  host: '127.0.0.1', // Try IP instead of localhost
  port: 6379,
  family: 4, // Force IPv4
  enableReadyCheck: false, // Disable ready check
  maxRetriesPerRequest: 1,
  showFriendlyErrorStack: true
});

console.log('Redis instance created');

redis.on('connect', () => {
  console.log('✅ Connect event fired');
});

redis.on('ready', () => {
  console.log('✅ Ready event fired');
});

redis.on('error', (err) => {
  console.error('❌ Error event:', err);
});

// Try immediate operations
console.log('Attempting PING...');
redis.ping((err, result) => {
  if (err) {
    console.error('❌ PING failed:', err);
  } else {
    console.log('✅ PING succeeded:', result);
  }
  
  console.log('\nAttempting SET...');
  redis.set('test', 'value', (err, result) => {
    if (err) {
      console.error('❌ SET failed:', err);
    } else {
      console.log('✅ SET succeeded:', result);
    }
    
    redis.disconnect();
    process.exit(0);
  });
});

setTimeout(() => {
  console.error('\n⏱️ Timeout after 10 seconds');
  console.log('Redis status:', redis.status);
  process.exit(1);
}, 10000);