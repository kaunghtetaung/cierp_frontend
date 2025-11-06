/**
 * Initialize core Configuration in Config Service
 *
 * This script creates the initial configuration for the core app
 * in the centralized config service (MongoDB).
 *
 * Usage:
 *   node scripts/init-core-config.js [environment]
 *
 * Examples:
 *   node scripts/init-core-config.js development
 *   node scripts/init-core-config.js production
 */

const axios = require('axios');
require('dotenv').config({ path: './apps/core/.env.production' });

const environment = process.argv[2] || 'production';

// Determine which env values to use
const isDev = environment === 'development';

const config = {
  appName: 'coreWeb',
  environment: environment,
  version: '1.0.0',
  config: {
    minio: {
      internal: {
        endpoint: isDev ? '203.81.66.116' : '192.168.200.33',
        port: 9000,
        useSSL: false,
        region: 'us-east-1'
      },
      public: {
        endpointTemplate: 'storage.{tenantRootDomain}',
        port: 443,
        useSSL: true
      },
      credentials: {
        rootUser: 'minioadmin',
        rootPassword: 'cidb1234'
      }
    },
    oidc: {
      clientId: 'f63672873ab7908f14f889c9a4d1b0747b8036257aa08c3568f5b1aa102f75d2',
      clientSecret: 'T7uAqmC0utEiQO4ifCDvlnscjFTxaV8/XLPngmA7phCCif8mZy25MrTTu9OaDRPs'
    },
    api: {
      subdomain: isDev ? 'api-dev' : 'api',
      authSubdomain: isDev ? 'auth-dev' : 'auth',
      wwwSubdomain: isDev ? 'www-dev' : 'www'
    },
    gemini: {
      apiKey: 'AIzaSyBFRwUNFWlbhLaSGrdlSfBjORAYESPDxkI'
    },
    logging: {
      format: isDev ? 'pretty' : 'json'
    },
    server: {
      port: 3001
    }
  },
  metadata: {
    createdBy: 'system',
    changeReason: `Initial ${environment} configuration for coreWeb frontend app`
  }
};

async function initializeConfig() {
  // Use localhost for init scripts (running from host machine)
  const configServiceUrl = 'http://localhost:3330';

  console.log('🚀 Initializing coreWeb configuration...');
  console.log(`📍 Config Service URL: ${configServiceUrl}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log('');

  try {
    // Try to create the config
    const response = await axios.post(
      `${configServiceUrl}/config/coreWeb`,
      config,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('✅ Configuration created successfully!');
    console.log('');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Verify config: curl ' + configServiceUrl + '/config/coreWeb?environment=' + environment);
    console.log('2. Update your .env file with config service settings');
    console.log('3. Start your Next.js app with ENABLE_CONFIG_HOT_RELOAD=true');

  } catch (error) {
    if (error.response) {
      if (error.response.status === 400 && error.response.data.message?.includes('already exists')) {
        console.log('⚠️  Configuration already exists');
        console.log('');
        console.log('To update the config, use:');
        console.log(`curl -X PUT ${configServiceUrl}/config/coreWeb?environment=${environment} \\`);
        console.log('  -H "Content-Type: application/json" \\');
        console.log(`  -d '${JSON.stringify({ version: '1.0.1', config: config.config, metadata: { updatedBy: 'system', changeReason: 'Update config' } }, null, 2)}'`);
      } else {
        console.error('❌ Error creating configuration:');
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      console.error('❌ No response from config service');
      console.error('Make sure the config service is running at:', configServiceUrl);
      console.error('');
      console.error('To start config service:');
      console.error('  cd /Users/kaunghtet/Projects/ciapp');
      console.error('  npm run serve:config');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

initializeConfig();
