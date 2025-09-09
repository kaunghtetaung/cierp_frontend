console.log('Node version:', process.version);
console.log('Testing both Redis libraries...\n');

// Test 1: Native redis package
console.log('=== Testing native redis package ===');
const { createClient } = require('redis');

const nativeClient = createClient({
  url: 'redis://localhost:6379',
  socket: { connectTimeout: 2000 }
});

nativeClient.on('error', err => console.error('Native Redis Error:', err.message));

nativeClient.connect()
  .then(() => nativeClient.ping())
  .then(result => {
    console.log('✅ Native redis: PING =', result);
    return nativeClient.set('test', 'native-works');
  })
  .then(() => nativeClient.get('test'))
  .then(value => {
    console.log('✅ Native redis: GET =', value);
    return nativeClient.disconnect();
  })
  .then(() => {
    console.log('✅ Native redis: Success!\n');
    
    // Test 2: ioredis package
    console.log('=== Testing ioredis package ===');
    const Redis = require('ioredis');
    
    const ioredisClient = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: () => null,
      lazyConnect: true
    });
    
    return ioredisClient.connect();
  })
  .then(() => {
    console.log('✅ ioredis: Connected');
    // This will likely hang...
    console.log('Attempting ioredis PING (this may hang)...');
    setTimeout(() => {
      console.log('❌ ioredis: Operations timeout');
      process.exit(0);
    }, 2000);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

setTimeout(() => {
  console.error('\n⏱️ Global timeout');
  process.exit(1);
}, 10000);