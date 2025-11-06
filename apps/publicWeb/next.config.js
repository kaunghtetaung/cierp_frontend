/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    // Expose subdomain configuration to client-side
    NEXT_PUBLIC_API_SUBDOMAIN: process.env.API_SUBDOMAIN || process.env.NEXT_PUBLIC_API_SUBDOMAIN || (process.env.NODE_ENV === 'development' ? 'api-dev' : 'api'),
    NEXT_PUBLIC_AUTH_SUBDOMAIN: process.env.AUTH_SUBDOMAIN || process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || (process.env.NODE_ENV === 'development' ? 'auth-dev' : 'auth'),
    // Disable canvas in pdfjs-dist
    PDFJS_PREBUILT_DIR: '',
  },
  experimental: {
    instrumentationHook: true, // Enable instrumentation hook for config service
    optimizePackageImports: ['@repo/ui', '@repo/utils', '@repo/language'],
  },
  webpack: (config, { isServer, webpack, dev }) => {
    // Configure devtool for react-pdf compatibility (avoid 'eval-*') in production only
    if (!dev) {
      config.devtool = 'source-map';
    }

    if (!isServer) {
      // Use IgnorePlugin to completely skip canvas module resolution
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );

      // Add alias to prevent canvas imports
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };

      // Add fallback for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        stream: false,
        util: false,
      };
    }
    return config;
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
      // Note: S3/storage domains are handled by S3Image component with unoptimized flag
      // This allows any storage domain without needing to update config
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