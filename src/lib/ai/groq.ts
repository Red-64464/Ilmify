const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const OPENROUTER_PRIMARY_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'; // Nemotron 120B — 262K, très fiable, rarement rate-limité
const OPENROUTER_FALLBACK_MODEL = 'minimax/minimax-m2.5:free';              // MiniMax M2.5 — 197K context, bon fallback

const SYSTEM_PROMPT = `Tu es un assistant pédagogique pour une application d'apprentissage islamique appelée Ilmify.

RÈGLES STRICTES :
- Tu travailles UNIQUEMENT à partir du texte fourni par l'utilisateur.
- Tu ne dois JAMAIS inventer ou ajouter des informations islamiques (hadiths, versets, avis juridiques) de ta propre connaissance.
- Si le texte fourni est insuffisant pour répondre, dis-le clairement.
- Réponds toujours en français avec des emojy.
- Quand on te demande du JSON, réponds UNIQUEMENT avec du JSON valide, sans texte autour, sans markdown.`;

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqChoice {
  message: { content: string };
}

const MAX_CONTENT_LENGTH = 12000;

/** Tronque intelligemment un texte long en gardant début + fin */
export function truncateContent(text: string, maxLen = MAX_CONTENT_LENGTH): string {
  if (text.length <= maxLen) return text;
  const half = Math.floor(maxLen / 2) - 30;
  return text.slice(0, half) + '\n\n[... contenu tronqué pour l\'IA ...]\n\n' + text.slice(-half);
}

/** Échantillonne un texte long en 3 sections : début, milieu, fin */
function sampleTranscript(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const third = Math.floor(maxLen / 3) - 30;
  const midPos = Math.floor(text.length / 2);
  const start = text.slice(0, third);
  const mid = text.slice(midPos - Math.floor(third / 2), midPos + Math.ceil(third / 2));
  const end = text.slice(text.length - third);
  return `${start}\n\n[... milieu de la vidéo ...]\n\n${mid}\n\n[... fin de la vidéo ...]\n\n${end}`;
}

/** Extrait le premier objet JSON valide d'un texte brut */
function extractJsonFromText(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

function extractJsonArrayFromText(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

async function callGroq(
  messages: GroqMessage[],
  json = false,
  model = 'llama-3.3-70b-versatile',
  retries = 3,
  maxTokens = 2048,
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('Clé API Groq non configurée. Ajoutez NEXT_PUBLIC_GROQ_API_KEY dans .env.local');

  let lastError: Error | null = null;
  // On json_validate_failed we retry without response_format (model still outputs JSON from prompt)
  let useJsonMode = json;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      };
      if (useJsonMode) body.response_format = { type: 'json_object' };

      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();

        // Special recovery: json_validate_failed means JSON was truncated mid-stream.
        // 1. Try to salvage whatever was generated (failed_generation field).
        // 2. If not recoverable, retry without response_format so the model
        //    generates JSON as text (then we extract it manually).
        if (res.status === 400 && json && errText.includes('json_validate_failed')) {
          try {
            const errJson = JSON.parse(errText) as { error?: { failed_generation?: string } };
            const failedGen = errJson?.error?.failed_generation;
            if (failedGen) {
              const extracted = extractJsonFromText(failedGen);
              JSON.parse(extracted); // throws if still invalid
              return extracted;      // valid JSON recovered — use it
            }
          } catch {
            // failed_generation is also invalid; fall through to retry without json mode
          }
          // Disable json_object mode for subsequent attempts
          useJsonMode = false;
          continue;
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error(`Erreur Groq (${res.status}): ${errText.slice(0, 200)}`);
        }
        // 429 = rate limited → wait longer and retry
        if (res.status === 429) {
          // Extract wait time from error message if available
          const waitMatch = errText.match(/try again in ([\d.]+)s/);
          const waitSecs = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : 20;
          console.warn(`[Groq] Rate limit 429 on ${model}, waiting ${waitSecs}s...`);
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, waitSecs * 1000));
            continue;
          }
        }
        throw new Error(`Erreur Groq (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const content = (data.choices as GroqChoice[])[0].message.content;
      // If we fell back to non-json mode, extract the JSON object from prose text
      if (json && !useJsonMode) {
        return extractJsonFromText(content);
      }
      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry on auth errors
      if (lastError.message.includes('(401)') || lastError.message.includes('(403)')) {
        throw lastError;
      }
      if (attempt < retries - 1) {
        // Exponential backoff: 2s, 6s, 18s
        await new Promise(r => setTimeout(r, 2000 * Math.pow(3, attempt)));
      }
    }
  }

  throw lastError || new Error('Erreur Groq inconnue après plusieurs tentatives');
}

/** Appelle l'API OpenRouter — Qwen 3 235B en premier, fallback Nemotron si rate-limit */
async function callOpenRouter(
  messages: GroqMessage[],
  json = false,
  model?: string,
  retries = 2,
  maxTokens = 8000,
): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('Clé API OpenRouter non configurée. Ajoutez NEXT_PUBLIC_OPENROUTER_API_KEY dans .env.local');

  // Ordre de tentative : modèle demandé → primary → fallback
  const modelsToTry = model
    ? [model]
    : [OPENROUTER_PRIMARY_MODEL, OPENROUTER_FALLBACK_MODEL];

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const body: Record<string, unknown> = {
          model: currentModel,
          messages,
          temperature: 0.7,
          max_tokens: maxTokens,
        };
        if (json) body.response_format = { type: 'json_object' };

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

        if (!res.ok) {
          const errText = await res.text();
          if (res.status === 401 || res.status === 403) {
            throw new Error(`Erreur OpenRouter (${res.status}): ${errText.slice(0, 200)}`);
          }
          // 429 = rate limited → skip to fallback model immediately
          if (res.status === 429) {
            console.warn(`[OpenRouter] ${currentModel} rate-limité (429), bascule vers fallback...`);
            lastError = new Error(`Rate limit ${currentModel}`);
            break; // sort de la boucle retries → passe au modèle suivant
          }
          throw new Error(`Erreur OpenRouter (${res.status}): ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        const content = (data.choices as GroqChoice[])[0].message.content;
        console.log(`[OpenRouter] ✅ ${currentModel} a répondu`);
        if (json) {
          return extractJsonFromText(content);
        }
        return content;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message.includes('(401)') || lastError.message.includes('(403)')) {
          throw lastError;
        }
        // If rate-limited, break inner loop to try next model
        if (lastError.message.startsWith('Rate limit')) break;
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
        }
      }
    }
  }

  throw lastError || new Error('Erreur OpenRouter inconnue après plusieurs tentatives');
}

