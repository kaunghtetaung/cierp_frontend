// App configurations with hostname mappings
import type { AppConfig, HostnameMapping } from './types';

export const APP_CONFIGS: Record<string, AppConfig> = {
  'core': {
    id: 'core',
    hostname: 'app.crystal-image.net',
    basePath: '/core',
    name: 'Core Management',
    description: 'Core system management and administration',
    primaryColor: '#0066cc',
    icon: '⚙️',
    isDefault: true
  },
  'library': {
    id: 'library',
    hostname: 'app.crystal-image.net',
    basePath: '/library',
    name: 'Library System',
    description: 'Library management and cataloging system',
    primaryColor: '#00aa44',
    icon: '📚'
  },
  'school': {
    id: 'school',
    hostname: 'app.crystal-image.net',
    basePath: '/school',
    name: 'School Management',
    description: 'School administration and student management',
    primaryColor: '#ff6600',
    icon: '🎓'
  },
  'content': {
    id: 'content',
    hostname: 'app.crystal-image.net',
    basePath: '/content',
    name: 'Content Management',
    description: 'Content creation and publishing system',
    primaryColor: '#9333ea',
    icon: '📝'
  }
};

// Development hostname mappings for local development
export const DEV_HOSTNAME_MAPPINGS: HostnameMapping[] = [
  // Production hostnames (also work in dev with /etc/hosts)
  { hostname: 'app.crystal-image.net', appId: 'core', environment: 'development' }, // Default to core for app domain
  
  // Localhost with different ports for development - all point to unified app domain
  { hostname: 'localhost:3000', appId: 'core', environment: 'development' },
  { hostname: 'localhost:3001', appId: 'core', environment: 'development' },
  { hostname: 'localhost:3002', appId: 'core', environment: 'development' },
  { hostname: 'localhost:3003', appId: 'core', environment: 'development' },
  
  // 127.0.0.1 variants
  { hostname: '127.0.0.1:3000', appId: 'core', environment: 'development' },
  { hostname: '127.0.0.1:3001', appId: 'core', environment: 'development' },
  { hostname: '127.0.0.1:3002', appId: 'core', environment: 'development' },
  { hostname: '127.0.0.1:3003', appId: 'core', environment: 'development' }
];

// Production hostname mappings
export const PROD_HOSTNAME_MAPPINGS: HostnameMapping[] = [
  { hostname: 'app.crystal-image.net', appId: 'core', environment: 'production' } // Single domain, path-based routing
];

// Get all hostname mappings based on environment
export function getHostnameMappings(): HostnameMapping[] {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? DEV_HOSTNAME_MAPPINGS : PROD_HOSTNAME_MAPPINGS;
}

// Get all available apps
export function getAvailableApps(): AppConfig[] {
  return Object.values(APP_CONFIGS);
}

// Get default app
export function getDefaultApp(): AppConfig {
  return APP_CONFIGS['core'];
}

// Check if app exists
export function isValidAppId(appId: string): boolean {
  return appId in APP_CONFIGS;
}