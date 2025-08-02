// Debug API route for Core - helps diagnose cookie sharing issues
import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { COOKIE_NAMES } from '@repo/utils/common/constants';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    
    const hostname = headerStore.get('host') || '';
    const tenantId = headerStore.get('x-tenant-id');
    const allCookies = headerStore.get('cookie') || '';
    const sessionCookieValue = cookieStore.get(COOKIE_NAMES.SESSION)?.value;
    
    // Extract all cookies from header
    const cookieList = allCookies.split(';').map(c => c.trim()).filter(c => c);
    
    const debugInfo = {
      hostname,
      tenantId,
      sessionCookieFound: !!sessionCookieValue,
      sessionCookieValue: sessionCookieValue ? sessionCookieValue.substring(0, 20) + '...' : null,
      allCookiesRaw: allCookies,
      cookieList,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      userAgent: headerStore.get('user-agent'),
      origin: headerStore.get('origin'),
      referer: headerStore.get('referer')
    };
    
    console.log('Cookie Debug Info:', debugInfo);
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}