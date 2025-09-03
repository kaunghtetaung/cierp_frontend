// Quick test component to verify tenant resolution
import { headers } from 'next/headers';

// Force this page to be dynamic since it accesses runtime headers
export const dynamic = 'force-dynamic';

export default async function TestTenant() {
  const headersList = await headers();
  
  console.log('🧪 All headers:', Object.fromEntries(headersList.entries()));
  
  // Try to resolve tenant directly
  try {
    const hostname = headersList.get('host') || 'localhost:3000';
    console.log('🧪 Attempting to resolve tenant for:', hostname);
    
    // Check if API is accessible
    const apiUrl = `http://api.${hostname.split(':')[0]}:3331/tenant/initialize?host=${encodeURIComponent(hostname)}`;
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