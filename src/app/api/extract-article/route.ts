// Fetches a web article URL, extracts readable text, and returns it for AI analysis
import { NextRequest, NextResponse } from 'next/server';
import { safeFetch, SsrfError } from '@/lib/security/ssrf';

export const runtime = 'nodejs';

// Naive HTML-to-text extractor (no external dependency)
function htmlToText(html: string): string {
  return html
    // Remove <script> and <style> blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    // Add newlines around block elements
    .replace(/<\/?(?:p|div|section|article|aside|header|footer|h\d|li|tr|blockquote|pre)[^>]*>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Extract <title> from HTML
function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

// Extract <meta name="description"> or og:title
function extractMeta(html: string): { description?: string; ogTitle?: string } {
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  return {
    description: descMatch?.[1],
    ogTitle: ogMatch?.[1],
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
  }

  try {
    // SSRF-safe fetch: rejects internal/private hosts and re-validates every redirect hop.
    const res = await safeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ilmify/1.0; +https://ilmify.app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr,ar,en',
      },
      timeoutMs: 10000,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Impossible de récupérer la page (${res.status})` },
        { status: 502 },
      );
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('html')) {
      return NextResponse.json(
        { error: 'Le contenu n\'est pas une page HTML' },
        { status: 415 },
      );
    }

    const html = await res.text();
    const title = extractTitle(html);
    const meta = extractMeta(html);
    const text = htmlToText(html);

    if (text.length < 200) {
      return NextResponse.json(
        { error: 'Contenu trop court ou inaccessible (la page est peut-être protégée)' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      title: meta.ogTitle || title || '',
      text: text.slice(0, 30000), // Limit to 30k chars
      characterCount: text.length,
    });
  } catch (err) {
    if (err instanceof SsrfError) {
      return NextResponse.json({ error: `URL refusée : ${err.message}` }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json({ error: 'Délai d\'attente dépassé pour cette URL' }, { status: 408 });
    }
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'article' }, { status: 500 });
  }
}
