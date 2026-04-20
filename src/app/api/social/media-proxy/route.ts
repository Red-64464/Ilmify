// GET /api/social/media-proxy?url=<encoded>&referer=<platform>
// Streams media through our origin so CDNs that require a Referer header
// (TikTok, Instagram) play correctly in the <video> tag without CORS issues.
import { NextRequest, NextResponse } from 'next/server';

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

function refererFor(platform: string): string {
  switch (platform) {
    case 'tiktok': return 'https://www.tiktok.com/';
    case 'instagram': return 'https://www.instagram.com/';
    case 'twitter': return 'https://twitter.com/';
    case 'youtube': return 'https://www.youtube.com/';
    default: return '';
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');
  const platform = searchParams.get('platform') || '';

  if (!target) return NextResponse.json({ error: 'url manquant' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json({ error: 'Protocole interdit' }, { status: 400 });
  }

  const hostOk = ALLOWED_HOSTS.some((h) => parsed.hostname.endsWith(h));
  if (!hostOk) {
    return NextResponse.json({ error: 'Hôte non autorisé' }, { status: 403 });
  }

  const headers: Record<string, string> = {
    'User-Agent': UA,
    Accept: '*/*',
  };
  const ref = refererFor(platform);
  if (ref) headers.Referer = ref;

  // Forward Range header for seeking
  const range = req.headers.get('range');
  if (range) headers.Range = range;

  const upstream = await fetch(target, { headers });

  const resHeaders = new Headers();
  const forward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag'];
  for (const h of forward) {
    const v = upstream.headers.get(h);
    if (v) resHeaders.set(h, v);
  }
  resHeaders.set('Cache-Control', 'public, max-age=3600');
  resHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}
