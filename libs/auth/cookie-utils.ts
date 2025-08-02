// Authentication cookie utilities with root domain support
import { NextResponse } from "next/server";

// Import centralized getRootDomain function to eliminate duplication
import { getRootDomain } from "./core/cookies";

/**
 * Set session cookie with root domain support
 */
export function setSessionCookie(
  response: NextResponse,
  sessionId: string,
  hostname: string,
  options: {
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
  } = {}
): void {
  const {
    maxAge = 24 * 60 * 60, // 24 hours
    secure = process.env.NODE_ENV === "production",
    sameSite = "lax",
    httpOnly = true
  } = options;

  const rootDomain = getRootDomain(hostname);
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const securePart = secure ? "Secure; " : "";
  
  // Only set Domain if it's not localhost
  const domainPart = hostname.includes('localhost') || hostname.includes('127.0.0.1') 
    ? '' 
    : `Domain=${rootDomain}; `;

  const cookieString = `session=${sessionId}; ${domainPart}Path=/; Expires=${expires}; ${httpOnly ? 'HttpOnly; ' : ''}${securePart}SameSite=${sameSite}`;
  
  response.headers.append("Set-Cookie", cookieString);
}

/**
 * Delete session cookie with root domain support
 */
export function deleteSessionCookie(
  response: NextResponse,
  hostname: string
): void {
  const rootDomain = getRootDomain(hostname);
  
  // Only set Domain if it's not localhost
  const domainPart = hostname.includes('localhost') || hostname.includes('127.0.0.1') 
    ? '' 
    : `Domain=${rootDomain}; `;

  const cookieString = `session=; ${domainPart}Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax`;
  
  response.headers.append("Set-Cookie", cookieString);
}

/**
 * Set auth-related cookie with root domain support
 */
export function setAuthCookie(
  response: NextResponse,
  name: string,
  value: string,
  hostname: string,
  options: {
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
  } = {}
): void {
  const {
    maxAge = 24 * 60 * 60, // 24 hours
    secure = process.env.NODE_ENV === "production",
    sameSite = "lax",
    httpOnly = false
  } = options;

  const rootDomain = getRootDomain(hostname);
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const securePart = secure ? "Secure; " : "";
  
  // Only set Domain if it's not localhost
  const domainPart = hostname.includes('localhost') || hostname.includes('127.0.0.1') 
    ? '' 
    : `Domain=${rootDomain}; `;

  const cookieString = `${name}=${value}; ${domainPart}Path=/; Expires=${expires}; ${httpOnly ? 'HttpOnly; ' : ''}${securePart}SameSite=${sameSite}`;
  
  response.headers.append("Set-Cookie", cookieString);
}

/**
 * Delete auth-related cookie with root domain support
 */
export function deleteAuthCookie(
  response: NextResponse,
  name: string,
  hostname: string
): void {
  const rootDomain = getRootDomain(hostname);
  
  // Only set Domain if it's not localhost
  const domainPart = hostname.includes('localhost') || hostname.includes('127.0.0.1') 
    ? '' 
    : `Domain=${rootDomain}; `;

  const cookieString = `${name}=; ${domainPart}Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=lax`;
  
  response.headers.append("Set-Cookie", cookieString);
}