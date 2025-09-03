// Hostname detection and app mapping utilities
import { APP_CONFIGS, getHostnameMappings, getDefaultApp } from './configs';
import type { AppConfig, AppContext, AppSwitchOptions } from './types';

/**
 * Extract app ID from URL path
 */
export function getAppFromPath(pathname: string): string {
  if (!pathname) {
    return getDefaultApp().id;
  }

  // Clean pathname and split into segments
  const cleanPath = pathname.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
  const pathSegments = cleanPath.split('/').filter(Boolean);
  
  if (pathSegments.length === 0) {
    return getDefaultApp().id;
  }

  const appId = pathSegments[0];
  
  // Check if it's a valid app ID
  if (APP_CONFIGS[appId]) {
    return appId;
  }

  // Default fallback
  return getDefaultApp().id;
}

/**
 * Extract app ID from hostname (legacy support)
 * Now uses path-based detection as primary method
 */
export function getAppFromHostname(hostname: string, pathname?: string): string {
  // If pathname is provided, use path-based detection
  if (pathname) {
    return getAppFromPath(pathname);
  }

  if (!hostname) {
    return getDefaultApp().id;
  }

  // Clean hostname (remove protocol, trailing slash, etc.)
  const cleanHostname = hostname
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .split('?')[0]
    .split('#')[0];

  // Find matching hostname mapping
  const mappings = getHostnameMappings();
  const mapping = mappings.find(m => m.hostname === cleanHostname);
  
  if (mapping) {
    return mapping.appId;
  }

  // Fallback: try to extract subdomain (legacy support)
  if (cleanHostname.includes('.crystal-image.net')) {
    const subdomain = cleanHostname.split('.crystal-image.net')[0];
    if (APP_CONFIGS[subdomain]) {
      return subdomain;
    }
  }

  // Default fallback
  return getDefaultApp().id;
}

/**
 * Get hostname for specific app
 */
export function getHostnameForApp(appId: string): string {
  const config = APP_CONFIGS[appId];
  if (!config) {
    return getDefaultApp().hostname;
  }
  
  return config.hostname;
}

/**
 * Get app configuration by ID
 */
export function getAppConfig(appId: string): AppConfig {
  return APP_CONFIGS[appId] || getDefaultApp();
}

/**
 * Get app configuration by hostname
 */
export function getAppConfigByHostname(hostname: string): AppConfig {
  const appId = getAppFromHostname(hostname);
  return getAppConfig(appId);
}

/**
 * Create app context from hostname
 */
export function createAppContext(hostname: string): AppContext {
  const appId = getAppFromHostname(hostname);
  const config = getAppConfig(appId);
  
  return {
    currentApp: appId,
    config,
    hostname,
    isValidApp: appId in APP_CONFIGS
  };
}

/**
 * Build URL for app switching with path-based routing
 */
export function buildAppSwitchUrl(
  targetAppId: string, 
  currentPath?: string, 
  currentQuery?: string,
  options: AppSwitchOptions = {}
): string {
  const { preservePath = true, preserveQuery = true } = options;
  
  const targetConfig = getAppConfig(targetAppId);
  const targetHostname = targetConfig.hostname;
  const targetBasePath = targetConfig.basePath;
  
  const protocol = typeof window !== 'undefined' 
    ? window.location.protocol 
    : 'https:';
  
  let url = `${protocol}//${targetHostname}${targetBasePath}`;
  
  // Add path if preserving (but remove current app prefix if it exists)
  if (preservePath && currentPath) {
    // Clean current path - remove any existing app prefix
    const cleanedPath = currentPath.replace(/^\/[^\/]+/, '') || '';
    if (cleanedPath && cleanedPath !== '/') {
      url += cleanedPath.startsWith('/') ? cleanedPath : `/${cleanedPath}`;
    }
  }
  
  // Add query parameters if preserving
  if (preserveQuery && currentQuery) {
    url += currentQuery.startsWith('?') ? currentQuery : `?${currentQuery}`;
  }
  
  return url;
}

/**
 * Switch to different app
 */
export function switchToApp(
  targetAppId: string, 
  options: AppSwitchOptions = {}
): void {
  if (typeof window === 'undefined') {
    console.warn('switchToApp can only be called in browser environment');
    return;
  }
  
  const currentPath = window.location.pathname;
  const currentQuery = window.location.search;
  
  const targetUrl = buildAppSwitchUrl(
    targetAppId, 
    currentPath, 
    currentQuery, 
    options
  );
  
  if (options.newTab) {
    window.open(targetUrl, '_blank');
  } else {
    window.location.href = targetUrl;
  }
}

/**
 * Check if current path matches app
 */
export function isCurrentApp(appId: string, pathname?: string, hostname?: string): boolean {
  const currentPathname = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  const currentHostname = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  
  // Use path-based detection as primary method
  const currentAppId = getAppFromHostname(currentHostname, currentPathname);
  return currentAppId === appId;
}

/**
 * Get development setup instructions
 */
export function getDevSetupInstructions(): string {
  const mappings = getHostnameMappings().filter(m => 
    m.environment === 'development' && 
    m.hostname.includes('.crystal-image.net')
  );
  
  const hostsEntries = mappings
    .map(m => `127.0.0.1 ${m.hostname}`)
    .join('\n');
    
  return `Add these entries to your /etc/hosts file for local development:\n\n${hostsEntries}`;
}