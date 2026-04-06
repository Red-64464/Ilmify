// Netlify Function v2 – fetches YouTube video transcript (bypasses CORS)
// Method 1: HTML scraping for captions
// Method 2: Groq Whisper audio transcription fallback
import type { Context } from "@netlify/functions";

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

interface CaptionEvent {
  segs?: Array<{ utf8: string }>;
}

interface AdaptiveFormat {
  itag: number;
  url?: string;
  signatureCipher?: string;
  mimeType: string;
  bitrate?: number;
  contentLength?: string;
  audioQuality?: string;
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

/** Try to get audio URL from streaming data or innertube API (best-effort on Netlify) */
async function getAudioUrl(videoId: string, playerResponse?: Record<string, unknown>): Promise<{ url: string; title: string; mimeType: string; ext: string } | null> {
  // Approach A: Use streaming data from page (direct URLs only)
  if (playerResponse) {
    const streamingData = playerResponse.streamingData as Record<string, unknown> | undefined;
    const adaptiveFormats = (streamingData?.adaptiveFormats as AdaptiveFormat[] | undefined) ?? [];
    const audioFormats = adaptiveFormats.filter(f => f.mimeType?.startsWith("audio/") && f.url);
    if (audioFormats.length > 0) {
      audioFormats.sort((a, b) => parseInt(a.contentLength || "999999999") - parseInt(b.contentLength || "999999999"));
      const chosen = audioFormats[0];
      const mime = chosen.mimeType.split(";")[0].trim();
      const title = ((playerResponse.videoDetails as Record<string, unknown>)?.title as string) || "";
      console.log(`[whisper] Found direct audio URL from page (itag=${chosen.itag})`);
      return { url: chosen.url!, title, mimeType: mime, ext: mime === "audio/webm" ? "webm" : "mp4" };
    }
  }

  // Approach B: Cobalt.tools (if configured via env variable)
  const cobaltUrl = process.env.COBALT_API_URL;
  if (cobaltUrl) {
    try {
      console.log(`[whisper] Trying cobalt.tools at ${cobaltUrl}`);
      const res = await fetch(cobaltUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, downloadMode: "audio", audioFormat: "mp3", audioBitrate: "96" }),
      });
      if (res.ok) {
        const data = await res.json() as { status?: string; url?: string };
        if (data.url) {
          console.log("[whisper] Got audio URL from cobalt.tools");
          return { url: data.url, title: "", mimeType: "audio/mpeg", ext: "mp3" };
        }
      }
    } catch {
      console.log("[whisper] Cobalt.tools failed");
    }
  }

  return null;
}

/** Transcribe audio via Groq Whisper */
async function fetchViaWhisper(videoId: string, playerResponse?: Record<string, unknown>): Promise<{ transcript: string; title: string; language: string } | null> {
  const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!GROQ_KEY) return null;

  try {
    const audioInfo = await getAudioUrl(videoId, playerResponse);
    if (!audioInfo) return null;

    console.log("[whisper] Downloading audio...");
    const MAX = 20 * 1024 * 1024;
    const audioRes = await fetch(audioInfo.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Range": `bytes=0-${MAX - 1}`,
      },
    });
    if (!audioRes.ok && audioRes.status !== 206) return null;
    const audioBuffer = await audioRes.arrayBuffer();
    if (audioBuffer.byteLength < 1000) return null;

    console.log(`[whisper] Audio: ${(audioBuffer.byteLength / 1024 / 1024).toFixed(1)}MB`);
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: audioInfo.mimeType }), `audio.${audioInfo.ext}`);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "verbose_json");

    const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}` },
      body: formData,
    });
    if (!whisperRes.ok) {
      console.error(`[whisper] Groq error ${whisperRes.status}:`, (await whisperRes.text()).slice(0, 200));
      return null;
    }

    const data = await whisperRes.json() as { text?: string; language?: string };
    const transcript = data.text?.trim();
    if (!transcript || transcript.length < 50) return null;

    console.log(`[whisper] ✓ ${transcript.length} chars`);
    return { transcript, title: audioInfo.title, language: data.language || "auto" };
  } catch (err) {
    console.error("[whisper] Error:", err);
    return null;
  }
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

    // Method 1: Try captions
    if (captionTracks && captionTracks.length > 0) {
      const preferredLangs = ["fr", "ar", "en"];
      let selectedTrack = captionTracks[0];
      for (const lang of preferredLangs) {
        const found = captionTracks.find((t) => t.languageCode?.startsWith(lang));
        if (found) { selectedTrack = found; break; }
      }

      const baseUrl = selectedTrack.baseUrl;
      if (baseUrl) {
        const captionRes = await fetch(`${baseUrl}&fmt=json3`);
        if (captionRes.ok) {
          const captionData = await captionRes.json() as { events?: CaptionEvent[] };
          const events = captionData.events ?? [];
          const transcript = events
            .filter((e) => e.segs && e.segs.length > 0)
            .map((e) => e.segs!.map((s) => s.utf8).join(""))
            .filter((t) => t.trim() && t !== "\n")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          if (transcript) {
            return new Response(
              JSON.stringify({ transcript, title, language: selectedTrack.languageCode, characterCount: transcript.length, method: "scraping" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    // Method 2: Whisper fallback
    console.log(`[transcript] No captions for ${videoId}, trying Whisper...`);
    const whisperResult = await fetchViaWhisper(videoId, playerResponse);
    if (whisperResult && whisperResult.transcript.length > 0) {
      return new Response(
        JSON.stringify({
          transcript: whisperResult.transcript,
          title: whisperResult.title || title,
          language: whisperResult.language,
          characterCount: whisperResult.transcript.length,
          method: "whisper",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Aucune transcription disponible pour cette vidéo" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
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
