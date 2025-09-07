const Redis = require('ioredis');

console.log('Testing Redis connection...');
const startTime = Date.now();

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'cidb1234!@',
  db: 0,
  lazyConnect: false, // Connect immediately
  connectTimeout: 5000, // 5 second timeout for connection
  commandTimeout: 5000, // 5 second timeout for commands
});

redis.on('connect', () => {
  const connectionTime = Date.now() - startTime;
  console.log(`Redis connected in ${connectionTime}ms`);
});

redis.on('ready', async () => {
  const readyTime = Date.now() - startTime;
  console.log(`Redis ready in ${readyTime}ms`);
  
  // Test basic operations
  const setStart = Date.now();
  await redis.set('test:key', 'test value');
  console.log(`SET operation took ${Date.now() - setStart}ms`);
  
  const getStart = Date.now();
  const value = await redis.get('test:key');
  console.log(`GET operation took ${Date.now() - getStart}ms, value: ${value}`);
  
  await redis.del('test:key');
  
  redis.disconnect();
  process.exit(0);
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Redis connection timeout after 10 seconds');
  process.exit(1);
}, 10000);