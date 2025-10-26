/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  // Enable instrumentation for console wrapper
  experimental: {
    instrumentationHook: true,
  },
  env: {
    // Expose subdomain configuration to client-side
    NEXT_PUBLIC_API_SUBDOMAIN: process.env.API_SUBDOMAIN || process.env.NEXT_PUBLIC_API_SUBDOMAIN || (process.env.NODE_ENV === 'development' ? 'api-dev' : 'api'),
    NEXT_PUBLIC_AUTH_SUBDOMAIN: process.env.AUTH_SUBDOMAIN || process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || (process.env.NODE_ENV === 'development' ? 'auth-dev' : 'auth'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure webpack to handle source maps properly
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use source-map for better debugging experience in Chrome DevTools
      // This provides the best quality source maps for debugging
      config.devtool = 'source-map';
      
      // Ignore missing source map files to prevent 404 errors
      config.ignoreWarnings = [
        /Failed to parse source map/,
        /Critical dependency: the request of a dependency is an expression/,
      ];
    }
    return config;
  },
  // Disable production source maps to reduce bundle size
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;