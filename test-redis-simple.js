const Redis = require('ioredis');

console.log('Testing Redis connection...');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'cidb1234!@'
});

redis.on('connect', () => console.log('✅ Connected'));
redis.on('ready', () => console.log('✅ Ready'));
redis.on('error', (err) => console.error('❌ Error:', err.message));

// Direct test
redis.ping()
  .then(result => {
    console.log('✅ PING result:', result);
    return redis.set('test', 'value');
  })
  .then(() => {
    console.log('✅ SET successful');
    return redis.get('test');
  })
  .then(value => {
    console.log('✅ GET result:', value);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Operation failed:', err.message);
    process.exit(1);
  });

setTimeout(() => {
  console.error('⏱️ Timeout after 5 seconds');
  process.exit(1);
}, 5000);