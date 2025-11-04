/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    // Expose subdomain configuration to client-side
    NEXT_PUBLIC_API_SUBDOMAIN: process.env.API_SUBDOMAIN || process.env.NEXT_PUBLIC_API_SUBDOMAIN || (process.env.NODE_ENV === 'development' ? 'api-dev' : 'api'),
    NEXT_PUBLIC_AUTH_SUBDOMAIN: process.env.AUTH_SUBDOMAIN || process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || (process.env.NODE_ENV === 'development' ? 'auth-dev' : 'auth'),
  },
  experimental: {
    optimizePackageImports: ['@repo/ui', '@repo/utils', '@repo/language'],
    instrumentationHook: true,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.edu.mm',
      },
      {
        protocol: 'http',
        hostname: '**.edu.mm',
      },
    ],
  },
  compiler: {
    // IMPORTANT: Do NOT remove console in production
    // We use console wrapper to output structured JSON logs for Loki
    removeConsole: false,
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