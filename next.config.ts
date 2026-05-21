import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub avatars
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com', // Tool logos
      },
      {
        protocol: 'https',
        hostname: 'www.google.com', // Favicon fallback
      },
      {
        protocol: 'https',
        hostname: 't0.gstatic.com', // Google favicons
      },
    ],
  },
};

export default nextConfig;
