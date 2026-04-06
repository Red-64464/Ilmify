// Next.js Route Handler — fetches YouTube video transcript server-side
// In production, the Netlify Function `youtube-transcript` handles this.

import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const videoId = req.nextUrl.searchParams.get('videoId');

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Identifiant vidéo invalide' }, { status: 400 });
  }

  try {
    // Fetch transcript — tries fr, ar, en automatically
    let transcriptItems: { text: string }[] = [];
    const langs = ['fr', 'ar', 'en'];
    let succeeded = false;

    for (const lang of langs) {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        succeeded = true;
        break;
      } catch {
        // try next language
      }
    }

    if (!succeeded || transcriptItems.length === 0) {
      // Last attempt: no language filter (auto-generated)
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      } catch {
        return NextResponse.json(
          { error: 'Aucune transcription disponible pour cette vidéo (transcriptions désactivées par la chaîne)' },
          { status: 404 },
        );
      }
    }

    if (transcriptItems.length === 0) {
      return NextResponse.json({ error: 'Transcription vide' }, { status: 404 });
    }

    const transcript = transcriptItems
      .map((item) => item.text.replace(/\n/g, ' '))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return NextResponse.json({ transcript, characterCount: transcript.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Erreur: ${message}` }, { status: 500 });
  }
}

