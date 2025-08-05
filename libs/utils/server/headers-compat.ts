// Compatibility layer for next/headers to avoid client-side import errors
// This provides a unified interface for accessing headers in both server and client contexts

interface HeadersLike {
  get(name: string): string | null;
}

/**
 * Safe headers access that works in both server and client contexts
 * This prevents the "next/headers can only be used in Server Components" error
 */
export async function getSafeHeaders(): Promise<HeadersLike> {
  // Client-side fallback
  if (typeof window !== 'undefined') {
    return {
      get: (name: string) => {
        switch (name) {
          case 'host':
            return window.location.host;
          case 'x-forwarded-proto':
            return window.location.protocol.replace(':', '');
          case 'x-lang':
            return localStorage.getItem('language') || 'en';
          case 'x-tenant-id':
            return localStorage.getItem('tenantId') || null;
          default:
            return null;
        }
      }
    };
  }

  // Server-side dynamic import
  try {
    const { headers } = await import('next/headers');
    return await headers();
  } catch (error) {
    console.warn('Failed to import next/headers, using null fallback');
    return {
      get: () => null
    };
  }
}

/**
 * Get cookies safely in both server and client contexts
 */
export async function getSafeCookies(): Promise<{ get(name: string): { value: string } | undefined }> {
  // Client-side fallback
  if (typeof window !== 'undefined') {
    return {
      get: (name: string) => {
        const value = document.cookie
          .split(';')
          .find(c => c.trim().startsWith(`${name}=`))
          ?.split('=')[1];
        return value ? { value } : undefined;
      }
    };
  }

  // Server-side dynamic import
  try {
    const { cookies } = await import('next/headers');
    return await cookies();
  } catch (error) {
    console.warn('Failed to import next/headers cookies, using null fallback');
    return {
      get: () => undefined
    };
  }
}

/**
 * Check if we're running in a server context
 */
export function isServerContext(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if we're running in a client context
 */
export function isClientContext(): boolean {
  return typeof window !== 'undefined';
}