// ─── 1. Auto-generate flashcards from a passage ───

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export async function generateFlashcardsFromPassage(
  title: string,
  content: string,
  bookTitle?: string,
): Promise<GeneratedFlashcard[]> {
  const prompt = `À partir du passage suivant, génère entre 3 et 5 flashcards (question/réponse) pour aider à mémoriser les points clés.

Titre du passage : ${title}
${bookTitle ? `Livre : ${bookTitle}` : ''}

Texte :
${truncateContent(content)}

Réponds en JSON avec ce format exact :
{
  "flashcards": [
    { "front": "question claire et précise", "back": "réponse concise basée uniquement sur le texte" }
  ]
}`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true,
  );
  const parsed = JSON.parse(raw);
  return (parsed.flashcards || []) as GeneratedFlashcard[];
}

// ─── 2. Generate quiz from course ───

export interface GeneratedQuizQuestion {
  type: 'mcq' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  optionExplanations?: string[];
}

export async function generateQuizFromCourse(
  courseTitle: string,
  blocks: { type: string; content: string }[],
): Promise<GeneratedQuizQuestion[]> {
  const textContent = blocks
    .filter((b) => b.content.trim().length > 10)
    .map((b) => `[${b.type}] ${b.content}`)
    .join('\n\n');

  if (textContent.length < 50) throw new Error('Pas assez de contenu pour générer un quiz.');

  const prompt = `À partir du contenu du cours "${courseTitle}", génère entre 5 et 8 questions de quiz variées.

Contenu du cours :
${textContent.slice(0, 4000)}

RÈGLES :
- Les questions doivent tester la compréhension du contenu fourni UNIQUEMENT.
- Varie les types : QCM, vrai/faux, réponse courte.
- Pour les QCM : 4 options, correctAnswer = index (0-3) de la bonne réponse.
- Pour les vrai/faux : correctAnswer = "true" ou "false".
- Pour les réponses courtes : correctAnswer = la réponse attendue.
- Chaque question DOIT avoir une explication basée sur le texte du cours.
- Pour les QCM, ajoute un champ "optionExplanations" : un tableau de 4 phrases courtes expliquant pourquoi chaque option est correcte ou incorrecte.

Réponds en JSON :
{
  "questions": [
    {
      "type": "mcq",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "...",
      "optionExplanations": ["Correct car ...", "Incorrect car ...", "Incorrect car ...", "Incorrect car ..."]
    }
  ]
}`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true,
    'llama-3.1-8b-instant',
  );
  const parsed = JSON.parse(raw);
  return (parsed.questions || []) as GeneratedQuizQuestion[];
}

// ─── 3. Summarize a passage ───

export async function summarizePassage(title: string, content: string): Promise<string> {
  const prompt = `Résume ce passage en 2-3 phrases claires et concises. Ne rajoute AUCUNE information qui n'est pas dans le texte.

Titre : ${title}

Texte :
${truncateContent(content)}`;

  return callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    false,
    'llama-3.1-8b-instant',
  );
}

// ─── 4. Improve a personal reflection ───

export async function improveReflection(
  passageTitle: string,
  passageContent: string,
  reflection: string,
): Promise<string> {
  const prompt = `L'utilisateur a écrit une réflexion personnelle sur un passage qu'il a lu. Améliore sa réflexion en la rendant plus claire, mieux structurée et plus approfondie, tout en restant fidèle à ses idées originales. Ne rajoute AUCUNE information religieuse qui n'est pas dans le texte ou dans sa réflexion.

Passage : ${passageTitle}
Contenu du passage : ${truncateContent(passageContent)}

Réflexion de l'utilisateur :
${reflection}

Réponds UNIQUEMENT avec la réflexion améliorée, sans introduction ni commentaire.`;

  return callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    false,
    'llama-3.1-8b-instant',
  );
}

// ─── 5. Intelligent hadith search (uses HadeethEnc data) ───

export async function findBestHadithCategories(
  query: string,
  categories: { id: string; title: string }[],
): Promise<string[]> {
  const catList = categories.map((c) => `${c.id}: ${c.title}`).join('\n');
  const prompt = `L'utilisateur cherche un hadith sur le sujet suivant : "${query}"

Voici la liste des catégories disponibles (id: titre) :
${catList}

Choisis les 3 catégories les plus pertinentes pour cette recherche.
Réponds en JSON :
{ "categoryIds": ["id1", "id2", "id3"] }`;

  const raw = await callGroq(
    [{ role: 'system', content: 'Tu es un assistant qui aide à trouver des catégories de hadiths. Réponds uniquement en JSON.' }, { role: 'user', content: prompt }],
    true,
  );
  const parsed = JSON.parse(raw);
  return (parsed.categoryIds || []) as string[];
}

export async function rankHadithResults(
  query: string,
  hadiths: { id: string; title: string; text: string }[],
): Promise<string[]> {
  if (hadiths.length === 0) return [];
  const list = hadiths.slice(0, 15).map((h) => `ID:${h.id} — ${h.title}: ${h.text.slice(0, 150)}`).join('\n');
  const prompt = `L'utilisateur cherche : "${query}"

Voici des hadiths candidats :
${list}

Classe les 5 hadiths les plus pertinents par rapport à la recherche. Réponds en JSON :
{ "rankedIds": ["id1", "id2", "id3", "id4", "id5"] }`;

  const raw = await callGroq(
    [{ role: 'system', content: 'Tu es un assistant qui classe des hadiths par pertinence. Réponds uniquement en JSON.' }, { role: 'user', content: prompt }],
    true,
    'llama-3.1-8b-instant',
  );
  const parsed = JSON.parse(raw);
  return (parsed.rankedIds || []) as string[];
}

// ─── 6. Intelligent Quran search ───

