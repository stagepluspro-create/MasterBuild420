/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,

  // Use SWC minification (default in Next.js 14)
  swcMinify: true,

  // Modern Next.js handles chunk optimization automatically
  // No custom webpack configuration needed
};

module.exports = nextConfig;
