// Login API route for publicWeb
import { NextRequest } from 'next/server';
import { handleLoginRequest } from '@repo/auth/server-api';

export async function GET(request: NextRequest) {
  return handleLoginRequest(request);
}