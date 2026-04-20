import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['ffmpeg-static', 'youtube-dl-exec'],
};

export default nextConfig;
