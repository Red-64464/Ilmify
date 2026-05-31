// GET /api/social/media-proxy?url=<encoded>&platform=<p>&postId=<id>
// Streams media via our origin (CORS + Referer fix).
// If the CDN URL is expired (403/404/410), auto-re-resolves from the original
// post URL using the platform resolver, updates the DB, and streams the fresh URL.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveSocialMedia } from '@/lib/social/resolvers';
import { parseSocialUrl } from '@/lib/social/platforms';

export const runtime = 'nodejs';
export const maxDuration = 60;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const ALLOWED_HOSTS = [
  'tiktokcdn.com', 'tiktokcdn-us.com', 'tiktokcdn-eu.com',
  'muscdn.com', 'byteoversea.com', 'byteimg.com',
  'cdninstagram.com', 'fbcdn.net',
  'twimg.com', 'video.twimg.com',
  'ytimg.com', 'googlevideo.com',
  'tikwm.com',
];

const EXPIRED_STATUSES = new Set([400, 403, 404, 410]);

function refererFor(platform: string): string {
  switch (platform) {
    case 'tiktok': return 'https://www.tiktok.com/';
    case 'instagram': return 'https://www.instagram.com/';
    case 'twitter': return 'https://twitter.com/';
    case 'youtube': return 'https://www.youtube.com/';
    default: return '';
  }
}

function isAllowedHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some((h) => hostname.endsWith(h));
  } catch {
    return false;
  }
}

async function streamUrl(url: string, platform: string, range: string | null): Promise<Response | null> {
  if (!isAllowedHost(url)) return null;
  const headers: Record<string, string> = { 'User-Agent': UA, Accept: '*/*' };
  const ref = refererFor(platform);
  if (ref) headers.Referer = ref;
  if (range) headers.Range = range;

  try {
    const upstream = await fetch(url, { headers });
    if (EXPIRED_STATUSES.has(upstream.status)) return null;

    const resHeaders = new Headers();
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
      const v = upstream.headers.get(h);
      if (v) resHeaders.set(h, v);
    }
    resHeaders.set('Cache-Control', 'public, max-age=7200');
    resHeaders.set('Access-Control-Allow-Origin', '*');
    return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');
  const platform = searchParams.get('platform') || '';
  const postId = searchParams.get('postId') || '';
  const range = req.headers.get('range');

  if (!target) return NextResponse.json({ error: 'url manquant' }, { status: 400 });

  // 1. Try the stored CDN URL first
  const firstTry = await streamUrl(target, platform, range);
  if (firstTry) return firstTry;

  // 2. URL expired — re-resolve from original post URL if postId provided
  if (!postId) {
    return NextResponse.json({ error: 'URL expirée et postId manquant pour refresh' }, { status: 502 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'ilmify' } },
  );

  const { data: post } = await supabase
    .from('social_posts')
    .select('url, platform, external_id')
    .eq('id', postId)
    .single();

  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 });

  const parsed = parseSocialUrl(post.url);
  const resolved = await resolveSocialMedia(
    post.platform as Parameters<typeof resolveSocialMedia>[0],
    parsed?.canonicalUrl ?? post.url,
    post.external_id ?? undefined,
  );

  if (!resolved?.mediaUrl) {
    return NextResponse.json({ error: 'Résolution impossible' }, { status: 502 });
  }

  // 3. Stream the fresh URL
  const freshStream = await streamUrl(resolved.mediaUrl, platform, range);

  // 4. Update DB in background (no await — don't block the stream)
  void supabase
    .from('social_posts')
    .update({ media_url: resolved.mediaUrl, updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (!freshStream) {
    return NextResponse.json({ error: 'Stream impossible même après refresh' }, { status: 502 });
  }

  return freshStream;
}
