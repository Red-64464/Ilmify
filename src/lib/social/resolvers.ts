// Multi-source media resolvers for social platforms.
// Strategy: try free public APIs first (no auth, no rate limits), fallback to yt-dlp.
//
// - TikTok    → tikwm.com (free, reliable, no auth)
// - Twitter/X → api.vxtwitter.com (free, FOSS, Discord-tier uptime)
// - Instagram → embed scraping + cobalt.tools fallback
// - YouTube   → iframe embed (no download needed)
import type { SocialPlatform, SocialPostStats } from '@/types';

export interface ResolvedMedia {
  title?: string;
  author?: string;
  authorAvatarUrl?: string;
  caption?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;           // direct CDN URL to video/image (empty for YouTube)
  audioUrl?: string;           // optional separate audio stream URL
  durationSec?: number;
  stats: SocialPostStats;
  source: string;              // which resolver produced this
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─────────────────────────────────────────────────────────
// TikTok — tikwm.com
// ─────────────────────────────────────────────────────────
export async function resolveTikTok(url: string): Promise<ResolvedMedia | null> {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json() as {
      code: number;
      data?: {
        play?: string; hdplay?: string; wmplay?: string;
        cover?: string; origin_cover?: string;
        title?: string; duration?: number;
        author?: { unique_id?: string; nickname?: string; avatar?: string };
        digg_count?: number; play_count?: number;
        comment_count?: number; share_count?: number;
      };
    };
    if (json.code !== 0 || !json.data) return null;
    const d = json.data;
    return {
      title: d.title,
      author: d.author?.unique_id || d.author?.nickname,
      authorAvatarUrl: d.author?.avatar,
      caption: d.title,
      thumbnailUrl: d.origin_cover || d.cover,
      mediaUrl: d.hdplay || d.play,
      durationSec: d.duration,
      stats: {
        likes: d.digg_count,
        views: d.play_count,
        comments: d.comment_count,
        shares: d.share_count,
      },
      source: 'tikwm',
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// Twitter / X — vxtwitter.com (FOSS, free)
// ─────────────────────────────────────────────────────────
export async function resolveTwitter(url: string, tweetId?: string): Promise<ResolvedMedia | null> {
  const id = tweetId || extractTweetId(url);
  if (!id) return null;
  try {
    const res = await fetch(`https://api.vxtwitter.com/Twitter/status/${id}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json() as {
      text?: string;
      user_name?: string;
      user_screen_name?: string;
      likes?: number;
      retweets?: number;
      replies?: number;
      date_epoch?: number;
      mediaURLs?: string[];
      media_extended?: Array<{
        url: string;
        type: 'video' | 'image' | 'gif';
        duration_millis?: number;
        thumbnail_url?: string;
      }>;
    };
    const media = (json.media_extended || []).find((m) => m.type === 'video' || m.type === 'gif')
      || (json.media_extended || [])[0];
    return {
      title: (json.text || '').slice(0, 120),
      author: json.user_screen_name,
      caption: json.text,
      thumbnailUrl: media?.thumbnail_url || json.mediaURLs?.[0],
      mediaUrl: media?.url || json.mediaURLs?.[0],
      durationSec: media?.duration_millis ? media.duration_millis / 1000 : undefined,
      stats: {
        likes: json.likes,
        views: json.retweets,
        comments: json.replies,
      },
      source: 'vxtwitter',
    };
  } catch {
    return null;
  }
}

function extractTweetId(url: string): string | null {
  const m = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────
// Instagram — embed scraping (very reliable for public reels)
// ─────────────────────────────────────────────────────────
export async function resolveInstagram(url: string): Promise<ResolvedMedia | null> {
  // Normalize to /reel/{code}/ or /p/{code}/
  const codeMatch = url.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
  if (!codeMatch) return null;
  const code = codeMatch[1];

  // Try embed page HTML first (contains video URL + metadata)
  try {
    const embedUrl = `https://www.instagram.com/p/${code}/embed/captioned/`;
    const html = await fetch(embedUrl, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }).then((r) => r.ok ? r.text() : null);

    if (html) {
      // Find video URL
      const videoMatch = html.match(/"video_url":"([^"]+)"/)
        || html.match(/"contentUrl":"([^"]+\.mp4[^"]*)"/);
      const thumbMatch = html.match(/"display_url":"([^"]+)"/)
        || html.match(/"thumbnail_src":"([^"]+)"/)
        || html.match(/<meta property="og:image" content="([^"]+)"/);
      const authorMatch = html.match(/"username":"([^"]+)"/)
        || html.match(/@([A-Za-z0-9_.]+)<\/a>/);
      const captionMatch = html.match(/"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"([^"]+)"/);

      const decode = (s: string) => s.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\"/g, '"');

      if (videoMatch || thumbMatch) {
        return {
          title: captionMatch ? decode(captionMatch[1]).slice(0, 120) : undefined,
          author: authorMatch?.[1],
          caption: captionMatch ? decode(captionMatch[1]) : undefined,
          thumbnailUrl: thumbMatch ? decode(thumbMatch[1]) : undefined,
          mediaUrl: videoMatch ? decode(videoMatch[1]) : undefined,
          stats: {},
          source: 'instagram-embed',
        };
      }
    }
  } catch { /* fallthrough */ }

