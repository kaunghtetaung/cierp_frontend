/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  transpilePackages: ['@repo/nrc-hooks'],
  // Configure Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow up to 50MB file uploads
    },
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
  // Configure webpack to handle source maps properly and pdfjs-dist compatibility
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

    // Fix pdfjs-dist compatibility with webpack
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };

      // Exclude canvas module from client-side bundle
      config.externals = {
        ...config.externals,
        canvas: 'canvas',
      };
    }

    return config;
  },
  // Disable production source maps to reduce bundle size
  productionBrowserSourceMaps: false,
  compiler: {
    // IMPORTANT: Do NOT remove console in production
    // We use console wrapper to output structured JSON logs for Loki
    removeConsole: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Allow images from tenant domains for Next.js optimization
      {
        protocol: 'https',
        hostname: '**.edu.mm',
      },
      {
        protocol: 'http',
        hostname: '**.edu.mm',
      },
      {
        protocol: 'https',
        hostname: '**.crystal-image.net',
      },
      {
        protocol: 'http',
        hostname: '**.crystal-image.net',
      },
      // Note: S3/storage domains should use unoptimized flag in Image component
      // This allows any storage domain without needing to update config
    ],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
};

module.exports = nextConfig;