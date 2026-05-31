import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['ffmpeg-static', 'youtube-dl-exec'],
};

export default nextConfig;
