// Client-side domain helper utilities
'use client';

import { buildPublicUrl, getAppropriateProtocol } from '../common/url';

/**
 * Get public URL with www prefix for client-side usage - simplified for standard port 80
 * Examples:
 * - core.um1ygn.edu.mm -> http://www.um1ygn.edu.mm
 * - www.crystal-image.net -> http://www.crystal-image.net
 * - localhost -> http://www.localhost
 */
export function getPublicUrlClient(): string {
  const currentHostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // With IP-based setup, no port handling needed
  return buildPublicUrl(currentHostname, protocol);
}

/**
 * Get current full URL for redirect purposes
 */
export function getCurrentUrlClient(): string {
  return window.location.href;
}