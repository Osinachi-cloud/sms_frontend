/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    // In production (Vercel), API calls go to the Render backend.
    // In local dev, they proxy to localhost:8081.
    // If you switch to Railway, just update NEXT_PUBLIC_API_BASE_URL.
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
