/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { 
    unoptimized: true,
    // Add caching headers for image optimization
    formats: ['image/webp', 'image/avif'],
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.100.3',
    '192.168.100.10',
  ],
  // Improve build stability and error handling
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Cache static assets for 1 year (max)
  headers: () => {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev()).catch(err => {
  console.error('[next.config] OpenNext Cloudflare initialization error:', err);
});
