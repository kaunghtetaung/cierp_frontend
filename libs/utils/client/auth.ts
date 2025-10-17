// Client-side authentication domain utilities
"use client";

/**
 * Get auth subdomain based on environment
 * Production: auth
 * Development: auth-dev (or custom from NEXT_PUBLIC_AUTH_SUBDOMAIN)
 */
function getAuthSubdomain(): string {
  // Check for environment variable (injected at build time)
  const envSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }

  // Default: use 'auth' for production, 'auth-dev' for development
  const isDev = process.env.NODE_ENV === "development";
  return isDev ? "auth-dev" : "auth";
}

/**
 * Get API subdomain based on environment
 * Production: api
 * Development: api-dev (or custom from NEXT_PUBLIC_API_SUBDOMAIN)
 */
function getApiSubdomain(): string {
  // Check for environment variable (injected at build time)
  const envSubdomain = process.env.NEXT_PUBLIC_API_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }

  // Default: use 'api' for production, 'api-dev' for development
  const isDev = process.env.NODE_ENV === "development";
  return isDev ? "api-dev" : "api";
}

/**
 * Get auth domain URL for client-side operations
 */
export function getAuthDomainClient(): string {
  const currentHostname = window.location.hostname;
  const protocol = window.location.protocol;

  // For localhost, use port 3001 for auth
  if (currentHostname === "localhost" || currentHostname.startsWith("127.")) {
    const isDev = process.env.NODE_ENV === "development";
    const authPort = isDev ? "3001" : "3000";
    return `${protocol}//${currentHostname}:${authPort}`;
  }

  // Extract base domain and create auth subdomain
  const parts = currentHostname.split(".");
  let baseDomain: string;

  if (parts.length >= 2) {
    // Remove www or other subdomains to get base domain
    baseDomain = parts.slice(-2).join(".");
  } else {
    baseDomain = currentHostname;
  }

  const authSubdomain = getAuthSubdomain();
  return `${protocol}//${authSubdomain}.${baseDomain}`;
}

/**
 * Get API domain URL for client-side requests
 */
export function getApiDomainClient(): string {
  const currentHostname = window.location.hostname;
  const protocol = window.location.protocol;

  // For localhost, use port 3002 for API
  if (currentHostname === "localhost" || currentHostname.startsWith("127.")) {
    const isDev = process.env.NODE_ENV === "development";
    const apiPort = isDev ? "3002" : "3000";
    return `${protocol}//${currentHostname}:${apiPort}`;
  }

  // Extract base domain and create API subdomain
  const parts = currentHostname.split(".");
  let baseDomain: string;

  if (parts.length >= 2) {
    baseDomain = parts.slice(-2).join(".");
  } else {
    baseDomain = currentHostname;
  }

  const apiSubdomain = getApiSubdomain();
  return `${protocol}//${apiSubdomain}.${baseDomain}`;
}

/**
 * Check if we're currently on a subdomain
 */
export function isCurrentSubdomain(): boolean {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  // More than 2 parts means subdomain (unless it's www)
  return parts.length > 2 && parts[0] !== "www";
}

/**
 * Redirect to auth domain with current URL as callback
 */
export function redirectToAuth(path: string = "/login"): void {
  const authDomain = getAuthDomainClient();
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = `${authDomain}${path}?callback=${currentUrl}`;
}
