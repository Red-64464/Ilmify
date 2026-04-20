// POST /api/social/import
// Resolves metadata + playable media URL via a cascade of FREE public APIs
// (tikwm for TikTok, vxtwitter for X, IG embed scraping, YT oembed),
// falling back to cobalt.tools, and finally to yt-dlp.
import { NextRequest, NextResponse } from 'next/server';
import { parseSocialUrl } from '@/lib/social/platforms';
import { resolveSocialMedia } from '@/lib/social/resolvers';
import type { SocialPlatform, SocialPostStats } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ImportResponse {
  url: string;
  canonicalUrl: string;
  platform: SocialPlatform;
  externalId?: string;
  title?: string;
  author?: string;
  authorAvatarUrl?: string;
  caption?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  mediaType: 'video' | 'image' | 'audio';
  durationSec?: number;
  stats: SocialPostStats;
  resolvedVia?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const rawUrl = (body.url || '').trim();
  if (!rawUrl) return NextResponse.json({ error: 'URL manquante' }, { status: 400 });

  const parsed = parseSocialUrl(rawUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: 'URL non reconnue (TikTok, Instagram, Twitter/X ou YouTube)' },
      { status: 400 },
    );
  }

  // 1. Try fast public APIs first
  let resolved = await resolveSocialMedia(parsed.platform, parsed.canonicalUrl, parsed.externalId);

  // 2. YouTube deliberately has no mediaUrl (iframe embed). Other platforms need it.
  const needsMedia = parsed.platform !== 'youtube' && !resolved?.mediaUrl;
  if (!resolved || needsMedia) {
    try {
      const ydl = await fetchViaYtDlp(parsed.canonicalUrl);
      resolved = {
        title: resolved?.title || (ydl.title as string | undefined),
        author: resolved?.author || (ydl.uploader as string) || (ydl.channel as string) || (ydl.uploader_id as string),
        authorAvatarUrl: resolved?.authorAvatarUrl || (ydl.uploader_url as string | undefined),
        caption: resolved?.caption || (ydl.description as string | undefined),
        thumbnailUrl: resolved?.thumbnailUrl || (ydl.thumbnail as string | undefined),
        mediaUrl: resolved?.mediaUrl || pickPlayableUrl(ydl),
        durationSec: resolved?.durationSec ?? (typeof ydl.duration === 'number' ? (ydl.duration as number) : undefined),
        stats: {
          likes: resolved?.stats?.likes ?? (ydl.like_count as number | undefined),
          views: resolved?.stats?.views ?? (ydl.view_count as number | undefined),
          comments: resolved?.stats?.comments ?? (ydl.comment_count as number | undefined),
          shares: resolved?.stats?.shares ?? (ydl.repost_count as number | undefined),
        },
        source: (resolved?.source ? `${resolved.source}+ytdlp` : 'ytdlp'),
      };
    } catch (err) {
      // If we had a partial resolved (e.g. IG with only thumb), still return it
      if (!resolved) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          { error: `Extraction impossible : ${msg}`, platform: parsed.platform },
          { status: 502 },
        );
      }
    }
  }

  if (!resolved) {
    return NextResponse.json(
      { error: 'Aucune source capable d\'extraire ce contenu', platform: parsed.platform },
      { status: 502 },
    );
  }

  const payload: ImportResponse = {
    url: parsed.canonicalUrl,
    canonicalUrl: parsed.canonicalUrl,
    platform: parsed.platform,
    externalId: parsed.externalId,
    title: resolved.title,
    author: resolved.author,
    authorAvatarUrl: resolved.authorAvatarUrl,
    caption: resolved.caption,
    thumbnailUrl: resolved.thumbnailUrl,
    mediaUrl: resolved.mediaUrl,
    mediaType: 'video',
    durationSec: resolved.durationSec,
    stats: resolved.stats,
    resolvedVia: resolved.source,
  };

  return NextResponse.json(payload);
}

// ── yt-dlp final fallback ──
async function fetchViaYtDlp(url: string): Promise<Record<string, unknown>> {
  const mod = await import('youtube-dl-exec');
  const youtubedl = (mod as unknown as { default: typeof import('youtube-dl-exec').default }).default
    ?? (mod as unknown as typeof import('youtube-dl-exec').default);
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
  });
  return info as unknown as Record<string, unknown>;
}

function pickPlayableUrl(info: Record<string, unknown>): string | undefined {
  const top = info.url as string | undefined;
  if (top && typeof top === 'string' && top.startsWith('http')) return top;

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

  const any = formats.find((f) => typeof f.url === 'string');
  return any?.url as string | undefined;
}