  // Fallback: cobalt.tools (FOSS, free public instance)
  return resolveViaCobalt(url, 'instagram');
}

// ─────────────────────────────────────────────────────────
// YouTube — oembed + iframe (no download needed; playback via iframe)
// ─────────────────────────────────────────────────────────
export async function resolveYouTube(url: string, videoId?: string): Promise<ResolvedMedia | null> {
  const id = videoId || extractYouTubeId(url);
  if (!id) return null;

  // Fetch public oembed for metadata
  let title: string | undefined;
  let author: string | undefined;
  let thumb: string | undefined;
  try {
    const oe = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, {
      headers: { 'User-Agent': UA },
    });
    if (oe.ok) {
      const j = await oe.json() as { title?: string; author_name?: string; thumbnail_url?: string };
      title = j.title;
      author = j.author_name;
      thumb = j.thumbnail_url;
    }
  } catch { /* ignore */ }

  return {
    title,
    author,
    thumbnailUrl: thumb || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    // We intentionally DO NOT set mediaUrl for YouTube — client renders an iframe embed.
    mediaUrl: undefined,
    stats: {},
    source: 'youtube-oembed',
  };
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────
// Cobalt.tools — FOSS universal downloader (final fallback)
// ─────────────────────────────────────────────────────────
async function resolveViaCobalt(url: string, platform: SocialPlatform): Promise<ResolvedMedia | null> {
  const endpoints = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json',
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': UA,
        },
        body: JSON.stringify({ url, vQuality: '720', filenamePattern: 'basic' }),
      });
      if (!res.ok) continue;
      const json = await res.json() as {
        status?: string;
        url?: string;
        audio?: string;
        picker?: Array<{ url: string; type?: string }>;
      };
      if (json.status === 'stream' || json.status === 'redirect' || json.status === 'success') {
        const mediaUrl = json.url || json.picker?.[0]?.url;
        if (mediaUrl) {
          return {
            mediaUrl,
            audioUrl: json.audio,
            stats: {},
            source: `cobalt:${platform}`,
          };
        }
      }
    } catch { /* try next */ }
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// Main entry
// ─────────────────────────────────────────────────────────
export async function resolveSocialMedia(
  platform: SocialPlatform,
  canonicalUrl: string,
  externalId?: string,
): Promise<ResolvedMedia | null> {
  switch (platform) {
    case 'tiktok':
      return (await resolveTikTok(canonicalUrl)) || resolveViaCobalt(canonicalUrl, platform);
    case 'twitter':
      return (await resolveTwitter(canonicalUrl, externalId)) || resolveViaCobalt(canonicalUrl, platform);
    case 'instagram':
      return resolveInstagram(canonicalUrl);
    case 'youtube':
      return resolveYouTube(canonicalUrl, externalId);
    default:
      return resolveViaCobalt(canonicalUrl, platform);
  }
}
