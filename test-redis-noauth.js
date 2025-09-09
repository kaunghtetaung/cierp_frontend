const { createClient } = require('redis');

console.log('Testing native redis package without auth...\n');

const client = createClient({
  url: 'redis://localhost:6379'
});

client.on('error', err => console.error('Redis Client Error:', err));

async function test() {
  try {
    await client.connect();
    console.log('✅ Connected');
    
    const pong = await client.ping();
    console.log('✅ PING:', pong);
    
    await client.set('test', 'works without password');
    console.log('✅ SET successful');
    
    const value = await client.get('test');
    console.log('✅ GET:', value);
    
    await client.disconnect();
    console.log('✅ All tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

test();