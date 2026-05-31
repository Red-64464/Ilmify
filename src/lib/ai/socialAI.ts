/**
 * AI helpers dedicated to Social Post feature.
 * - translateSegments: translate transcript segments preserving timing
 * - analyzeSocialPost: summary, citations, key points, dubious flags
 */
import type { TranscriptSegment, IslamicCitation, KeyPoint, DubiousFlag } from '@/types';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SOCIAL_SYSTEM = `Tu es un assistant pédagogique pour Ilmify, une application d'apprentissage islamique.
RÈGLES :
- Travaille UNIQUEMENT à partir du texte fourni.
- N'invente JAMAIS de hadith / verset / avis juridique.
- Si le texte est insuffisant, dis-le clairement.
- Réponds en français.
- Quand on te demande du JSON, réponds UNIQUEMENT avec du JSON valide.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Appel Groq avec retry automatique sur 429.
 * Lit le délai exact depuis le message d'erreur ("try again in X.XXXs").
 */
async function callGroq(
  messages: ChatMsg[],
  json = false,
  maxTokens = 2048,
  model = DEFAULT_MODEL,
  maxRetries = 4,
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.4,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: 'json_object' };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'groq', ...body }),
    });

    if (res.status === 429) {
      if (attempt === maxRetries) {
        const txt = await res.text();
        throw new Error(`Groq ${res.status}: ${txt.slice(0, 300)}`);
      }
      // Lire le délai exact depuis le corps JSON Groq ("try again in X.XXXs")
      let waitMs = (attempt + 1) * 5000;
      try {
        const errJson = await res.clone().json() as { error?: { message?: string } };
        const m = errJson.error?.message?.match(/try again in ([\d.]+)s/);
        if (m) waitMs = Math.ceil(parseFloat(m[1]) * 1000) + 300;
      } catch { /* ignore */ }
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Groq ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
  }
  throw new Error('Groq: nombre maximal de tentatives atteint');
}

function extractJson(s: string): string {
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) return s.slice(start, end + 1);
  return s;
}

/** Traduit une liste de segments en conservant les indices — via appel JSON batch */
export async function translateSegments(
  segments: TranscriptSegment[],
  targetLanguage: 'fr' | 'en' | 'ar',
  sourceLanguage?: string,
): Promise<TranscriptSegment[]> {
  if (segments.length === 0) return [];

  // Batches petits pour rester sous la limite TPM du free tier Groq (12k/min)
  const BATCH_SIZE = 15;
  const batches: TranscriptSegment[][] = [];
  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    batches.push(segments.slice(i, i + BATCH_SIZE));
  }

  const targetLabel = targetLanguage === 'fr' ? 'français'
    : targetLanguage === 'ar' ? 'arabe (avec diacritiques si approprié)'
    : 'anglais';

  const translated: TranscriptSegment[] = [];

  for (const batch of batches) {
    const payload = batch.map((s, i) => ({ i, text: s.text }));
    const prompt = `Traduis en ${targetLabel} chacun des textes ci-dessous.
Contexte : contenu islamique (dawah, cours, rappels). Préserve les termes techniques (صلاة → "prière", فقه → "fiqh", etc.) en gardant le sens islamique correct.
${sourceLanguage ? `Langue source : ${sourceLanguage}.` : ''}

Réponds UNIQUEMENT avec un JSON de la forme :
{ "items": [ { "i": 0, "text": "..." }, { "i": 1, "text": "..." } ] }

Segments à traduire :
${JSON.stringify(payload)}`;

    const raw = await callGroq(
      [{ role: 'system', content: SOCIAL_SYSTEM }, { role: 'user', content: prompt }],
      true,
      4000,
    );

    let parsed: { items?: Array<{ i: number; text: string }> };
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      // fallback : utilise le texte original
      batch.forEach((s) => translated.push(s));
      continue;
    }

    const byIdx = new Map((parsed.items || []).map((x) => [x.i, x.text]));
    batch.forEach((s, i) => {
      const t = byIdx.get(i) ?? s.text;
      translated.push({ start: s.start, end: s.end, text: t });
    });
  }

  return translated;
}

export interface SocialAnalysisPayload {
  summary: string;
  keyPoints: KeyPoint[];
  citations: IslamicCitation[];
  topics: Array<{ tag: string; description?: string }>;
  dubiousFlags: DubiousFlag[];
  languageDetected?: string;
}

/** Analyse un post social : résumé, points clés, citations, flags */
export async function analyzeSocialPost(
  transcript: string,
  options: { caption?: string; author?: string; platform?: string } = {},
): Promise<SocialAnalysisPayload> {
  // Tronque si trop long
  const MAX = 10000;
  const txt = transcript.length > MAX
    ? transcript.slice(0, MAX / 2) + '\n[...]\n' + transcript.slice(-MAX / 2)
    : transcript;

  const prompt = `Analyse cette vidéo issue de ${options.platform || 'réseaux sociaux'}${options.author ? ` publiée par ${options.author}` : ''}.
${options.caption ? `Légende : ${options.caption}\n` : ''}

TRANSCRIPTION :
"""
${txt}
"""

Réponds UNIQUEMENT avec un JSON de cette forme exacte :
{
  "summary": "3-5 lignes résumant l'essentiel en français, avec des emojis",
  "keyPoints": [ { "title": "...", "detail": "..." }, ... (3 à 6 points) ],
  "citations": [
    { "type": "verse" | "hadith" | "scholar" | "dua",
      "reference": "ex. Sourate 2, v. 255 / Sahih Bukhari 1",
      "text": "traduction ou citation française",
      "arabic": "texte arabe si présent dans la transcription" }
  ],
  "topics": [ { "tag": "tazkiya", "description": "..." } ],
  "dubiousFlags": [
    { "reason": "ce qui est problématique", "severity": "info"|"warning"|"danger", "quote": "extrait exact" }
  ],
  "languageDetected": "fr"|"ar"|"en"|..."
}

RÈGLES :
- citations : SEULEMENT celles explicitement mentionnées dans la transcription. Sinon, tableau vide.
- dubiousFlags : SEULEMENT si le discours contredit clairement des sources islamiques de référence ou contient un jugement hâtif. Sinon, tableau vide. Cite TOUJOURS l'extrait.
- topics : mots-clés en kebab-case (ex: "tazkiya", "fiqh-prière", "histoire-islamique").`;

  const raw = await callGroq(
    [{ role: 'system', content: SOCIAL_SYSTEM }, { role: 'user', content: prompt }],
    true,
    4000,
  );

  let parsed: SocialAnalysisPayload;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (err) {
    throw new Error(`Analyse IA : JSON invalide — ${err instanceof Error ? err.message : err}`);
  }

  return {
    summary: parsed.summary || '',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    dubiousFlags: Array.isArray(parsed.dubiousFlags) ? parsed.dubiousFlags : [],
    languageDetected: parsed.languageDetected,
  };
}
