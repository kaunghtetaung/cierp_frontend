'use server';

import { cookies } from 'next/headers';
import { validateRequest } from '@repo/auth/core';
import { COOKIE_NAMES } from '@repo/utils/common/constants';

/**
 * Check if user is authenticated
 * This is a server action that can access HttpOnly cookies
 */
export async function checkAuthStatus(): Promise<{
  isAuthenticated: boolean;
  userEmail?: string;
  userId?: string;
}> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION)?.value;

    if (!sessionId) {
      return { isAuthenticated: false };
    }

    // Validate session
    const sessionInfo = await validateRequest(sessionId, {
      ipAddress: 'unknown',
      userAgent: undefined,
    });

    return {
      isAuthenticated: sessionInfo.isAuthenticated,
      userEmail: sessionInfo.user?.email,
      userId: sessionInfo.session?.userId,
    };
  } catch (error) {
    console.error('[checkAuthStatus] Error:', error);
    return { isAuthenticated: false };
  }
}
