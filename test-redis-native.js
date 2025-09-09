const { createClient } = require('redis');

console.log('Testing with native redis package...\n');

const client = createClient({
  url: 'redis://:cidb1234!@@localhost:6379',
  socket: {
    connectTimeout: 5000
  }
});

client.on('error', err => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('✅ Connected'));
client.on('ready', () => console.log('✅ Ready'));

async function test() {
  try {
    await client.connect();
    console.log('✅ Client connected');
    
    const pingResult = await client.ping();
    console.log('✅ PING result:', pingResult);
    
    await client.set('test', 'value');
    console.log('✅ SET successful');
    
    const value = await client.get('test');
    console.log('✅ GET result:', value);
    
    await client.disconnect();
    console.log('✅ Disconnected');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();

setTimeout(() => {
  console.error('\n⏱️ Timeout after 5 seconds');
  process.exit(1);
}, 5000);