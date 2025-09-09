const Redis = require('ioredis');

console.log('Testing Redis with different auth methods...\n');

// Method 1: Password only
console.log('Method 1: Password only');
const redis1 = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'cidb1234!@',
  lazyConnect: true
});

redis1.connect()
  .then(() => redis1.ping())
  .then(result => {
    console.log('✅ Method 1 worked:', result);
    redis1.disconnect();
  })
  .catch(err => {
    console.log('❌ Method 1 failed:', err.message);
    redis1.disconnect();
  })
  .finally(() => {
    // Method 2: Using username 'default'
    console.log('\nMethod 2: Username "default" with password');
    const redis2 = new Redis({
      host: 'localhost',
      port: 6379,
      username: 'default',
      password: 'cidb1234!@',
      lazyConnect: true
    });
    
    return redis2.connect()
      .then(() => redis2.ping())
      .then(result => {
        console.log('✅ Method 2 worked:', result);
        redis2.disconnect();
      })
      .catch(err => {
        console.log('❌ Method 2 failed:', err.message);
        redis2.disconnect();
      });
  })
  .finally(() => {
    // Method 3: Using Redis URL
    console.log('\nMethod 3: Redis URL format');
    const redis3 = new Redis('redis://:cidb1234!@@localhost:6379');
    
    redis3.ping()
      .then(result => {
        console.log('✅ Method 3 worked:', result);
        redis3.disconnect();
        process.exit(0);
      })
      .catch(err => {
        console.log('❌ Method 3 failed:', err.message);
        redis3.disconnect();
        process.exit(1);
      });
  });

setTimeout(() => {
  console.error('\n⏱️ Timeout after 10 seconds');
  process.exit(1);
}, 10000);