// App configurations with hostname mappings
import type { AppConfig, HostnameMapping } from './types';

export const APP_CONFIGS: Record<string, AppConfig> = {
  'core': {
    id: 'core',
    hostname: 'core.crystal-image.net',
    name: 'Core Management',
    description: 'Core system management and administration',
    primaryColor: '#0066cc',
    icon: '⚙️',
    isDefault: true
  },
  'library': {
    id: 'library',
    hostname: 'library.crystal-image.net',
    name: 'Library System',
    description: 'Library management and cataloging system',
    primaryColor: '#00aa44',
    icon: '📚'
  },
  'school': {
    id: 'school',
    hostname: 'school.crystal-image.net',
    name: 'School Management',
    description: 'School administration and student management',
    primaryColor: '#ff6600',
    icon: '🎓'
  },
  'content': {
    id: 'content',
    hostname: 'content.crystal-image.net',
    name: 'Content Management',
    description: 'Content creation and publishing system',
    primaryColor: '#9333ea',
    icon: '📝'
  }
};

// Development hostname mappings for local development
export const DEV_HOSTNAME_MAPPINGS: HostnameMapping[] = [
  // Production hostnames (also work in dev with /etc/hosts)
  { hostname: 'core.crystal-image.net', appId: 'core', environment: 'development' },
  { hostname: 'library.crystal-image.net', appId: 'library', environment: 'development' },
  { hostname: 'school.crystal-image.net', appId: 'school', environment: 'development' },
  { hostname: 'content.crystal-image.net', appId: 'content', environment: 'development' },
  
  // Localhost with different ports for development
  { hostname: 'localhost:3000', appId: 'core', environment: 'development' },
  { hostname: 'localhost:3001', appId: 'library', environment: 'development' },
  { hostname: 'localhost:3002', appId: 'school', environment: 'development' },
  { hostname: 'localhost:3003', appId: 'content', environment: 'development' },
  
  // 127.0.0.1 variants
  { hostname: '127.0.0.1:3000', appId: 'core', environment: 'development' },
  { hostname: '127.0.0.1:3001', appId: 'library', environment: 'development' },
  { hostname: '127.0.0.1:3002', appId: 'school', environment: 'development' },
  { hostname: '127.0.0.1:3003', appId: 'content', environment: 'development' }
];

// Production hostname mappings
export const PROD_HOSTNAME_MAPPINGS: HostnameMapping[] = [
  { hostname: 'core.crystal-image.net', appId: 'core', environment: 'production' },
  { hostname: 'library.crystal-image.net', appId: 'library', environment: 'production' },
  { hostname: 'school.crystal-image.net', appId: 'school', environment: 'production' },
  { hostname: 'content.crystal-image.net', appId: 'content', environment: 'production' }
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