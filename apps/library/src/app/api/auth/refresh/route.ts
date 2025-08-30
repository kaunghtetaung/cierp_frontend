// Refresh session API route for Core
import { NextRequest } from 'next/server';
import { handleRefreshSession } from '@repo/auth/server-api';

export async function POST(request: NextRequest) {
  return handleRefreshSession(request);
}