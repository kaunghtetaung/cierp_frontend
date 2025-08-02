// Auth callback API route for publicWeb
import { NextRequest } from 'next/server';
import { handleAuthCallback } from '@repo/auth/server-api';

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}