import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@food-marketplace/auth',
    '@food-marketplace/cache',
    '@food-marketplace/config',
    '@food-marketplace/domain',
    '@food-marketplace/feature-flags',
    '@food-marketplace/rate-limit',
    '@food-marketplace/resilience',
    '@food-marketplace/shared',
  ],
  serverExternalPackages: ['pg', 'ioredis'],
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/health/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
