// Netlify Function v2 – fetches YouTube video transcript (bypasses CORS)
import type { Context } from "@netlify/functions";

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

interface CaptionEvent {
  segs?: Array<{ utf8: string }>;
}

/** Extract ytInitialPlayerResponse JSON from YouTube HTML page */
function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const markers = ["ytInitialPlayerResponse = ", "ytInitialPlayerResponse="];

  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx === -1) continue;

    const start = idx + marker.length;
    if (html[start] !== "{") continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < Math.min(html.length, start + 2_000_000); i++) {
      const ch = html[i];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\" && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
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

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const videoId = url.searchParams.get("videoId");

  // Validate videoId format (11 alphanumeric chars)
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return new Response(
      JSON.stringify({ error: "Identifiant vidéo invalide" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Fetch YouTube watch page
    const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!ytRes.ok) {
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer la page YouTube" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const html = await ytRes.text();

    // Extract player response
    const playerResponse = extractPlayerResponse(html);
    if (!playerResponse) {
      return new Response(
        JSON.stringify({ error: "Impossible d'extraire les données de la vidéo" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get video title from videoDetails
    const videoDetails = (playerResponse.videoDetails as Record<string, unknown>) ?? {};
    const title = (videoDetails.title as string) || "";

    // Navigate to caption tracks
    const captions = playerResponse.captions as Record<string, unknown> | undefined;
    const tracklistRenderer = captions?.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
    const captionTracks = tracklistRenderer?.captionTracks as CaptionTrack[] | undefined;

    if (!captionTracks || captionTracks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune transcription disponible pour cette vidéo" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pick best language: fr > ar > en > first available
    const preferredLangs = ["fr", "ar", "en"];
    let selectedTrack = captionTracks[0];
    for (const lang of preferredLangs) {
      const found = captionTracks.find((t) => t.languageCode?.startsWith(lang));
      if (found) { selectedTrack = found; break; }
    }

    const baseUrl = selectedTrack.baseUrl;
    if (!baseUrl) {
      return new Response(
        JSON.stringify({ error: "URL de transcription introuvable" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch captions in JSON format
    const captionRes = await fetch(`${baseUrl}&fmt=json3`);
    if (!captionRes.ok) {
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer la transcription" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const captionData = await captionRes.json() as { events?: CaptionEvent[] };
    const events = captionData.events ?? [];

    // Build plain text transcript
    const transcript = events
      .filter((e) => e.segs && e.segs.length > 0)
      .map((e) => e.segs!.map((s) => s.utf8).join(""))
      .filter((t) => t.trim() && t !== "\n")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "La transcription est vide pour cette vidéo" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        transcript,
        title,
        language: selectedTrack.languageCode,
        characterCount: transcript.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: `Erreur interne: ${err instanceof Error ? err.message : "Erreur inconnue"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
