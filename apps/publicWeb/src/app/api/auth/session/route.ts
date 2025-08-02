// Session status API route for publicWeb
import { NextRequest } from 'next/server';
import { handleSessionStatus } from '@repo/auth/server-api';

export async function GET(request: NextRequest) {
  return handleSessionStatus(request);
}