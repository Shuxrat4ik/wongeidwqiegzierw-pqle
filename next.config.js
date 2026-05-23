/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.100.3',
    '192.168.100.10',
  ],
};

module.exports = nextConfig;
