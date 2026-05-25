/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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

  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  headers: async () => {
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