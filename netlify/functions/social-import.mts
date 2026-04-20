// Netlify Function v2 — social-import
// Extracts metadata from a TikTok/Instagram/Twitter/YouTube URL via yt-dlp.
import type { Context } from '@netlify/functions';

type Platform = 'tiktok' | 'instagram' | 'twitter' | 'youtube' | 'other';

interface Parsed {
  platform: Platform;
  externalId: string;
  canonicalUrl: string;
}

function parseUrl(raw: string): Parsed | null {
  const url = raw.trim();
  const pats: Array<{ p: Platform; re: RegExp; canon: (m: RegExpMatchArray) => string }> = [
    { p: 'youtube', re: /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/, canon: (m) => `https://www.youtube.com/watch?v=${m[1]}` },
    { p: 'tiktok', re: /tiktok\.com\/(@[^/]+)\/video\/(\d+)/, canon: (m) => `https://www.tiktok.com/${m[1]}/video/${m[2]}` },
    { p: 'tiktok', re: /(?:vm|vt)\.tiktok\.com\/([A-Za-z0-9]+)/, canon: (m) => `https://vm.tiktok.com/${m[1]}` },
    { p: 'instagram', re: /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/, canon: (m) => `https://www.instagram.com/reel/${m[1]}/` },
    { p: 'twitter', re: /(?:twitter|x)\.com\/([^/]+)\/status\/(\d+)/, canon: (m) => `https://x.com/${m[1]}/status/${m[2]}` },
  ];
  for (const { p, re, canon } of pats) {
    const m = url.match(re);
    if (m) {
      const externalId = p === 'twitter' || p === 'tiktok' ? (m[2] || m[1]) : m[1];
      return { platform: p, externalId, canonicalUrl: canon(m) };
    }
  }
  return null;
}

function pickPlayableUrl(info: Record<string, unknown>): string | undefined {
  const top = info.url as string | undefined;
  if (top && top.startsWith('http')) return top;
  const formats = (info.formats as Array<Record<string, unknown>>) || [];
  const combined = formats.filter(
    (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && typeof f.url === 'string',
  );
  if (combined.length > 0) {
    combined.sort((a, b) => {
      const ma = a.ext === 'mp4' ? 0 : 1;
      const mb = b.ext === 'mp4' ? 0 : 1;
      if (ma !== mb) return ma - mb;
      return ((b.tbr as number) || 0) - ((a.tbr as number) || 0);
    });
    return combined[0].url as string;
  }
  return (formats.find((f) => typeof f.url === 'string')?.url as string) || undefined;
}

export default async (req: Request, _ctx: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  const parsed = parseUrl(body.url || '');
  if (!parsed) return Response.json({ error: 'URL non reconnue' }, { status: 400 });

  try {
    const mod = await import('youtube-dl-exec');
    const youtubedl = (mod as unknown as { default: typeof import('youtube-dl-exec').default }).default ?? (mod as unknown as typeof import('youtube-dl-exec').default);
    const info = (await youtubedl(parsed.canonicalUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
    })) as unknown as Record<string, unknown>;

    return Response.json({
      url: parsed.canonicalUrl,
      canonicalUrl: parsed.canonicalUrl,
      platform: parsed.platform,
      externalId: parsed.externalId,
      title: (info.title as string) || undefined,
      author: (info.uploader as string) || (info.channel as string) || undefined,
      authorAvatarUrl: (info.uploader_url as string) || undefined,
      caption: (info.description as string) || undefined,
      thumbnailUrl: (info.thumbnail as string) || undefined,
      mediaUrl: pickPlayableUrl(info),
      mediaType: 'video',
      durationSec: typeof info.duration === 'number' ? info.duration : undefined,
      stats: {
        likes: (info.like_count as number) || undefined,
        views: (info.view_count as number) || undefined,
        comments: (info.comment_count as number) || undefined,
        shares: (info.repost_count as number) || undefined,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Extraction impossible: ${msg}` }, { status: 502 });
  }
};
