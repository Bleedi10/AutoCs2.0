/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      // Soporta prefijos de locale como /es o /es/route
      { source: '/:locale', destination: '/' },
      { source: '/:locale/:path*', destination: '/:path*' },
    ];
  },
};

export default nextConfig;

