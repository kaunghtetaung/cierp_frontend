const Redis = require('ioredis');

console.log('Testing Redis connection without timeout...');
const startTime = Date.now();

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'cidb1234!@',
  db: 0,
  lazyConnect: false, // Connect immediately
  // No timeout - let's see what happens
});

redis.on('connect', () => {
  const connectionTime = Date.now() - startTime;
  console.log(`Redis connected in ${connectionTime}ms`);
});

redis.on('ready', async () => {
  const readyTime = Date.now() - startTime;
  console.log(`Redis ready in ${readyTime}ms`);
  
  // Test basic operations
  console.log('Testing SET operation...');
  const setStart = Date.now();
  await redis.set('test:key', 'test value');
  console.log(`SET operation took ${Date.now() - setStart}ms`);
  
  console.log('Testing GET operation...');
  const getStart = Date.now();
  const value = await redis.get('test:key');
  console.log(`GET operation took ${Date.now() - getStart}ms, value: ${value}`);
  
  await redis.del('test:key');
  
  redis.disconnect();
  process.exit(0);
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
  // Don't exit on error, let's see what happens
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('Redis connection timeout after 30 seconds');
  process.exit(1);
}, 30000);