export async function findRelevantVerses(
  query: string,
): Promise<{ surah: number; ayah: number; reason: string }[]> {
  const prompt = `L'utilisateur cherche des versets du Coran sur le sujet : "${query}"

Donne les 3 à 5 versets les plus pertinents. Tu DOIS donner des références réelles et précises du Coran.
Réponds en JSON :
{
  "verses": [
    { "surah": 2, "ayah": 183, "reason": "Ce verset parle du jeûne prescrit aux croyants" }
  ]
}`;

  const raw = await callGroq(
    [
      { role: 'system', content: 'Tu es un assistant spécialisé dans les références coraniques. Donne UNIQUEMENT des références de versets qui existent réellement dans le Coran. Réponds en JSON.' },
      { role: 'user', content: prompt },
    ],
    true,
  );
  const parsed = JSON.parse(raw);
  return (parsed.verses || []) as { surah: number; ayah: number; reason: string }[];
}

// ─── 7. Enrich passage with sources ───

export async function suggestSourcesForPassage(
  title: string,
  content: string,
): Promise<{
  hadithKeywords: string[];
  quranVerses: { surah: number; ayah: number; reason: string }[];
}> {
  const prompt = `Analyse ce passage et suggère des sources islamiques vérifiables pour l'enrichir.

Titre : ${title}
Contenu : ${content}

Réponds en JSON :
{
  "hadithKeywords": ["mot-clé 1 pour rechercher des hadiths liés", "mot-clé 2"],
  "quranVerses": [
    { "surah": 2, "ayah": 183, "reason": "Ce verset est lié au sujet car..." }
  ]
}

IMPORTANT : Pour les versets, donne UNIQUEMENT des références réelles du Coran. Pour les hadiths, donne des mots-clés de recherche, pas des hadiths inventés.`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true,
  );
  return JSON.parse(raw);
}

// ─── 8. Verify hadith ───

export async function verifyHadithText(
  hadithText: string,
  hadeethEncResults: { id: string; title: string; text: string; grade: string; attribution: string }[],
): Promise<string> {
  if (hadeethEncResults.length === 0) {
    return 'Aucune correspondance trouvée dans la base HadeethEnc. Ce hadith n\'a pas pu être vérifié. Veuillez vérifier auprès d\'un savant.';
  }

  const matches = hadeethEncResults.slice(0, 5).map(
    (h) => `- "${h.text.slice(0, 200)}" (Grade: ${h.grade}, Source: ${h.attribution})`
  ).join('\n');

  const prompt = `L'utilisateur veut vérifier ce hadith :
"${hadithText}"

Voici les hadiths les plus proches trouvés dans la base HadeethEnc (source vérifiée) :
${matches}

Compare le hadith de l'utilisateur avec les résultats. Réponds de manière concise :
1. Y a-t-il une correspondance ? (oui/non/partielle)
2. Si oui, quel est le grade officiel ?
3. Quelle est la source/attribution ?

IMPORTANT : Base-toi UNIQUEMENT sur les données HadeethEnc fournies ci-dessus. N'invente aucune information.`;

  return callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    false,
    'llama-3.1-8b-instant',
  );
}
// ─── 9. Analyze YouTube video transcript ───

export interface VideoChapter {
  title: string;
  percentStart: number;
}

export interface VideoQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface VideoAnalysis {
  summary: string;
  synthesis: string;
  keyPoints: string[];
  blocks: { type: string; content: string; metadata?: Record<string, string> }[];
  chapters: VideoChapter[];
  quizQuestions: VideoQuizQuestion[];
}

