/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@food-marketplace/auth',
    '@food-marketplace/config',
    '@food-marketplace/domain',
    '@food-marketplace/feature-flags',
    '@food-marketplace/shared',
  ],
  serverExternalPackages: ['pg'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
