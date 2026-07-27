import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

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
    '@food-marketplace/shared-types',
    '@food-marketplace/ui',
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

export default withNextIntl(withBundleAnalyzer(nextConfig));
