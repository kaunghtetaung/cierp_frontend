// Logout API route for publicWeb
import { NextRequest } from 'next/server';
import { handleLogout } from '@repo/auth/server-api';

export async function POST(request: NextRequest) {
  return handleLogout(request);
}