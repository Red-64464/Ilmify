#!/usr/bin/env node
/**
 * Test complet du pipeline YouTube Transcript + AI Analysis
 * Usage: node tests/test-youtube-ai.mjs
 *
 * Ce script teste :
 *  1. La récupération de transcriptions YouTube (API locale)
 *  2. L'analyse IA Stage 1 (résumé + synthèse + points clés)
 *  3. L'analyse IA Stage 2 (blocs + chapitres + quiz)
 *  4. La robustesse JSON
 *  5. Les cas limites
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ── Config ──────────────────────────────────────────────────────────────────
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const OPENROUTER_PRIMARY_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const OPENROUTER_FALLBACK_MODEL = 'minimax/minimax-m2.5:free';

const DEV_TRANSCRIPT_URL = 'http://localhost:3000/api/youtube-transcript';

// ── Palette de vidéos de test ───────────────────────────────────────────────
const TEST_VIDEOS = [
  // Vidéos courtes (<10 min)
  { id: 'dQw4w9WgXcQ', label: 'Vidéo populaire EN (Rick Astley)', lang: 'en', expectTranscript: true },
  { id: 'LXb3EKWsInQ', label: 'Vidéo sans sous-titres (CNES)', lang: 'fr', expectTranscript: false },

  // Vidéos islamiques FR (cas d'usage principal)
  { id: '5MgBikgcWnY', label: 'Conférence islamique FR', lang: 'fr', expectTranscript: true },

  // Vidéos en arabe
  { id: 'BxV14h0kFs0', label: 'Vidéo AR (Quran)', lang: 'ar', expectTranscript: true },

  // Vidéos longues (>30 min)
  { id: 'dQw4w9WgXcQ', label: 'Longue vidéo test (réutilisée)', lang: 'en', expectTranscript: true },

  // Cas edge: vidéo privée / supprimée / inexistante
  { id: 'xxxxxxxxxxx', label: 'ID inexistant', lang: 'fr', expectTranscript: false },
  { id: 'invalidid', label: 'ID invalide (trop court)', lang: 'fr', expectTranscript: false },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function log(icon, msg) { console.log(`  ${icon} ${msg}`); }
function pass(msg) { log(`${COLORS.green}✅${COLORS.reset}`, msg); }
function fail(msg) { log(`${COLORS.red}❌${COLORS.reset}`, msg); }
function warn(msg) { log(`${COLORS.yellow}⚠️${COLORS.reset}`, msg); }
function info(msg) { log(`${COLORS.cyan}ℹ️${COLORS.reset}`, msg); }
function section(title) {
  console.log(`\n${COLORS.bold}${COLORS.cyan}═══ ${title} ═══${COLORS.reset}`);
}

const results = { passed: 0, failed: 0, warnings: 0, skipped: 0 };

function recordPass(msg) { results.passed++; pass(msg); }
function recordFail(msg) { results.failed++; fail(msg); }
function recordWarn(msg) { results.warnings++; warn(msg); }

function extractJsonFromText(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

function truncateContent(text, maxLen = 6000) {
  if (text.length <= maxLen) return text;
  const half = Math.floor(maxLen / 2) - 30;
  return text.slice(0, half) + '\n\n[... contenu tronqué ...]\n\n' + text.slice(-half);
}

function sampleTranscript(text, maxLen) {
  if (text.length <= maxLen) return text;
  const third = Math.floor(maxLen / 3) - 30;
  const midPos = Math.floor(text.length / 2);
  return text.slice(0, third) +
    '\n\n[... milieu ...]\n\n' +
    text.slice(midPos - Math.floor(third / 2), midPos + Math.ceil(third / 2)) +
    '\n\n[... fin ...]\n\n' +
    text.slice(text.length - third);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── API Callers ─────────────────────────────────────────────────────────────
async function callGroqRaw(messages, json = false, model = 'llama-3.3-70b-versatile', maxTokens = 2048) {
  const body = { model, messages, temperature: 0.7, max_tokens: maxTokens };
  if (json) body.response_format = { type: 'json_object' };

  const start = Date.now();
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const elapsed = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, error: errText.slice(0, 300), elapsed };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { ok: true, content, elapsed, model, usage: data.usage };
}

async function callOpenRouterRaw(messages, json = false, model = OPENROUTER_PRIMARY_MODEL, maxTokens = 8000) {
  const body = { model, messages, temperature: 0.7, max_tokens: maxTokens };
  if (json) body.response_format = { type: 'json_object' };

  const start = Date.now();
  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ilmify.app',
      'X-Title': 'Ilmify',
    },
    body: JSON.stringify(body),
  });
  const elapsed = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, error: errText.slice(0, 300), elapsed };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { ok: true, content, elapsed, model, usage: data.usage };
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 1: Transcript Fetching
// ════════════════════════════════════════════════════════════════════════════
async function testTranscripts() {
  section('TEST 1: Récupération des transcriptions YouTube (API locale)');

  let serverUp = false;
  try {
    const probe = await fetch(`${DEV_TRANSCRIPT_URL}?videoId=dQw4w9WgXcQ`, { signal: AbortSignal.timeout(5000) });
    serverUp = true;
  } catch {
    warn('Serveur Next.js non disponible — skip tests transcript API locale');
    info('Lance "npm run dev" puis relance le test');
    results.skipped += TEST_VIDEOS.length;
    return {};
  }

  const transcripts = {};

  for (const v of TEST_VIDEOS) {
    const testName = `[${v.id}] ${v.label}`;
    try {
      const start = Date.now();
      const res = await fetch(`${DEV_TRANSCRIPT_URL}?videoId=${v.id}`, { signal: AbortSignal.timeout(15000) });
      const elapsed = Date.now() - start;
      const data = await res.json();

      if (v.expectTranscript) {
        if (res.ok && data.transcript) {
          recordPass(`${testName} — ${data.transcript.length} chars en ${elapsed}ms`);
          transcripts[v.id] = { transcript: data.transcript, title: v.label, channel: 'Test' };
        } else {
          recordFail(`${testName} — attendu OK, reçu status=${res.status}, error="${data.error || 'pas de transcript'}"`);
        }
      } else {
        if (!res.ok) {
          recordPass(`${testName} — erreur attendue, status=${res.status}`);
        } else {
          recordWarn(`${testName} — devrait échouer mais a retourné une transcription !`);
        }
      }
    } catch (err) {
      if (v.expectTranscript) {
        recordFail(`${testName} — exception: ${err.message}`);
      } else {
        recordPass(`${testName} — erreur attendue (timeout/exception)`);
      }
    }

    // Petit délai entre requêtes pour éviter les rate limits YouTube
    await sleep(1500);
  }

  return transcripts;
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 2: Groq API availability + models
// ════════════════════════════════════════════════════════════════════════════
async function testGroqModels() {
  section('TEST 2: Disponibilité des modèles Groq');

  if (!GROQ_API_KEY) {
    recordFail('NEXT_PUBLIC_GROQ_API_KEY non configurée');
    return;
  }
  recordPass('Clé Groq présente');

  const models = [
    { name: 'llama-3.3-70b-versatile', usage: 'Stage 1 (résumé, synthèse)' },
    { name: 'llama-3.1-8b-instant', usage: 'Stage 2 (blocs, quiz)' },
  ];

  for (const m of models) {
    const result = await callGroqRaw(
      [{ role: 'user', content: 'Réponds juste "OK" en un mot.' }],
      false, m.name, 10,
    );
    if (result.ok) {
      recordPass(`${m.name} (${m.usage}) — ${result.elapsed}ms — réponse: "${result.content.slice(0, 50)}"`);
    } else {
      recordFail(`${m.name} (${m.usage}) — status ${result.status}: ${result.error}`);
    }
    await sleep(2000);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 3: OpenRouter API availability
// ════════════════════════════════════════════════════════════════════════════
async function testOpenRouterModels() {
  section('TEST 3: Disponibilité des modèles OpenRouter');

  if (!OPENROUTER_API_KEY) {
    recordFail('NEXT_PUBLIC_OPENROUTER_API_KEY non configurée');
    return;
  }
  recordPass('Clé OpenRouter présente');

  const models = [
    { name: OPENROUTER_PRIMARY_MODEL, usage: 'Primary (Nemotron 120B)' },
    { name: OPENROUTER_FALLBACK_MODEL, usage: 'Fallback (MiniMax M2.5)' },
  ];

  for (const m of models) {
    const result = await callOpenRouterRaw(
      [{ role: 'user', content: 'Réponds juste "OK" en un mot.' }],
      false, m.name, 10,
    );
    if (result.ok) {
      recordPass(`${m.name} (${m.usage}) — ${result.elapsed}ms`);
    } else {
      recordFail(`${m.name} (${m.usage}) — status ${result.status}: ${result.error}`);
    }
    await sleep(2000);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 4: JSON output robustness
// ════════════════════════════════════════════════════════════════════════════
async function testJsonRobustness() {
  section('TEST 4: Robustesse du JSON – Groq json_object mode');

  const SYSTEM = 'Tu es un assistant. Réponds UNIQUEMENT en JSON valide.';

  // Test simple JSON
  const simplePrompt = 'Génère un objet JSON avec les champs: "title" (string), "points" (array de 3 strings).';
  const r1 = await callGroqRaw(
    [{ role: 'system', content: SYSTEM }, { role: 'user', content: simplePrompt }],
    true, 'llama-3.3-70b-versatile', 500,
  );
  if (r1.ok) {
    try {
      const parsed = JSON.parse(r1.content);
      if (parsed.title && Array.isArray(parsed.points)) {
        recordPass(`JSON simple — parsé OK, ${Object.keys(parsed).length} champs`);
      } else {
        recordWarn(`JSON simple — parsé mais structure inattendue: ${JSON.stringify(Object.keys(parsed))}`);
      }
    } catch {
      recordFail(`JSON simple — parse error: ${r1.content.slice(0, 100)}`);
    }
  } else {
    recordFail(`JSON simple — API error: ${r1.error}`);
  }

  await sleep(3000);

  // Test complex JSON (simulating Stage 2 output)
  const complexPrompt = `Génère un JSON avec cette structure exacte:
{
  "blocks": [
    { "type": "heading1", "content": "Titre principal" },
    { "type": "paragraph", "content": "Un paragraphe." },
    { "type": "bullet-list", "content": "Point 1\\nPoint 2" },
    { "type": "callout", "content": "Info importante" }
  ],
  "chapters": [
    { "title": "Introduction", "percentStart": 0 },
    { "title": "Conclusion", "percentStart": 80 }
  ],
  "quizQuestions": [
    { "question": "Question test?", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "Car A." }
  ]
}
Remplis avec du contenu islamique fictif.`;

  const r2 = await callGroqRaw(
    [{ role: 'system', content: SYSTEM }, { role: 'user', content: complexPrompt }],
    true, 'llama-3.1-8b-instant', 2000,
  );
  if (r2.ok) {
    try {
      const parsed = JSON.parse(r2.content);
      const hasBlocks = Array.isArray(parsed.blocks) && parsed.blocks.length > 0;
      const hasChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0;
      const hasQuiz = Array.isArray(parsed.quizQuestions) && parsed.quizQuestions.length > 0;

      if (hasBlocks && hasChapters && hasQuiz) {
        recordPass(`JSON complexe (8b) — blocks:${parsed.blocks.length} chapters:${parsed.chapters.length} quiz:${parsed.quizQuestions.length}`);
      } else {
        recordWarn(`JSON complexe (8b) — structure partielle: blocks=${hasBlocks} chapters=${hasChapters} quiz=${hasQuiz}`);
      }

      // Validate block types
      const VALID_TYPES = new Set([
        'paragraph', 'heading1', 'heading2', 'heading3', 'quote', 'bullet-list',
        'numbered-list', 'callout', 'reflection', 'reminder', 'source',
        'hadith', 'verse', 'dua', 'definition', 'checklist', 'poem',
        'timeline', 'warning', 'divider',
      ]);
      const invalidTypes = (parsed.blocks || []).filter(b => !VALID_TYPES.has(b.type)).map(b => b.type);
      if (invalidTypes.length > 0) {
        recordWarn(`Types de blocs invalides générés: ${invalidTypes.join(', ')}`);
      } else if (hasBlocks) {
        recordPass(`Tous les types de blocs sont valides`);
      }

      // Validate quiz structure
      if (hasQuiz) {
        const validQuiz = parsed.quizQuestions.every(q =>
          q.question && Array.isArray(q.options) && q.options.length === 4 &&
          typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
        );
        if (validQuiz) recordPass('Structure quiz valide (4 options, correctAnswer 0-3)');
        else recordWarn('Structure quiz partiellement invalide');
      }
    } catch (e) {
      // Try extracting JSON
      const extracted = extractJsonFromText(r2.content);
      try {
        JSON.parse(extracted);
        recordWarn(`JSON complexe (8b) — parsing initial échoué mais extraction réussie`);
      } catch {
        recordFail(`JSON complexe (8b) — impossible à parser: ${r2.content.slice(0, 150)}`);
      }
    }
  } else {
    recordFail(`JSON complexe (8b) — API error: ${r2.error}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 5: Full pipeline – Transcript → AI Analysis
// ════════════════════════════════════════════════════════════════════════════
async function testFullPipeline(transcripts) {
  section('TEST 5: Pipeline complet – Transcript → Analyse IA');

  const entries = Object.entries(transcripts);
  if (entries.length === 0) {
    warn('Aucune transcription disponible — skip pipeline test');
    results.skipped++;
    return;
  }

  // Pick the first successful transcript
  const [videoId, { transcript, title, channel }] = entries[0];
  info(`Test avec: "${title}" (${transcript.length} chars)`);

  const SYSTEM = `Tu es un assistant pédagogique pour Ilmify.
RÈGLES : travaille UNIQUEMENT avec le texte fourni. Réponds en JSON.`;

  // ── Stage 1: Résumé + Synthèse + Points clés ────
  info('Stage 1: Résumé + Synthèse + Points clés...');
  const isLong = transcript.length > 15000;
  const maxInput = isLong ? 40000 : 12000;
  const sampled = sampleTranscript(transcript, maxInput);

  const textPrompt = `Analyse cette vidéo :
Titre : ${title}
Chaîne : ${channel}

Transcription :
${sampled}

Réponds en JSON :
{
  "summary": "Résumé court 3-5 phrases",
  "synthesis": "Synthèse structurée 600-900 mots",
  "keyPoints": ["Point 1", "Point 2", "...entre 8 et 12 points"]
}`;

  const useOR = isLong && !!OPENROUTER_API_KEY;
  const stage1fn = useOR ? callOpenRouterRaw : callGroqRaw;
  const stage1model = useOR ? OPENROUTER_PRIMARY_MODEL : 'llama-3.3-70b-versatile';
  const stage1 = await stage1fn(
    [{ role: 'system', content: SYSTEM }, { role: 'user', content: textPrompt }],
    true, stage1model, useOR ? 8000 : 4000,
  );

  let textParsed = null;
  if (stage1.ok) {
    try {
      textParsed = JSON.parse(extractJsonFromText(stage1.content));
      const hasSummary = typeof textParsed.summary === 'string' && textParsed.summary.length > 20;
      const hasSynthesis = typeof textParsed.synthesis === 'string' && textParsed.synthesis.length > 100;
      const hasPoints = Array.isArray(textParsed.keyPoints) && textParsed.keyPoints.length >= 3;

      if (hasSummary && hasSynthesis && hasPoints) {
        recordPass(`Stage 1 OK — summary:${textParsed.summary.length}c, synthesis:${textParsed.synthesis.length}c, ${textParsed.keyPoints.length} points — ${stage1.elapsed}ms`);
      } else {
        recordWarn(`Stage 1 partiel — summary:${hasSummary} synthesis:${hasSynthesis} points:${hasPoints}`);
      }
    } catch (e) {
      recordFail(`Stage 1 — JSON parse error: ${e.message}\nRaw: ${stage1.content.slice(0, 200)}`);
    }
  } else {
    recordFail(`Stage 1 — API error (${stage1.status}): ${stage1.error}`);
  }

  // Pause rate limit — 20s pour respecter le TPM Groq free tier
  info('Pause 20s (rate limit Groq free tier)...');
  await sleep(20000);

  // ── Stage 2: Blocs + Chapitres + Quiz ────
  info('Stage 2: Blocs + Chapitres + Quiz...');
  const blocksPrompt = `Génère pour cette vidéo une note structurée, des chapitres et un quiz.

Titre : ${title}
Points clés : ${(textParsed?.keyPoints || ['pas de points']).join(' | ')}
Transcription (extrait) :
${sampleTranscript(transcript, 4000)}

Réponds en JSON :
{
  "blocks": [{"type": "heading1", "content": "..."}, ...],
  "chapters": [{"title": "...", "percentStart": 0}, ...],
  "quizQuestions": [{"question": "?", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..."}, ...]
}

Types de blocs: heading1, heading2, heading3, paragraph, bullet-list, callout, reminder, source, definition, divider, verse, hadith
8-12 blocs, 4-6 chapitres, 4-5 questions quiz.`;

  const stage2 = await callGroqRaw(
    [{ role: 'system', content: SYSTEM }, { role: 'user', content: blocksPrompt }],
    true, 'llama-3.3-70b-versatile', 4500,
  );

  if (stage2.ok) {
    try {
      const parsed = JSON.parse(extractJsonFromText(stage2.content));
      const blocks = parsed.blocks || [];
      const chapters = parsed.chapters || [];
      const quiz = parsed.quizQuestions || [];

      info(`  Blocs: ${blocks.length}, Chapitres: ${chapters.length}, Quiz: ${quiz.length}`);

      if (blocks.length >= 5) recordPass(`Stage 2 blocs OK — ${blocks.length} blocs générés`);
      else recordWarn(`Stage 2 blocs insuffisants — seulement ${blocks.length}`);

      if (chapters.length >= 2) recordPass(`Stage 2 chapitres OK — ${chapters.length} chapitres`);
      else recordWarn(`Stage 2 chapitres insuffisants — seulement ${chapters.length}`);

      if (quiz.length >= 3) recordPass(`Stage 2 quiz OK — ${quiz.length} questions`);
      else recordWarn(`Stage 2 quiz insuffisant — seulement ${quiz.length}`);

      // Log block types distribution
      const typeCounts = {};
      blocks.forEach(b => { typeCounts[b.type] = (typeCounts[b.type] || 0) + 1; });
      info(`  Types de blocs: ${JSON.stringify(typeCounts)}`);

      // Log elapsed
      info(`  Stage 2 terminé en ${stage2.elapsed}ms`);
    } catch (e) {
      recordFail(`Stage 2 — JSON parse error: ${e.message}\nRaw: ${stage2.content.slice(0, 200)}`);
    }
  } else {
    recordFail(`Stage 2 — API error (${stage2.status}): ${stage2.error}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 6: Transcript via direct YouTube scraping (simule Netlify fn)
// ════════════════════════════════════════════════════════════════════════════
async function testDirectYouTubeScraping() {
  section('TEST 6: Scraping YouTube direct (méthode Netlify)');

  const testIds = [
    { id: 'dQw4w9WgXcQ', label: 'Rick Astley (EN)', expect: true },
    { id: '5MgBikgcWnY', label: 'Conférence islamique FR', expect: true },
  ];

  for (const v of testIds) {
    try {
      const start = Date.now();
      const res = await fetch(`https://www.youtube.com/watch?v=${v.id}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      const elapsed = Date.now() - start;

      // Check for ytInitialPlayerResponse
      const hasPlayerResponse = html.includes('ytInitialPlayerResponse');
      const hasCaptions = html.includes('captionTracks') || html.includes('playerCaptionsTracklistRenderer');

      if (hasPlayerResponse) {
        recordPass(`[${v.id}] ${v.label} — page récupérée (${(html.length / 1024).toFixed(0)}KB, ${elapsed}ms)`);
        if (hasCaptions) {
          recordPass(`[${v.id}] captionTracks trouvé dans le HTML`);
        } else {
          recordWarn(`[${v.id}] captionTracks NON trouvé — les sous-titres sont peut-être désactivés`);
        }
      } else {
        recordFail(`[${v.id}] ${v.label} — ytInitialPlayerResponse non trouvé (bot detection?)`);
      }
    } catch (err) {
      recordFail(`[${v.id}] ${v.label} — ${err.message}`);
    }
    await sleep(2000);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 7: Edge cases sur le contenu
// ════════════════════════════════════════════════════════════════════════════
async function testEdgeCases() {
  section('TEST 7: Cas limites');

  // Test truncation function
  const shortText = 'Hello world';
  const longText = 'A'.repeat(20000);

  const truncShort = truncateContent(shortText);
  if (truncShort === shortText) recordPass('truncateContent — texte court non modifié');
  else recordFail('truncateContent — texte court modifié incorrectement');

  const truncLong = truncateContent(longText);
  if (truncLong.length <= 6100 && truncLong.includes('[... contenu tronqué ...')) {
    recordPass(`truncateContent — texte long tronqué: ${longText.length}→${truncLong.length} chars`);
  } else {
    recordFail(`truncateContent — troncation incorrecte: ${truncLong.length} chars`);
  }

  // Test sampleTranscript
  const sampledLong = sampleTranscript(longText, 6000);
  if (sampledLong.length <= 6200 && sampledLong.includes('[... milieu ..')) {
    recordPass(`sampleTranscript — échantillonnage OK: ${longText.length}→${sampledLong.length} chars`);
  } else {
    recordFail(`sampleTranscript — échantillonnage incorrect: ${sampledLong.length} chars`);
  }

  // Test AI with very short transcript
  info('Test IA avec transcription très courte (50 chars)...');
  const shortTranscript = 'Bismillah, bienvenue dans cette courte vidéo.';
  const r = await callGroqRaw(
    [
      { role: 'system', content: 'Réponds en JSON.' },
      { role: 'user', content: `Analyse: "${shortTranscript}"\n\nJSON: {"summary": "...", "keyPoints": ["..."]}` },
    ],
    true, 'llama-3.1-8b-instant', 500,
  );
  if (r.ok) {
    try {
      JSON.parse(extractJsonFromText(r.content));
      recordPass('IA avec texte minimal — JSON valide retourné');
    } catch {
      recordWarn('IA avec texte minimal — JSON invalide');
    }
  } else {
    recordFail(`IA avec texte minimal — erreur: ${r.error}`);
  }

  await sleep(2000);

  // Test AI with mixed language content (arabe + français)
  info('Test IA avec contenu mixte arabe/français...');
  const mixedText = 'بسم الله الرحمن الرحيم. Dans cette vidéo nous allons parler de la prière. الصلاة هي عماد الدين. La prière est le pilier de la religion.';
  const r2 = await callGroqRaw(
    [
      { role: 'system', content: 'Réponds en JSON en français.' },
      { role: 'user', content: `Résume ce texte:\n"${mixedText}"\n\nJSON: {"summary": "...", "keyPoints": ["..."]}` },
    ],
    true, 'llama-3.3-70b-versatile', 500,
  );
  if (r2.ok) {
    try {
      const parsed = JSON.parse(extractJsonFromText(r2.content));
      if (parsed.summary) recordPass('IA mixte arabe/français — OK');
      else recordWarn('IA mixte — JSON valide mais pas de summary');
    } catch {
      recordFail('IA mixte — JSON invalide');
    }
  } else {
    recordFail(`IA mixte — erreur: ${r2.error}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TEST 8: Rate limits & timing
// ════════════════════════════════════════════════════════════════════════════
async function testRateLimits() {
  section('TEST 8: Rate limits — 3 appels rapides Groq');

  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(
      callGroqRaw(
        [{ role: 'user', content: `Dis "${i}"` }],
        false, 'llama-3.1-8b-instant', 10,
      )
    );
  }

  const results_rl = await Promise.all(promises);
  const succeeded = results_rl.filter(r => r.ok).length;
  const rateLimited = results_rl.filter(r => r.status === 429).length;

  if (succeeded === 3) {
    recordPass(`3/3 appels rapides OK — pas de rate limit`);
  } else if (rateLimited > 0) {
    recordWarn(`${rateLimited}/3 appels rate-limités (429) — ${succeeded}/3 réussis`);
  } else {
    recordFail(`Seulement ${succeeded}/3 réussis, erreurs: ${results_rl.filter(r => !r.ok).map(r => r.status).join(', ')}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${COLORS.bold}🧪 TEST COMPLET — Pipeline YouTube + IA — Ilmify${COLORS.reset}`);
  console.log(`${COLORS.dim}Date: ${new Date().toISOString()}${COLORS.reset}\n`);

  // Check API keys
  info(`Groq API key: ${GROQ_API_KEY ? '✅ configurée' : '❌ absente'}`);
  info(`OpenRouter API key: ${OPENROUTER_API_KEY ? '✅ configurée' : '❌ absente'}`);

  // Run all tests
  const transcripts = await testTranscripts();
  await testGroqModels();
  await testOpenRouterModels();
  await testJsonRobustness();
  await testFullPipeline(transcripts);
  await testDirectYouTubeScraping();
  await testEdgeCases();
  await testRateLimits();

  // Summary
  section('RÉSUMÉ');
  console.log(`  ${COLORS.green}✅ Réussis:    ${results.passed}${COLORS.reset}`);
  console.log(`  ${COLORS.red}❌ Échoués:    ${results.failed}${COLORS.reset}`);
  console.log(`  ${COLORS.yellow}⚠️  Warnings:  ${results.warnings}${COLORS.reset}`);
  if (results.skipped > 0) console.log(`  ${COLORS.dim}⏭️  Skippés:   ${results.skipped}${COLORS.reset}`);

  console.log(`\n${COLORS.bold}Diagnostic:${COLORS.reset}`);
  if (results.failed === 0) {
    console.log(`  ${COLORS.green}Tout fonctionne ! Le pipeline est opérationnel.${COLORS.reset}`);
  } else {
    console.log(`  ${COLORS.red}${results.failed} test(s) échoué(s). Voir les détails ci-dessus.${COLORS.reset}`);
    console.log(`\n${COLORS.bold}Points d'attention:${COLORS.reset}`);
    console.log(`  1. Transcription: la lib youtube-transcript peut échouer en local (bot detection)`);
    console.log(`  2. En prod, la Netlify function scrape YouTube directement (plus fiable)`);
    console.log(`  3. Groq llama-3.1-8b pour le Stage 2 peut générer du JSON incomplet`);
    console.log(`  4. Les modèles free OpenRouter peuvent être rate-limités ou indisponibles`);
    console.log(`  5. MAX_CONTENT_LENGTH=6000 est très petit pour des vidéos longues`);
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\n${COLORS.red}ERREUR FATALE: ${err.message}${COLORS.reset}`);
  process.exit(2);
});
