import type { SocialPlatform } from '@/types';

export interface ParsedSocialUrl {
  platform: SocialPlatform;
  externalId: string;
  canonicalUrl: string;
}

const PATTERNS: Array<{ platform: SocialPlatform; regex: RegExp; canonical: (id: string, raw: string) => string }> = [
  {
    platform: 'youtube',
    regex: /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/,
    canonical: (id) => `https://www.youtube.com/watch?v=${id}`,
  },
  {
    platform: 'tiktok',
    regex: /tiktok\.com\/(?:@[^/]+\/video|v)\/(\d+)/,
    canonical: (id, raw) => {
      const m = raw.match(/tiktok\.com\/(@[^/]+)\/video\/(\d+)/);
      return m ? `https://www.tiktok.com/${m[1]}/video/${m[2]}` : `https://www.tiktok.com/v/${id}`;
    },
  },
  {
    // vm.tiktok.com short links — keep as-is, no numeric id yet
    platform: 'tiktok',
    regex: /(?:vm|vt)\.tiktok\.com\/([A-Za-z0-9]+)/,
    canonical: (id) => `https://vm.tiktok.com/${id}`,
  },
  {
    platform: 'instagram',
    regex: /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/,
    canonical: (id) => `https://www.instagram.com/reel/${id}/`,
  },
  {
    platform: 'twitter',
    regex: /(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/,
    canonical: (id, raw) => {
      const m = raw.match(/(?:twitter|x)\.com\/([^/]+)\/status\/(\d+)/);
      return m ? `https://x.com/${m[1]}/status/${m[2]}` : `https://x.com/i/status/${id}`;
    },
  },
];

export function parseSocialUrl(input: string): ParsedSocialUrl | null {
  const url = input.trim();
  if (!url) return null;
  for (const p of PATTERNS) {
    const m = url.match(p.regex);
    if (m) {
      return {
        platform: p.platform,
        externalId: m[1],
        canonicalUrl: p.canonical(m[1], url),
      };
    }
  }
  return null;
}

export function platformLabel(platform: SocialPlatform): string {
  switch (platform) {
    case 'tiktok': return 'TikTok';
    case 'instagram': return 'Instagram';
    case 'twitter': return 'X (Twitter)';
    case 'youtube': return 'YouTube';
    default: return 'Autre';
  }
}

export function platformColor(platform: SocialPlatform): string {
  switch (platform) {
    case 'tiktok': return '#ff0050';
    case 'instagram': return '#e1306c';
    case 'twitter': return '#1da1f2';
    case 'youtube': return '#ff0000';
    default: return '#888';
  }
}
