// Login redirect page for Core app
// This page redirects users to the public website login page
'use client';

import { useEffect } from 'react';
import { getPublicUrlClient } from '@repo/utils/client/domain';

export default function LoginRedirectPage() {
  useEffect(() => {
    // Get the return URL from query params
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    
    // Build the public website login URL
    const publicUrl = getPublicUrlClient();
    const loginUrl = new URL('/login', publicUrl);
    
    if (returnUrl) {
      loginUrl.searchParams.set('returnUrl', returnUrl);
    }
    
    // Redirect to public website login
    window.location.href = loginUrl.toString();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}