export async function generateVideoAnalysis(
  transcript: string,
  videoTitle: string,
  channelName?: string,
  onProgress?: (step: string, partial?: Partial<VideoAnalysis>) => void,
): Promise<VideoAnalysis> {
  const report = (step: string, partial?: Partial<VideoAnalysis>) => { if (onProgress) onProgress(step, partial); };

  const hasOpenRouter = !!OPENROUTER_API_KEY;
  const isLong = transcript.length > 15000;

  // For long transcripts on OpenRouter, we can send much more context
  const maxInputChars = (isLong && hasOpenRouter) ? 40000 : 15000;
  const sampled = sampleTranscript(transcript, maxInputChars);
  const context = `Titre : ${videoTitle}${channelName ? `\nChaîne : ${channelName}` : ''}\n\nTranscription :\n${sampled}`;

  const synthTarget = (isLong && hasOpenRouter) ? '3000-5000 mots' : '1200-1800 mots';
  const keyPointsTarget = (isLong && hasOpenRouter) ? '15 et 25 points' : '10 et 15 points';

  // Stage 1 prompt: résumé + synthèse + points clés
  const textPrompt = `Analyse en profondeur cette vidéo et génère :
${context}

Réponds en JSON avec exactement ces 3 champs :
{
  "summary": "Résumé court de 3-5 phrases qui capture l'essentiel de la vidéo.",
  "synthesis": "Synthèse structurée (${synthTarget}) couvrant les principaux thèmes et arguments. Structure en paragraphes séparés par \\n\\n.",
  "keyPoints": ["Point essentiel 1", "Point essentiel 2", "... entre ${keyPointsTarget}"]
}`;

  // Stage 2 prompt builder — different input sizes for OpenRouter vs Groq
  const buildBlocksPrompt = (inputChars: number) => `Génère pour cette vidéo islamique une note de cours TRÈS DÉTAILLÉE et COMPLÈTE, une table des matières et un quiz.

Titre : ${videoTitle}
Transcription (extrait) :
${sampleTranscript(transcript, inputChars)}

Réponds en JSON avec exactement ces 3 champs :
{
  "blocks": [...],
  "chapters": [...],
  "quizQuestions": [...]
}

RÈGLES pour les blocs (20-35 blocs MINIMUM, sois EXHAUSTIF) :
- Types : heading1, heading2, heading3, paragraph, bullet-list, callout, reminder, source, definition, divider, verse, hadith
- Commence par heading1 avec titre principal
- Organise en PLUSIEURS sections heading2 avec des sous-sections heading3
- Chaque section doit avoir AU MINIMUM 2-3 paragraphes détaillés développant les idées
- Utilise bullet-list pour lister les points importants dans chaque section
- Utilise definition pour définir les termes islamiques clés mentionnés
- Cite les versets coraniques (verse) et hadiths mentionnés avec leurs sources complètes
- Points importants en callout (au moins 3-4 callouts)
- Ajoute des rappels (reminder) entre les sections pour les messages essentiels
- La note doit être une SYNTHÈSE COMPLÈTE : quelqu'un qui la lit doit comprendre TOUT le contenu de la vidéo sans l'avoir vue
- Développe chaque argument, chaque exemple, chaque preuve mentionnée
- Termine par un reminder récapitulatif
- Pour verse/hadith : metadata { "source": "...", "reference": "..." }

RÈGLES pour les chapitres (4-6 chapitres) :
- Identifie les grandes sections thématiques de la vidéo
- percentStart = position approximative 0-100 (0=début, 100=fin)
- Format : { "title": "Nom du chapitre", "percentStart": 0 }

RÈGLES pour le quiz (8-10 questions QCM) :
- 4 options par question, correctAnswer = index 0-3
- Basé UNIQUEMENT sur le contenu de la vidéo
- Couvre différents aspects de la vidéo (début, milieu, fin)
- Mélange de questions faciles, moyennes et difficiles
- Format : { "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }`;

  const blocksPrompt = buildBlocksPrompt(hasOpenRouter ? 16000 : 6000);

  report('Analyse en cours...');

  // Run both stages in PARALLEL — Groq for Stage 1, OpenRouter for Stage 2 (different providers = no rate conflicts)
  // If no OpenRouter, run sequentially on Groq with a small pause
  if (hasOpenRouter) {
    const stage1Messages = [{ role: 'system' as const, content: SYSTEM_PROMPT }, { role: 'user' as const, content: textPrompt }];
    const stage2Messages = [{ role: 'system' as const, content: SYSTEM_PROMPT }, { role: 'user' as const, content: blocksPrompt }];

    const stage1Fn = isLong
      ? callOpenRouter(stage1Messages, true, undefined, 3, 12000)
      : callGroq(stage1Messages, true, 'llama-3.3-70b-versatile', 3, 6000);

    const stage2Fn = callOpenRouter(stage2Messages, true, undefined, 3, 16000);

    // Race: whichever finishes first gets shown as partial result
    const results = await Promise.allSettled([stage1Fn, stage2Fn]);

    const errors: string[] = [];
    let textParsed: { summary?: string; synthesis?: string; keyPoints?: string[] } = {};
    let blocksParsed: { blocks?: { type: string; content: string; metadata?: Record<string, string> }[]; chapters?: VideoChapter[]; quizQuestions?: VideoQuizQuestion[] } = {};

    if (results[0].status === 'fulfilled') {
      try { textParsed = JSON.parse(extractJsonFromText(results[0].value)); } catch (e) { errors.push(`Stage 1 JSON: ${e}`); }
    } else {
      errors.push(`Stage 1 OpenRouter: ${results[0].reason}`);
      // Fallback Stage 1 to Groq if it was on OpenRouter (long transcripts)
      if (isLong) {
        report('Analyse du résumé (fallback Groq)...');
        try {
          const fallbackRaw = await callGroq(stage1Messages, true, 'llama-3.3-70b-versatile', 3, 6000);
          textParsed = JSON.parse(extractJsonFromText(fallbackRaw));
          report('Résumé terminé, suite de l\'analyse...', {
            summary: textParsed.summary ?? '',
            synthesis: textParsed.synthesis ?? '',
            keyPoints: textParsed.keyPoints ?? [],
          });
        } catch (e) { errors.push(`Stage 1 Groq fallback: ${e}`); }
      }
    }

    if (results[1].status === 'fulfilled') {
      try { blocksParsed = JSON.parse(extractJsonFromText(results[1].value)); } catch (e) { errors.push(`Stage 2 JSON: ${e}`); }
    } else {
      errors.push(`Stage 2 OpenRouter: ${results[1].reason}`);
    }

    // Fallback Stage 2 to Groq if OpenRouter failed (rate limit, etc.)
    const hasBlocks = !!((blocksParsed.blocks && blocksParsed.blocks.length > 0) || (blocksParsed.quizQuestions && blocksParsed.quizQuestions.length > 0));
    if (!hasBlocks) {
      report('Génération des blocs (fallback Groq)...');
      // Rebuild prompt with smaller transcript for Groq's TPM limit
      const groqBlocksPrompt = buildBlocksPrompt(4000);
      const groqStage2Messages = [{ role: 'system' as const, content: SYSTEM_PROMPT }, { role: 'user' as const, content: groqBlocksPrompt }];
      // Small pause if Stage 1 was also on Groq to avoid rate limits
      if (!isLong) await new Promise(r => setTimeout(r, 5000));
      try {
        const fallbackRaw = await callGroq(groqStage2Messages, true, 'llama-3.3-70b-versatile', 3, 8000);
        blocksParsed = JSON.parse(extractJsonFromText(fallbackRaw));
      } catch (e) { errors.push(`Stage 2 Groq fallback: ${e}`); }
    }

    if (errors.length > 0) {
      console.warn('[AI Analysis] Errors:', errors);
    }

    // If BOTH stages failed completely, throw instead of returning empty
    const hasText = !!(textParsed.summary || textParsed.synthesis || (textParsed.keyPoints && textParsed.keyPoints.length > 0));
    const hasBlocksFinal = !!((blocksParsed.blocks && blocksParsed.blocks.length > 0) || (blocksParsed.quizQuestions && blocksParsed.quizQuestions.length > 0));
    if (!hasText && !hasBlocksFinal) {
      throw new Error(`L'analyse IA a échoué : ${errors.join(' | ') || 'Aucune donnée retournée par les modèles'}`);
    }

    return {
      summary: textParsed.summary ?? '',
      synthesis: textParsed.synthesis ?? '',
      keyPoints: textParsed.keyPoints ?? [],
      blocks: blocksParsed.blocks ?? [],
      chapters: blocksParsed.chapters ?? [],
      quizQuestions: blocksParsed.quizQuestions ?? [],
    };
  }

  // Fallback: Groq-only sequential mode
  report('Analyse du contenu (étape 1/2)...');
  const textRaw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: textPrompt }],
    true, 'llama-3.3-70b-versatile', 3, 6000,
  );

  let textParsed: { summary?: string; synthesis?: string; keyPoints?: string[] };
  try {
    textParsed = JSON.parse(extractJsonFromText(textRaw));
  } catch {
    textParsed = { summary: '', synthesis: '', keyPoints: [] };
  }

  // Show Stage 1 results immediately while Stage 2 loads
  report('Génération du quiz (étape 2/2)...', {
    summary: textParsed.summary ?? '',
    synthesis: textParsed.synthesis ?? '',
    keyPoints: textParsed.keyPoints ?? [],
  });

  // Short pause for Groq rate limit (reduced from 20s)
  await new Promise(r => setTimeout(r, 10000));

  // Rebuild with smaller transcript for Groq TPM limit
  const groqBlocksPrompt = buildBlocksPrompt(4000);
  const blocksRaw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: groqBlocksPrompt }],
    true, 'llama-3.3-70b-versatile', 3, 8000,
  );

  let blocksParsed: {
    blocks?: { type: string; content: string; metadata?: Record<string, string> }[];
    chapters?: VideoChapter[];
    quizQuestions?: VideoQuizQuestion[];
  };
  try {
    blocksParsed = JSON.parse(extractJsonFromText(blocksRaw));
  } catch {
    blocksParsed = { blocks: [], chapters: [], quizQuestions: [] };
  }

  return {
    summary: textParsed.summary ?? '',
    synthesis: textParsed.synthesis ?? '',
    keyPoints: textParsed.keyPoints ?? [],
    blocks: blocksParsed.blocks ?? [],
    chapters: blocksParsed.chapters ?? [],
    quizQuestions: blocksParsed.quizQuestions ?? [],
  };
}

