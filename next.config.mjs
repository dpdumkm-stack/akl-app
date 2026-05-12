/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Puppeteer (running from 127.0.0.1) to access Next.js dev resources
  // Required for PDF generation via /print/[id] route
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
      allowedOrigins: ['app.apindoepoxy.co.id', 'apindoepoxy.co.id'],
    },
  },
};

export default nextConfig;
