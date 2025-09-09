/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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