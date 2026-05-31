import type { NextConfig } from "next";

// Security headers applied to every response.
// HSTS, X-Frame-Options, nosniff, referrer-policy are set by Traefik too.
// These add the remaining missing headers for defense-in-depth.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // Disable legacy XSS filter (modern browsers ignore it; can cause issues)
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=(self)',   // AudioRecorder
      'geolocation=(self)',  // Prayer times
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'interest-cohort=()',
    ].join(', '),
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      [
        "img-src 'self' data: blob:",
        'https://rayan-supabase.duckdns.org',
        'https://img.youtube.com',
        'https://i.ytimg.com',
        'https://cdninstagram.com',
        'https://*.fbcdn.net',
        'https://*.tiktokcdn.com',
        'https://tikwm.com',
      ].join(' '),
      "media-src 'self' blob: https://rayan-supabase.duckdns.org",
      [
        "connect-src 'self'",
        'https://rayan-supabase.duckdns.org',
        'wss://rayan-supabase.duckdns.org',
        'https://api.groq.com',
        'https://openrouter.ai',
        'https://api.hadith.gading.dev',
        'https://api.alquran.cloud',
        'https://equran.id',
        'https://api.aladhan.com',
        'https://tikwm.com',
        'https://pipedapi.kavin.rocks',
        'https://piped-api.privacy.com.de',
      ].join(' '),
      "frame-src 'self' https://www.youtube.com https://youtube.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rayan-supabase.duckdns.org',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    viewTransition: true,
  },
  serverExternalPackages: ['ffmpeg-static', 'youtube-dl-exec'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
