// Server-side API utilities
import { headers } from "next/headers";
import { getAuthDomain } from "./domain";

/**
 * Build internal API URL for server-side requests
 */
export async function buildInternalApiUrl(endpoint: string): Promise<string> {
  try {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") || "http";

    if (!host) {
      throw new Error("Host header not found");
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${protocol}://${host}/api${cleanEndpoint}`;
  } catch (error) {
    console.error("Failed to build internal API URL:", error);
    return `http://localhost/api${endpoint}`;
  }
}

/**
 * Server-side fetch wrapper with automatic headers forwarding
 */
export async function serverApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = await buildInternalApiUrl(endpoint);
    const headerStore = await headers();

    // Forward important headers
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add custom headers from options
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          forwardHeaders[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          forwardHeaders[key] = value;
        });
      } else {
        Object.assign(forwardHeaders, options.headers);
      }
    }

    // Forward authentication headers if present
    const authorization = headerStore.get("authorization");
    if (authorization) {
      forwardHeaders["authorization"] = authorization;
    }

    // Forward tenant information
    const tenantId = headerStore.get("x-tenant-id");
    if (tenantId) {
      forwardHeaders["x-tenant-id"] = tenantId;
    }

    const response = await fetch(url, {
      ...options,
      headers: forwardHeaders,
    });

    if (!response.ok) {
      throw new Error(
        `Server API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Server API request error:", error);
    throw error;
  }
}

/**
 * Server-side GET request helper
 */
export async function serverApiGet<T>(
  endpoint: string,
  headers?: HeadersInit
): Promise<T> {
  return serverApiRequest<T>(endpoint, { method: "GET", headers });
}

/**
 * Server-side POST request helper
 */
export async function serverApiPost<T>(
  endpoint: string,
  data?: any,
  headers?: HeadersInit
): Promise<T> {
  return serverApiRequest<T>(endpoint, {
    method: "POST",
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Create auth redirect URL for server-side redirects
 */
export async function createAuthRedirect(
  path: string = "/login",
  callbackUrl?: string
): Promise<string> {
  const authDomain = await getAuthDomain();
  const callback = callbackUrl || (await getCurrentServerUrl());
  const encodedCallback = encodeURIComponent(callback);

  return `${authDomain}${path}?callback=${encodedCallback}`;
}

/**
 * Get current server URL for redirects
 */
async function getCurrentServerUrl(): Promise<string> {
  try {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") || "http";
    const pathname = headerStore.get("x-pathname") || "/";

    if (!host) {
      return "http://localhost/";
    }

    return `${protocol}://${host}${pathname}`;
  } catch (error) {
    console.error("Failed to get current server URL:", error);
    return "http://localhost/";
  }
}
