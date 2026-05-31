// POST /api/social/transcribe
// Uses the reliable public-API resolvers to get a direct media URL,
// downloads a chunk (up to 20 MB), and sends it to Groq Whisper with
// segment-level timestamps. Falls back to yt-dlp if needed.
import { NextRequest, NextResponse } from 'next/server';
import { parseSocialUrl } from '@/lib/social/platforms';
import { resolveSocialMedia } from '@/lib/social/resolvers';
import type { TranscriptSegment } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20MB (Groq limit ~25MB)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  const url = (body.url || '').trim();
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 });

  const parsed = parseSocialUrl(url);
  if (!parsed) return NextResponse.json({ error: 'URL non reconnue' }, { status: 400 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: 'GROQ_API_KEY non configurée' }, { status: 500 });

  try {
    // 1. Resolve a direct media/audio URL via public APIs first
    const audioInfo = await getAudioSource(parsed.canonicalUrl, parsed.platform, parsed.externalId);
    if (!audioInfo) {
      return NextResponse.json({ error: 'Impossible d\'extraire l\'audio de cette vidéo' }, { status: 502 });
    }

    // 2. Download (range-limited)
    const audioRes = await fetch(audioInfo.url, {
      headers: {
        'User-Agent': UA,
        Range: `bytes=0-${MAX_AUDIO_BYTES - 1}`,
        Referer: refererFor(parsed.platform),
      },
    });
    if (!audioRes.ok && audioRes.status !== 206) {
      return NextResponse.json({ error: `Téléchargement audio échoué (${audioRes.status})` }, { status: 502 });
    }
    const audioBuffer = await audioRes.arrayBuffer();
    if (audioBuffer.byteLength < 1000) {
      return NextResponse.json({ error: 'Audio trop petit / invalide' }, { status: 502 });
    }

    // 3. Groq Whisper verbose_json with segment timestamps
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: audioInfo.mimeType }), `audio.${audioInfo.ext}`);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'segment');

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: form,
    });

    if (!whisperRes.ok) {
      const errTxt = await whisperRes.text();
      return NextResponse.json(
        { error: `Groq Whisper erreur ${whisperRes.status}: ${errTxt.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const data = (await whisperRes.json()) as {
      text?: string;
      language?: string;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    const segments: TranscriptSegment[] = (data.segments || []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));

    return NextResponse.json({
      text: (data.text || '').trim(),
      language: data.language || 'auto',
      segments,
      source: audioInfo.source,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur: ${msg}` }, { status: 500 });
  }
}

function refererFor(platform: string): string {
  switch (platform) {
    case 'tiktok': return 'https://www.tiktok.com/';
    case 'instagram': return 'https://www.instagram.com/';
    case 'twitter': return 'https://twitter.com/';
    case 'youtube': return 'https://www.youtube.com/';
    default: return 'https://www.google.com/';
  }
}

async function getAudioSource(
  url: string,
  platform: import('@/types').SocialPlatform,
  externalId?: string,
): Promise<{ url: string; mimeType: string; ext: string; source: string } | null> {
  // 1. Public API resolver (fast + reliable)
  const resolved = await resolveSocialMedia(platform, url, externalId);
  if (resolved?.audioUrl) {
    return { url: resolved.audioUrl, mimeType: 'audio/mp4', ext: 'm4a', source: resolved.source };
  }
  if (resolved?.mediaUrl) {
    // Video file — Whisper can extract audio from mp4/webm directly
    const ext = resolved.mediaUrl.includes('.webm') ? 'webm' : 'mp4';
    const mime = ext === 'webm' ? 'video/webm' : 'video/mp4';
    return { url: resolved.mediaUrl, mimeType: mime, ext, source: resolved.source };
  }

  // 2. Fallback: yt-dlp
  try {
    const mod = await import('youtube-dl-exec');
    const youtubedl = (mod as unknown as { default: typeof import('youtube-dl-exec').default }).default
      ?? (mod as unknown as typeof import('youtube-dl-exec').default);
    const info = (await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
    })) as unknown as Record<string, unknown>;

    const formats = (info.formats as Array<Record<string, unknown>>) || [];

    const audioOnly = formats
      .filter((f) => f.vcodec === 'none' && f.acodec !== 'none' && typeof f.url === 'string')
      .sort((a, b) => ((a.filesize as number) || Infinity) - ((b.filesize as number) || Infinity));

    if (audioOnly.length > 0) {
      const chosen = audioOnly[0];
      const ext = (chosen.ext as string) || 'mp4';
      const mime = ext === 'webm' ? 'audio/webm' : ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
      return { url: chosen.url as string, mimeType: mime, ext, source: 'ytdlp' };
    }

    const combined = formats.find(
      (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && typeof f.url === 'string',
    );
    if (combined) {
      const ext = (combined.ext as string) || 'mp4';
      const mime = ext === 'webm' ? 'video/webm' : 'video/mp4';
      return { url: combined.url as string, mimeType: mime, ext, source: 'ytdlp' };
    }

    const top = info.url as string | undefined;
    if (top && top.startsWith('http')) return { url: top, mimeType: 'video/mp4', ext: 'mp4', source: 'ytdlp' };
    return null;
  } catch (err) {
    console.error('[social-transcribe] yt-dlp error:', err);
    return null;
  }
}
