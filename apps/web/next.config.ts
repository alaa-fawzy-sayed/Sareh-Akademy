import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // السماح بالـ local paths من public/ بدون تحسين إضافي
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '*.toppharma.edu' },
    ],
  },
};

export default nextConfig;
