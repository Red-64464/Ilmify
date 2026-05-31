// Fetches YouTube playlist info via Piped API (no API key required)
import { NextRequest, NextResponse } from 'next/server';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped-api.privacy.com.de',
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
  }

  // Extract playlist ID from URL
  const listMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (!listMatch) {
    return NextResponse.json({ error: 'URL de playlist YouTube invalide (paramètre list manquant)' }, { status: 400 });
  }
  const playlistId = listMatch[1];

  // Try each Piped instance
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/playlists/${playlistId}`, {
        headers: { 'User-Agent': 'Ilmify/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;

      const data = await res.json() as {
        name?: string;
        relatedStreams?: {
          url?: string;
          title?: string;
          uploaderName?: string;
          thumbnail?: string;
        }[];
      };

      if (!data.relatedStreams || data.relatedStreams.length === 0) {
        return NextResponse.json({ error: 'Playlist vide ou inaccessible' }, { status: 404 });
      }

      const videos = data.relatedStreams
        .filter(s => s.url && s.title)
        .map(s => {
          // Piped URLs look like /watch?v=VIDEO_ID
          const idMatch = s.url!.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
          const videoId = idMatch ? idMatch[1] : null;
          return {
            id: videoId,
            url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : s.url!,
            title: s.title!,
            channelName: s.uploaderName || '',
            thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : (s.thumbnail || ''),
          };
        })
        .filter(v => v.id);

      return NextResponse.json(
        { playlistTitle: data.name || 'Playlist YouTube', videos },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
      );
    } catch {
      // Try next instance
    }
  }

  return NextResponse.json(
    { error: 'Impossible de récupérer la playlist (toutes les sources sont indisponibles)' },
    { status: 503 },
  );
}
