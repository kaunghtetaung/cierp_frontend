// Client-side API utilities
"use client";

import { getApiDomainClient } from "./auth";

/**
 * Build API URL for client-side requests
 */
export function buildApiUrl(endpoint: string): string {
  const apiDomain = getApiDomainClient();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${apiDomain}/api${cleanEndpoint}`;
}

/**
 * Fetch wrapper with automatic API domain resolution
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  endpoint: string,
  headers?: HeadersInit
): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET", headers });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  data?: any,
  headers?: HeadersInit
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  data?: any,
  headers?: HeadersInit
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(
  endpoint: string,
  headers?: HeadersInit
): Promise<T> {
  return apiRequest<T>(endpoint, { method: "DELETE", headers });
}
