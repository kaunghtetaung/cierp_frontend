/**
 * Media Page - App-specific file browser
 * Route: /[appId]/media
 */

import { headers } from 'next/headers';
import { MediaClient } from './media-client';
import { validateRequest } from '@repo/auth/core';

export default async function MediaPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  const sessionId = headersList.get('x-session-id');

  if (!tenantId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600">Error: Missing tenant context</div>
      </div>
    );
  }

  // Get user info from session
  let username = 'user';
  if (sessionId) {
    try {
      const authResult = await validateRequest(sessionId);
      if (authResult.isAuthenticated && authResult.user) {
        // Use email username or user ID as folder name
        username = authResult.user.email?.split('@')[0] || authResult.user.id;
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
    }
  }

  return <MediaClient appId={appId} tenantId={tenantId} username={username} />;
}
