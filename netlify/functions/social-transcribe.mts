// Netlify Function v2 — social-transcribe
// Downloads audio via yt-dlp and transcribes via Groq Whisper with segment timestamps.
import type { Context } from '@netlify/functions';

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

interface Segment { start: number; end: number; text: string; }

async function getAudioUrl(url: string): Promise<{ url: string; mimeType: string; ext: string } | null> {
  try {
    const mod = await import('youtube-dl-exec');
    const youtubedl = (mod as unknown as { default: typeof import('youtube-dl-exec').default }).default ?? (mod as unknown as typeof import('youtube-dl-exec').default);
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
      return { url: chosen.url as string, mimeType: mime, ext };
    }
    const combined = formats.find(
      (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && typeof f.url === 'string',
    );
    if (combined) {
      const ext = (combined.ext as string) || 'mp4';
      return { url: combined.url as string, mimeType: ext === 'webm' ? 'video/webm' : 'video/mp4', ext };
    }
    const top = info.url as string | undefined;
    if (top?.startsWith('http')) return { url: top, mimeType: 'video/mp4', ext: 'mp4' };
    return null;
  } catch {
    return null;
  }
}

export default async (req: Request, _ctx: Context) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Body JSON invalide' }, { status: 400 });
  }
  const url = (body.url || '').trim();
  if (!url) return Response.json({ error: 'URL manquante' }, { status: 400 });

  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!groqKey) return Response.json({ error: 'NEXT_PUBLIC_GROQ_API_KEY manquante' }, { status: 500 });

  const audioInfo = await getAudioUrl(url);
  if (!audioInfo) return Response.json({ error: 'Impossible d\'extraire l\'audio' }, { status: 502 });

  const audioRes = await fetch(audioInfo.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Range: `bytes=0-${MAX_AUDIO_BYTES - 1}`,
    },
  });
  if (!audioRes.ok && audioRes.status !== 206) {
    return Response.json({ error: `Téléchargement audio échoué (${audioRes.status})` }, { status: 502 });
  }
  const audioBuffer = await audioRes.arrayBuffer();
  if (audioBuffer.byteLength < 1000) {
    return Response.json({ error: 'Audio invalide' }, { status: 502 });
  }

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
    const txt = await whisperRes.text();
    return Response.json({ error: `Groq Whisper ${whisperRes.status}: ${txt.slice(0, 300)}` }, { status: 502 });
  }

  const data = (await whisperRes.json()) as {
    text?: string; language?: string;
    segments?: Array<{ start: number; end: number; text: string }>;
  };

  const segments: Segment[] = (data.segments || []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  return Response.json({
    text: (data.text || '').trim(),
    language: data.language || 'auto',
    segments,
  });
};
