// Netlify Function v2 – proxies requests to Sunnah.com API
// The SUNNAH_API_KEY env variable must be set in Netlify dashboard

import type { Context } from "@netlify/functions";

const SUNNAH_API_BASE = "https://api.sunnah.com/v1";

export default async (req: Request, _context: Context) => {
  const apiKey = Netlify.env.get("SUNNAH_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "SUNNAH_API_KEY not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";
  // Forward remaining query params (strip our custom "path" param)
  const forwardParams = new URLSearchParams(url.searchParams);
  forwardParams.delete("path");

  const target = `${SUNNAH_API_BASE}${path}${forwardParams.toString() ? "?" + forwardParams.toString() : ""}`;

  try {
    const upstream = await fetch(target, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to reach Sunnah.com API" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
};
