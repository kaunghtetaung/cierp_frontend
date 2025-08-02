// Hostname detection and app mapping utilities
import { APP_CONFIGS, getHostnameMappings, getDefaultApp } from './configs';
import type { AppConfig, AppContext, AppSwitchOptions } from './types';

/**
 * Extract app ID from hostname
 */
export function getAppFromHostname(hostname: string): string {
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

  // Fallback: try to extract subdomain
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
 * Build URL for app switching
 */
export function buildAppSwitchUrl(
  targetAppId: string, 
  currentPath?: string, 
  currentQuery?: string,
  options: AppSwitchOptions = {}
): string {
  const { preservePath = true, preserveQuery = true } = options;
  
  const targetHostname = getHostnameForApp(targetAppId);
  const protocol = typeof window !== 'undefined' 
    ? window.location.protocol 
    : 'https:';
  
  let url = `${protocol}//${targetHostname}`;
  
  // Add path if preserving
  if (preservePath && currentPath) {
    url += currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
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
 * Check if current hostname matches app
 */
export function isCurrentApp(appId: string, hostname?: string): boolean {
  const currentHostname = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  const currentAppId = getAppFromHostname(currentHostname);
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