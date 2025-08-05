// Server-only exports to prevent client-side bundling issues
// Import this only from server components or server-side code

// Error interceptor with full functionality (includes server dependencies)
export * from './interceptors/error-interceptor';

// Server-side API utilities
export * from './server/server';

// Auth interceptor with server dependencies  
export * from './interceptors/auth-interceptor';

// Full HTTP client with all interceptors
export * from './clients/client';

// Cached HTTP client factory (recommended for server-side usage)
export * from './clients/cached-client';