// ─── 10. Answer a question about a video transcript ───

export async function answerVideoQuestion(
  transcript: string,
  videoTitle: string,
  question: string,
): Promise<{ answer: string; citation: string }> {
  const isLong = transcript.length > 15000;
  const useOR = isLong && !!OPENROUTER_API_KEY;
  const callAI = useOR ? callOpenRouter : callGroq;
  const truncated = useOR ? sampleTranscript(transcript, 20000) : truncateContent(transcript, 8000);
  const prompt = `Tu analyses la transcription d'une vidéo intitulée "${videoTitle}".

Transcription :
${truncated}

Question de l'utilisateur : "${question}"

Réponds en JSON :
{
  "answer": "Réponse claire et complète basée UNIQUEMENT sur la transcription (2-5 phrases).",
  "citation": "Citation exacte tirée de la transcription qui justifie ta réponse (1-2 phrases, entre guillemets)."
}

IMPORTANT : Base-toi UNIQUEMENT sur la transcription fournie. Si la réponse n'est pas dans la transcription, indique-le clairement dans "answer" et laisse "citation" vide.`;

  const raw = await callAI(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true,
    useOR ? undefined : 'llama-3.1-8b-instant',
    3,
    1200,
  );
  return JSON.parse(raw) as { answer: string; citation: string };
}

// ─── 11. Analyze article / PDF text into topic blocks ───

async function analyzeTextContent(
  text: string,
  documentTitle: string,
  sourceContext: string,
): Promise<{ title: string; blocks: { type: string; content: string; metadata?: Record<string, string> }[] }> {
  const truncated = truncateContent(text, 8000);
  const prompt = `Transforme ce texte en une note islamique structurée sous forme de blocs.

Titre suggéré : ${documentTitle}
${sourceContext}

Texte :
${truncated}

Génère entre 8 et 15 blocs bien organisés.
Types disponibles : heading1, heading2, heading3, paragraph, bullet-list, callout, reminder, source, definition, divider, verse, hadith, quote

RÈGLES :
- Commence par heading1 (titre adapté au contenu réel)
- Organise par sections avec heading2/heading3
- Points importants en callout
- Termine par reminder avec l'essentiel
- Si le titre réel du texte est plus explicite, utilise-le pour "title"

Réponds en JSON :
{
  "title": "Titre final du topic",
  "blocks": [
    { "type": "heading1", "content": "..." },
    { "type": "paragraph", "content": "..." }
  ]
}`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true,
    'llama-3.3-70b-versatile',
    3,
    4000,
  );
  return JSON.parse(raw) as { title: string; blocks: { type: string; content: string; metadata?: Record<string, string> }[] };
}

export async function analyzeArticle(
  text: string,
  url: string,
  suggestedTitle?: string,
): Promise<{ title: string; blocks: { type: string; content: string; metadata?: Record<string, string> }[] }> {
  return analyzeTextContent(text, suggestedTitle || 'Article web', `URL source : ${url}`);
}

export async function analyzePdf(
  text: string,
  fileName: string,
): Promise<{ title: string; blocks: { type: string; content: string; metadata?: Record<string, string> }[] }> {
  return analyzeTextContent(text, fileName.replace(/\.pdf$/i, ''), 'Source : PDF importé');
}

// ─── 11. French Quran Tafsir (explanation) ───

/**
 * Génère une explication concise en français d'un verset coranique.
 * Utilise uniquement des informations islamiques fiables et reconnues.
 */
export async function generateTafsirFr(
  surah: number,
  ayah: number,
  arabic: string,
  translation: string,
): Promise<string> {
  const prompt = `Verset : Sourate ${surah}, Verset ${ayah}

Texte arabe : ${arabic}
Traduction française : ${translation}

Donne une explication concise et didactique de ce verset en 3 à 6 phrases. 
L'explication doit :
- Présenter le sens général du verset
- Mentionner le contexte ou l'enseignement principal
- Être accessible à un lecteur francophone non spécialiste

Réponds uniquement avec l'explication, sans titre ni introduction.`;

  return callGroq(
    [
      {
        role: 'system',
        content:
          'Tu es un spécialiste du Coran et de son exégèse. Tu fournis des explications claires, fidèles et basées sur les tafsirs reconnus (Ibn Kathir, Al-Qurtubi, Al-Tabari). Réponds en français, de manière concise et pédagogique.',
      },
      { role: 'user', content: prompt },
    ],
    false,
    'llama-3.1-8b-instant',
    2,
    600,
  );
}

// ─── Quran AI features (per-verse) ───

export interface HadithSuggestion {
  text: string;
  source: string;
  relevance: string;
}

export interface WordTranslation {
  arabic: string;
  transliteration: string;
  meaning: string;
}

