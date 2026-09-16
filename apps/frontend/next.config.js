/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

module.exports = {
  // Allow the dev server to be reached through the live-preview proxy
  // (https://<port>-<sandbox>.e2b.app) without cross-origin warnings/rejections.
  allowedDevOrigins: ['*.e2b.app', '*.arena.ai'],
  async rewrites() {
    // Proxy all /api/* requests to the Express backend so the browser only
    // ever talks to the frontend origin (works in dev and in preview).
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};
