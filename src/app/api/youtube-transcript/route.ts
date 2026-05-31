// Next.js Route Handler — fetches YouTube video transcript server-side
// Method 1: youtube-transcript npm lib (fast, but can fail on some videos)
// Method 2: Direct YouTube HTML scraping (reliable fallback)
// Method 3: Groq Whisper audio transcription (last resort — for videos without captions)
// In production, the Netlify Function `youtube-transcript` handles this directly.

import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

// ── Types ──
interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

interface CaptionEvent {
  segs?: Array<{ utf8: string }>;
}

interface YouTubePageData {
  title: string;
  playerResponse: Record<string, unknown>;
  captionTracks: CaptionTrack[];
}

// ── Method 1: youtube-transcript npm lib ──
async function fetchViaLib(videoId: string): Promise<string | null> {
  const langs = ['fr', 'ar', 'en'];

  for (const lang of langs) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      if (items.length > 0) {
        return items.map((item) => item.text.replace(/\n/g, ' ')).join(' ').replace(/\s+/g, ' ').trim();
      }
    } catch {
      // try next language
    }
  }

  // Last attempt: no language filter (auto-generated)
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (items.length > 0) {
      return items.map((item) => item.text.replace(/\n/g, ' ')).join(' ').replace(/\s+/g, ' ').trim();
    }
  } catch {
    // fall through
  }

  return null;
}

// ── Shared: Parse YouTube page HTML ──
function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const markers = ['ytInitialPlayerResponse = ', 'ytInitialPlayerResponse='];

  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx === -1) continue;

    const start = idx + marker.length;
    if (html[start] !== '{') continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < Math.min(html.length, start + 2_000_000); i++) {
      const ch = html[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\' && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(start, i + 1)) as Record<string, unknown>;
          } catch {
            break;
          }
        }
      }
    }
  }

  return null;
}

// ── Shared: Fetch and parse YouTube page (used by Method 2 and 3) ──
async function fetchYoutubePageData(videoId: string): Promise<YouTubePageData | null> {
  try {
    const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!ytRes.ok) return null;

    const html = await ytRes.text();
    const playerResponse = extractPlayerResponse(html);
    if (!playerResponse) return null;

    const videoDetails = (playerResponse.videoDetails as Record<string, unknown>) ?? {};
    const title = (videoDetails.title as string) || '';

    // Extract caption tracks
    const captions = playerResponse.captions as Record<string, unknown> | undefined;
    const tracklistRenderer = captions?.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
    const captionTracks = (tracklistRenderer?.captionTracks as CaptionTrack[] | undefined) ?? [];

    return { title, playerResponse, captionTracks };
  } catch {
    return null;
  }
}

// ── Method 2: Extract captions from page data ──
async function extractCaptionsFromPage(pageData: YouTubePageData): Promise<{ transcript: string; title: string; language: string } | null> {
  const { captionTracks, title } = pageData;
  if (captionTracks.length === 0) return null;

  const preferredLangs = ['fr', 'ar', 'en'];
  let selectedTrack = captionTracks[0];
  for (const lang of preferredLangs) {
    const found = captionTracks.find((t) => t.languageCode?.startsWith(lang));
    if (found) { selectedTrack = found; break; }
  }

  const baseUrl = selectedTrack.baseUrl;
  if (!baseUrl) return null;

  try {
    const captionRes = await fetch(`${baseUrl}&fmt=json3`);
    if (!captionRes.ok) return null;

    const captionData = await captionRes.json() as { events?: CaptionEvent[] };
    const events = captionData.events ?? [];

    const transcript = events
      .filter((e) => e.segs && e.segs.length > 0)
      .map((e) => e.segs!.map((s) => s.utf8).join(''))
      .filter((t) => t.trim() && t !== '\n')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!transcript) return null;

    return { transcript, title, language: selectedTrack.languageCode };
  } catch {
    return null;
  }
}

