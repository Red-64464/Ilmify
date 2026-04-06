// Next.js Route Handler — fetches YouTube video transcript server-side
// Method 1: youtube-transcript npm lib (fast, but can fail on some videos)
// Method 2: Direct YouTube HTML scraping (same technique as Netlify function — reliable fallback)
// In production, the Netlify Function `youtube-transcript` handles this directly.

import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

// ── Types for direct scraping ──
interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

interface CaptionEvent {
  segs?: Array<{ utf8: string }>;
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

// ── Method 2: Direct YouTube HTML scraping (same as Netlify function) ──
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

async function fetchViaScraping(videoId: string): Promise<{ transcript: string; title: string; language: string } | null> {
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

    const captions = playerResponse.captions as Record<string, unknown> | undefined;
    const tracklistRenderer = captions?.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
    const captionTracks = tracklistRenderer?.captionTracks as CaptionTrack[] | undefined;

    if (!captionTracks || captionTracks.length === 0) return null;

    // Pick best language: fr > ar > en > first available
    const preferredLangs = ['fr', 'ar', 'en'];
    let selectedTrack = captionTracks[0];
    for (const lang of preferredLangs) {
      const found = captionTracks.find((t) => t.languageCode?.startsWith(lang));
      if (found) { selectedTrack = found; break; }
    }

    const baseUrl = selectedTrack.baseUrl;
    if (!baseUrl) return null;

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

// ── Route handler ──
export async function GET(req: NextRequest): Promise<NextResponse> {
  const videoId = req.nextUrl.searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Identifiant vidéo invalide' }, { status: 400 });
  }

  try {
    // Method 1: Try npm lib first (faster)
    const libResult = await fetchViaLib(videoId);
    if (libResult && libResult.length > 0) {
      return NextResponse.json({ transcript: libResult, characterCount: libResult.length });
    }

    // Method 2: Fallback to direct YouTube scraping (more reliable)
    console.log(`[transcript] Lib failed for ${videoId}, trying direct scraping...`);
    const scrapingResult = await fetchViaScraping(videoId);
    if (scrapingResult && scrapingResult.transcript.length > 0) {
      return NextResponse.json({
        transcript: scrapingResult.transcript,
        title: scrapingResult.title,
        language: scrapingResult.language,
        characterCount: scrapingResult.transcript.length,
      });
    }

    return NextResponse.json(
      { error: 'Aucune transcription disponible pour cette vidéo' },
      { status: 404 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Erreur: ${message}` }, { status: 500 });
  }
}