export async function generateHadithSuggestions(
  surah: number,
  ayah: number,
  arabic: string,
  translation: string,
): Promise<HadithSuggestion[]> {
  const prompt = `Verset : Sourate ${surah}, Verset ${ayah}
Texte arabe : ${arabic}
Traduction : ${translation}

Trouve 2 à 4 hadiths authentiques (sahih ou hasan) en lien avec ce verset.
Réponds UNIQUEMENT en JSON valide, un tableau d'objets avec les clés : "text" (texte du hadith en français), "source" (collection et numéro, ex: Sahih Bukhari 1234), "relevance" (une phrase expliquant le lien avec le verset).`;

  const raw = await callGroq(
    [
      { role: 'system', content: 'Tu es un spécialiste du hadith. Réponds uniquement en JSON valide (un tableau). Ne mets pas de markdown autour.' },
      { role: 'user', content: prompt },
    ],
    true,
    'llama-3.1-8b-instant',
    2,
    1200,
  );
  try {
    const parsed = JSON.parse(raw.startsWith('[') ? raw : extractJsonArrayFromText(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function generateVerseConnections(
  surah: number,
  ayah: number,
  arabic: string,
  translation: string,
): Promise<{ surah: number; ayah: number; surahName: string; reason: string }[]> {
  const prompt = `Verset : Sourate ${surah}, Verset ${ayah}
Texte arabe : ${arabic}
Traduction : ${translation}

Trouve 3 à 5 versets du Coran thématiquement liés à celui-ci.
Réponds UNIQUEMENT en JSON valide, un tableau d'objets avec les clés : "surah" (numéro), "ayah" (numéro), "surahName" (nom en français), "reason" (une phrase expliquant le lien).`;

  const raw = await callGroq(
    [
      { role: 'system', content: 'Tu es un spécialiste du Coran. Réponds uniquement en JSON valide (un tableau). Ne mets pas de markdown autour.' },
      { role: 'user', content: prompt },
    ],
    true,
    'llama-3.1-8b-instant',
    2,
    1200,
  );
  try {
    const parsed = JSON.parse(raw.startsWith('[') ? raw : extractJsonArrayFromText(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function generateAsbabNuzul(
  surah: number,
  ayah: number,
  arabic: string,
  translation: string,
): Promise<string> {
  const prompt = `Verset : Sourate ${surah}, Verset ${ayah}
Texte arabe : ${arabic}
Traduction : ${translation}

Explique les circonstances de révélation (Asbab al-Nuzul) de ce verset en 3 à 6 phrases.
Si les circonstances exactes ne sont pas connues, mentionne-le et donne le contexte historique général de la sourate.
Réponds uniquement avec l'explication, sans titre ni introduction.`;

  return callGroq(
    [
      { role: 'system', content: 'Tu es un spécialiste du Coran et des sciences coraniques. Tu fournis des informations sur les Asbab al-Nuzul basées sur les sources reconnues (Al-Wahidi, Al-Suyuti). Réponds en français.' },
      { role: 'user', content: prompt },
    ],
    false,
    'llama-3.1-8b-instant',
    2,
    600,
  );
}

export async function generateWordByWord(
  surah: number,
  ayah: number,
  arabic: string,
): Promise<WordTranslation[]> {
  const prompt = `Verset : Sourate ${surah}, Verset ${ayah}
Texte arabe : ${arabic}

Donne la traduction mot à mot de ce verset.
Réponds UNIQUEMENT en JSON valide, un tableau d'objets avec les clés : "arabic" (le mot arabe), "transliteration" (translittération), "meaning" (sens en français).
L'ordre doit suivre l'ordre des mots arabes (de droite à gauche).`;

  const raw = await callGroq(
    [
      { role: 'system', content: 'Tu es un spécialiste de la langue arabe coranique. Réponds uniquement en JSON valide (un tableau). Ne mets pas de markdown autour.' },
      { role: 'user', content: prompt },
    ],
    true,
    'llama-3.1-8b-instant',
    2,
    1500,
  );
  try {
    const parsed = JSON.parse(raw.startsWith('[') ? raw : extractJsonArrayFromText(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── 12. Book summary from passages ───

export async function generateBookSummary(
  bookTitle: string,
  author: string,
  passages: { title: string; content: string; pageNumber?: number }[],
): Promise<string> {
  if (passages.length === 0) throw new Error('Aucun passage pour générer un résumé.');
  const passagesText = passages
    .map((p, i) => `[Passage ${i + 1}${p.pageNumber ? ` — p.${p.pageNumber}` : ''}] ${p.title}\n${p.content}`)
    .join('\n\n');

  const prompt = `À partir des passages notés par l'utilisateur pour le livre "${bookTitle}" de ${author}, génère un résumé global structuré du livre.

Passages notés :
${truncateContent(passagesText, 10000)}

Le résumé doit :
- Avoir un paragraphe d'introduction résumant le thème principal du livre
- Couvrir les idées principales de chaque passage
- Faire des liens entre les passages
- Terminer par une conclusion avec les enseignements clés
- Être rédigé en français, de manière fluide et accessible

Réponds UNIQUEMENT avec le résumé, sans titre ni introduction.`;

  const hasOR = !!OPENROUTER_API_KEY;
  if (hasOR && passagesText.length > 8000) {
    return callOpenRouter(
      [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      false, undefined, 2, 4000,
    );
  }
  return callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    false, 'llama-3.3-70b-versatile', 3, 3000,
  );
}

// ─── 13. AI reading plan ───

export async function generateReadingPlan(
  bookTitle: string,
  totalPages: number,
  daysAvailable: number,
  currentPage?: number,
): Promise<{ days: { day: number; fromPage: number; toPage: number; theme: string }[]; tip: string }> {
  const startPage = currentPage || 1;
  const prompt = `Génère un plan de lecture pour le livre "${bookTitle}".

Informations :
- Pages totales : ${totalPages}
- Page actuelle : ${startPage}
- Jours disponibles : ${daysAvailable}

Crée un plan de lecture jour par jour. Pour chaque jour, indique les pages à lire et un thème/objectif motivant.

Réponds en JSON :
{
  "days": [
    { "day": 1, "fromPage": ${startPage}, "toPage": 30, "theme": "Introduction et contexte" }
  ],
  "tip": "Un conseil de lecture motivant"
}`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.1-8b-instant', 2, 2000,
  );
  return JSON.parse(raw);
}

// ─── 14. AI book category detection ───

export async function detectBookCategory(
  title: string,
  author: string,
  description?: string,
): Promise<string> {
  const prompt = `Détermine la catégorie la plus appropriée pour ce livre islamique.

Titre : ${title}
Auteur : ${author}
${description ? `Description : ${description}` : ''}

Catégories disponibles : Aqida, Hadith, Sira, Fiqh, Tafsir, Adhkar, Éducation, Histoire, Spiritualité, Invocations, Biographie, Autre

Réponds en JSON :
{ "category": "nom de la catégorie" }`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.1-8b-instant', 2, 200,
  );
  const parsed = JSON.parse(raw);
  return parsed.category || 'Autre';
}

// ─── 15. AI book recommendations ───

export async function generateBookRecommendations(
  readBooks: { title: string; author: string; category: string; rating?: number }[],
): Promise<{ title: string; author: string; reason: string }[]> {
  if (readBooks.length === 0) throw new Error('Aucun livre lu pour générer des recommandations.');
  const booksList = readBooks
    .map((b) => `- "${b.title}" de ${b.author} (${b.category}${b.rating ? `, note: ${b.rating}/5` : ''})`)
    .join('\n');

  const prompt = `L'utilisateur a lu ces livres islamiques :
${booksList}

Recommande 5 livres islamiques qu'il pourrait aimer, en te basant sur ses goûts. Les recommandations doivent être des livres RÉELS et existants.

Réponds en JSON :
{
  "recommendations": [
    { "title": "Titre du livre", "author": "Auteur", "reason": "Courte raison de la recommandation" }
  ]
}`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 2000,
  );
  const parsed = JSON.parse(raw);
  return (parsed.recommendations || []) as { title: string; author: string; reason: string }[];
}

// ─── 16. Islamic verification of passage ───

export async function verifyIslamicClaim(
  passage: string,
): Promise<{ status: 'ok' | 'warning' | 'error'; issues: { text: string; severity: string; explanation: string }[] }> {
  const prompt = `Analyse ce passage et vérifie s'il contient des affirmations islamiques douteuses, incorrectes ou non sourcées.

Passage :
${truncateContent(passage, 6000)}

Vérifie :
1. Les hadiths mentionnés sont-ils authentiques et bien attribués ?
2. Les versets coraniques sont-ils correctement cités ?
3. Y a-t-il des avis juridiques non attribués à une école reconnue ?
4. Y a-t-il des croyances contraires au consensus des savants ?

Réponds en JSON :
{
  "status": "ok" ou "warning" ou "error",
  "issues": [
    { "text": "Citation problématique", "severity": "warning ou error", "explanation": "Explication du problème" }
  ]
}

Si tout est correct, retourne status "ok" avec un tableau vide.`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 2000,
  );
  return JSON.parse(raw);
}

// ─── 17. AI Mind Map generation ───

export interface MindMapNode {
  id: string;
  label: string;
  children: MindMapNode[];
}

export async function generateMindMap(
  topicTitle: string,
  blocks: { type: string; content: string }[],
): Promise<MindMapNode> {
  const textContent = blocks
    .filter((b) => b.content.trim().length > 5)
    .map((b) => `[${b.type}] ${b.content}`)
    .join('\n');

  const prompt = `Génère une carte mentale (mind map) structurée à partir de ce contenu.

Titre : ${topicTitle}

Contenu :
${truncateContent(textContent, 6000)}

Crée une carte mentale avec :
- Un nœud central (le sujet principal)
- 3 à 6 branches principales
- 2 à 4 sous-branches par branche

Réponds en JSON :
{
  "id": "root",
  "label": "Sujet principal",
  "children": [
    {
      "id": "1",
      "label": "Branche 1",
      "children": [
        { "id": "1-1", "label": "Sous-point", "children": [] }
      ]
    }
  ]
}`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 3000,
  );
  return JSON.parse(raw) as MindMapNode;
}

// ─── 18. AI course plan from transcript ───

export async function generateCoursePlan(
  transcript: string,
  sourceTitle: string,
  sourceType: 'youtube' | 'pdf',
): Promise<{ title: string; sections: { title: string; description: string; blocks: { type: string; content: string; metadata?: Record<string, string> }[] }[] }> {
  const truncated = truncateContent(transcript, 10000);
  const prompt = `À partir de cette transcription ${sourceType === 'youtube' ? 'vidéo YouTube' : 'PDF'}, génère un plan de cours structuré complet.

Source : ${sourceTitle}

Transcription :
${truncated}

Crée un plan de cours avec 4 à 8 sections. Chaque section doit être une leçon complète avec des blocs structurés.

Réponds en JSON :
{
  "title": "Titre du cours",
  "sections": [
    {
      "title": "Leçon 1 : ...",
      "description": "Description de la leçon",
      "blocks": [
        { "type": "heading1", "content": "..." },
        { "type": "paragraph", "content": "..." },
        { "type": "bullet-list", "content": "Point 1\\nPoint 2" },
        { "type": "callout", "content": "Point important" }
      ]
    }
  ]
}

Types de blocs disponibles : heading1, heading2, heading3, paragraph, bullet-list, callout, reminder, source, definition, divider, verse, hadith, quote`;

  const hasOR = !!OPENROUTER_API_KEY;
  const callAI = (hasOR && transcript.length > 8000) ? callOpenRouter : callGroq;
  const raw = await callAI(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true,
    hasOR && transcript.length > 8000 ? undefined : 'llama-3.3-70b-versatile',
    3, 8000,
  );
  return JSON.parse(raw);
}

// ─── 19. Video quote extraction ───

export async function extractVideoQuotes(
  transcript: string,
  videoTitle: string,
): Promise<{ quotes: { text: string; context: string; percentPosition: number }[] }> {
  const sampled = sampleTranscript(transcript, 12000);
  const prompt = `Extrais les meilleures citations de cette vidéo "${videoTitle}".

Transcription :
${sampled}

Trouve les 5 à 10 citations les plus marquantes, inspirantes ou importantes de la vidéo.

Réponds en JSON :
{
  "quotes": [
    {
      "text": "Citation exacte tirée de la transcription",
      "context": "Court contexte de la citation (1 phrase)",
      "percentPosition": 25
    }
  ]
}

percentPosition = position approximative dans la vidéo (0-100).`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 3000,
  );
  return JSON.parse(raw);
}

// ─── 20. Hadith explanation (like tafsir) ───

export async function explainHadith(
  hadithText: string,
  source: string,
  grade?: string,
): Promise<string> {
  const prompt = `Hadith : "${hadithText}"
Source : ${source}
${grade ? `Grade : ${grade}` : ''}

Donne une explication complète de ce hadith en français :
1. Contexte du hadith (quand/pourquoi il a été rapporté)
2. Signification détaillée
3. Enseignements pratiques pour le musulman
4. Lien avec d'autres textes islamiques (versets, autres hadiths)

Réponds uniquement avec l'explication, sans titre ni introduction. Structure en paragraphes clairs.`;

  return callGroq(
    [
      {
        role: 'system',
        content: 'Tu es un spécialiste du hadith et de ses sciences. Tu fournis des explications claires, fidèles et basées sur les commentaires reconnus (Nawawi, Ibn Hajar, etc.). Réponds en français.',
      },
      { role: 'user', content: prompt },
    ],
    false, 'llama-3.3-70b-versatile', 2, 2000,
  );
}

// ─── 21. Isnad (chain of transmission) explanation ───

export async function explainIsnad(
  hadithText: string,
  chain: string,
): Promise<string> {
  const prompt = `Hadith : "${hadithText}"
Chaîne de transmission (isnad) : ${chain}

Explique cette chaîne de transmission en français de manière accessible :
1. Qui sont les transmetteurs principaux ?
2. Quelle est la fiabilité de cette chaîne ?
3. Comment les savants classent-ils cette transmission ?

Réponds de manière concise et pédagogique, sans titre.`;

  return callGroq(
    [
      {
        role: 'system',
        content: 'Tu es un spécialiste des sciences du hadith (mustalah al-hadith). Tu expliques les chaînes de transmission de manière accessible en français.',
      },
      { role: 'user', content: prompt },
    ],
    false, 'llama-3.1-8b-instant', 2, 1500,
  );
}

// ─── 22. Theme-based hadith search ───

export async function searchHadithByTheme(
  theme: string,
): Promise<{ keywords: string[]; suggestedCategories: string[] }> {
  const prompt = `L'utilisateur cherche des hadiths sur le thème : "${theme}"

Génère :
1. 5 mots-clés pertinents pour rechercher dans une base de hadiths
2. 3 catégories thématiques les plus pertinentes

Réponds en JSON :
{
  "keywords": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "suggestedCategories": ["catégorie1", "catégorie2", "catégorie3"]
}`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.1-8b-instant', 2, 500,
  );
  return JSON.parse(raw);
}

// ─── 23. Similar videos recommendation ───

export async function findSimilarVideos(
  currentVideo: { title: string; tags: string[]; channelName?: string },
  allVideos: { id: string; title: string; tags: string[]; channelName?: string }[],
): Promise<string[]> {
  if (allVideos.length === 0) return [];
  const videosList = allVideos.slice(0, 30).map((v) => `ID:${v.id} — "${v.title}" [${v.tags.join(', ')}]${v.channelName ? ` (${v.channelName})` : ''}`).join('\n');

  const prompt = `Vidéo actuelle : "${currentVideo.title}" [${currentVideo.tags.join(', ')}]${currentVideo.channelName ? ` (${currentVideo.channelName})` : ''}

Voici les autres vidéos de la bibliothèque :
${videosList}

Classe les 5 vidéos les plus similaires/pertinentes à la vidéo actuelle.

Réponds en JSON :
{ "similarIds": ["id1", "id2", "id3", "id4", "id5"] }`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.1-8b-instant', 2, 500,
  );
  const parsed = JSON.parse(raw);
  return (parsed.similarIds || []) as string[];
}

// ─── 24. Surah-level AI features ───

export type SurahQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type SurahFlashcard = {
  arabic: string;
  transliteration: string;
  meaning: string;
  context: string;
};

export type HifzPlanResult = {
  totalVerses: number;
  versesPerDay: number;
  advice: string;
  weeks: { week: number; verses: string; tip: string }[];
};

export async function generateSurahSummary(
  surahNumber: number,
  surahName: string,
  versesText: string,
): Promise<string> {
  const prompt = `Voici les versets de la sourate ${surahNumber} (${surahName}) :\n\n${versesText}\n\nRédige un résumé concis et pédagogique de cette sourate en français. Mentionne les thèmes principaux, le contexte de révélation si pertinent, et les leçons clés. Maximum 300 mots.`;

  return await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    false, 'llama-3.3-70b-versatile', 2, 1024,
  );
}

export async function generateSurahQuiz(
  surahNumber: number,
  surahName: string,
  versesText: string,
): Promise<SurahQuizQuestion[]> {
  const prompt = `Voici les versets de la sourate ${surahNumber} (${surahName}) :\n\n${versesText}\n\nGénère 5 questions de quiz à choix multiple basées UNIQUEMENT sur le contenu de ces versets.\n\nRéponds en JSON :\n[{ "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." }]`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 2048,
  );
  return JSON.parse(extractJsonArrayFromText(raw));
}

export async function generateSurahFlashcards(
  surahNumber: number,
  surahName: string,
  versesText: string,
): Promise<SurahFlashcard[]> {
  const prompt = `Voici les versets de la sourate ${surahNumber} (${surahName}) :\n\n${versesText}\n\nGénère 8 flashcards de vocabulaire/concepts clés tirés de ces versets.\n\nRéponds en JSON :\n[{ "arabic": "mot arabe", "transliteration": "translittération", "meaning": "sens en français", "context": "contexte dans la sourate" }]`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 2048,
  );
  return JSON.parse(extractJsonArrayFromText(raw));
}

export async function generateHifzPlan(
  surahNumber: number,
  surahName: string,
  totalVerses: number,
  weeks: number,
): Promise<HifzPlanResult> {
  const prompt = `Crée un plan de mémorisation (hifz) pour la sourate ${surahNumber} (${surahName}) qui contient ${totalVerses} versets, à réaliser en ${weeks} semaines.\n\nRéponds en JSON :\n{ "totalVerses": ${totalVerses}, "versesPerDay": <nombre>, "advice": "conseil général", "weeks": [{ "week": 1, "verses": "versets 1-10", "tip": "conseil pour cette semaine" }] }`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 1500,
  );
  return JSON.parse(extractJsonFromText(raw));
}

export async function generateThematicExplanation(
  query: string,
): Promise<{ introduction: string; verses: { surah: number; ayah: number; surahName: string; explanation: string }[]; conclusion: string }> {
  const prompt = `L'utilisateur recherche des versets coraniques sur le thème : "${query}".\n\nÀ partir de tes connaissances du Coran, trouve 3 à 5 versets pertinents et explique le lien avec le thème.\n\nRéponds en JSON :\n{ "introduction": "introduction du thème", "verses": [{ "surah": 2, "ayah": 255, "surahName": "Al-Baqara", "explanation": "explication du lien" }], "conclusion": "conclusion" }`;

  const raw = await callGroq(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    true, 'llama-3.3-70b-versatile', 2, 2048,
  );
  return JSON.parse(extractJsonFromText(raw));
}