// ── Method 3: Audio transcription via Groq Whisper ──
async function getAudioUrl(videoId: string): Promise<{ url: string; title: string; mimeType: string; ext: string } | null> {
  try {
    // Use youtube-dl-exec (yt-dlp) — handles all YouTube cipher/signature deobfuscation
    const youtubedl = (await import('youtube-dl-exec')).default;
    const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
    }) as Record<string, unknown>;

    const title = (info.title as string) || '';
    const formats = (info.formats as Array<Record<string, unknown>>) || [];

    // Filter audio-only formats and sort by file size (smallest = fastest)
    const audioFormats = formats
      .filter((f) => f.vcodec === 'none' && f.acodec !== 'none' && f.url)
      .sort((a, b) => ((a.filesize as number) || Infinity) - ((b.filesize as number) || Infinity));

    if (audioFormats.length === 0) return null;

    const chosen = audioFormats[0];
    const ext = (chosen.ext as string) || 'mp4';
    const mime = ext === 'webm' ? 'audio/webm' : ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';

    return { url: chosen.url as string, title, mimeType: mime, ext };
  } catch (err) {
    console.error('[whisper] yt-dlp error:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function fetchViaWhisper(videoId: string): Promise<{ transcript: string; title: string; language: string } | null> {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return null;

  try {
    // Step 1: Get audio URL via yt-dlp
    const audioInfo = await getAudioUrl(videoId);
    if (!audioInfo) return null;

    // Step 2: Download audio (max 20MB — Groq limit is 25MB, keep margin)
    const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
    const audioController = new AbortController();
    const audioTimeout = setTimeout(() => audioController.abort(), 90000);

    const audioRes = await fetch(audioInfo.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Range': `bytes=0-${MAX_AUDIO_BYTES - 1}`,
      },
      signal: audioController.signal,
    });
    clearTimeout(audioTimeout);

    if (!audioRes.ok && audioRes.status !== 206) return null;

    const audioBuffer = await audioRes.arrayBuffer();
    if (audioBuffer.byteLength < 1000) return null;

    // Step 3: Send to Groq Whisper
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: audioInfo.mimeType }), `audio.${audioInfo.ext}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');

    const whisperController = new AbortController();
    const whisperTimeout = setTimeout(() => whisperController.abort(), 120000);

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}` },
      body: formData,
      signal: whisperController.signal,
    });
    clearTimeout(whisperTimeout);

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      console.error(`[whisper] Groq Whisper error ${whisperRes.status}: ${errText.slice(0, 300)}`);
      return null;
    }

    const whisperData = await whisperRes.json() as { text?: string; language?: string };
    const transcript = whisperData.text?.trim();

    if (!transcript || transcript.length < 50) return null;

    return {
      transcript,
      title: audioInfo.title,
      language: whisperData.language || 'auto',
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[whisper] Timed out');
    } else {
      console.error('[whisper] Error:', err);
    }
    return null;
  }
}

// ── Route handler ──
const TRANSCRIPT_CACHE_HEADERS = { 'Cache-Control': 'private, max-age=3600, stale-while-revalidate=7200' };

export async function GET(req: NextRequest): Promise<NextResponse> {
  const videoId = req.nextUrl.searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Identifiant vidéo invalide' }, { status: 400 });
  }

  try {
    // Method 1: Try npm lib first (fastest)
    const libResult = await fetchViaLib(videoId);
    if (libResult && libResult.length > 0) {
      return NextResponse.json(
        { transcript: libResult, characterCount: libResult.length, method: 'lib' },
        { headers: TRANSCRIPT_CACHE_HEADERS },
      );
    }

    const pageData = await fetchYoutubePageData(videoId);

    if (pageData) {
      const captionResult = await extractCaptionsFromPage(pageData);
      if (captionResult && captionResult.transcript.length > 0) {
        return NextResponse.json({
          transcript: captionResult.transcript,
          title: captionResult.title,
          language: captionResult.language,
          characterCount: captionResult.transcript.length,
          method: 'scraping',
        }, { headers: TRANSCRIPT_CACHE_HEADERS });
      }
    }

    // Method 3: Audio transcription via Groq Whisper (last resort)
    const whisperResult = await fetchViaWhisper(videoId);
    if (whisperResult && whisperResult.transcript.length > 0) {
      return NextResponse.json({
        transcript: whisperResult.transcript,
        title: whisperResult.title,
        language: whisperResult.language,
        characterCount: whisperResult.transcript.length,
        method: 'whisper',
      }, { headers: TRANSCRIPT_CACHE_HEADERS });
    }

    return NextResponse.json(
      { error: 'Aucune transcription disponible pour cette vidéo (aucune méthode n\'a fonctionné)' },
      { status: 404 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Erreur: ${message}` }, { status: 500 });
  }
}

