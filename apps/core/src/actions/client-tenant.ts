'use server';

import { cookies } from 'next/headers';

/**
 * Get tenant ID for client components
 * Reads directly from cookies to ensure it works in server actions
 */
export async function getClientTenantId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('x-tenant-id')?.value || '';

    console.log('[getClientTenantId] Retrieved tenantId from cookie:', tenantId);

    return tenantId;
  } catch (error) {
    console.error('[getClientTenantId] Error:', error);
    return '';
  }
}
