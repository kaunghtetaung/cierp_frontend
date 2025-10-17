// Quick test component to verify tenant resolution
import { headers } from 'next/headers';

// Force this page to be dynamic since it accesses runtime headers
export const dynamic = 'force-dynamic';

/**
 * Get API subdomain based on environment
 */
function getApiSubdomain(): string {
  const envSubdomain = process.env.API_SUBDOMAIN || process.env.NEXT_PUBLIC_API_SUBDOMAIN;
  if (envSubdomain) {
    return envSubdomain;
  }
  // Default: use 'api' for production, 'api-dev' for development
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? 'api-dev' : 'api';
}

export default async function TestTenant() {
  const headersList = await headers();

  console.log('🧪 All headers:', Object.fromEntries(headersList.entries()));

  // Try to resolve tenant directly
  try {
    const hostname = headersList.get('host') || 'localhost:3000';
    console.log('🧪 Attempting to resolve tenant for:', hostname);

    // Check if API is accessible - use environment-based subdomain
    const apiSubdomain = getApiSubdomain();
    const apiUrl = `http://${apiSubdomain}.${hostname.split(':')[0]}:3331/tenant/initialize?host=${encodeURIComponent(hostname)}`;
    console.log('🧪 API Subdomain:', apiSubdomain);
    console.log('🧪 API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('🧪 API Response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🧪 API Data:', data);
    }
  } catch (error) {
    console.error('🧪 API Error:', error);
  }
  
  return (
    <div className="p-4">
      <h2>Debug Information</h2>
      <pre className="text-xs bg-gray-100 p-2 rounded">
        {JSON.stringify(Object.fromEntries(headersList.entries()), null, 2)}
      </pre>
    </div>
  );
}