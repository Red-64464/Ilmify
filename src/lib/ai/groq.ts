const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const OPENROUTER_PRIMARY_MODEL = 'qwen/qwen3.6-plus:free';           // Qwen 3.6 Plus — 1M context, meilleure qualité
const OPENROUTER_FALLBACK_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'; // Nemotron 120B — 262K, très fiable

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

const MAX_CONTENT_LENGTH = 6000;

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
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
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
): Promise<VideoAnalysis> {
  // Use OpenRouter (bigger model, more tokens) for long transcripts (>15k chars ≈ vidéos >30min)
  // Use Groq (faster) for short transcripts
  const isLong = transcript.length > 15000;
  const useOpenRouter = isLong && !!OPENROUTER_API_KEY;
  const callAI = useOpenRouter ? callOpenRouter : callGroq;

  // For long transcripts on OpenRouter, we can send much more context
  const maxInputChars = useOpenRouter ? 40000 : 12000;
  const sampled = sampleTranscript(transcript, maxInputChars);
  const context = `Titre : ${videoTitle}${channelName ? `\nChaîne : ${channelName}` : ''}\n\nTranscription :\n${sampled}`;

  // Call 1 : résumé court + synthèse + points clés
  const synthTarget = useOpenRouter ? '1500-2500 mots' : '600-900 mots';
  const keyPointsTarget = useOpenRouter ? '12 et 18 points' : '8 et 12 points';
  const textPrompt = `Analyse en profondeur cette vidéo et génère :
${context}

Réponds en JSON avec exactement ces 3 champs :
{
  "summary": "Résumé court de 3-5 phrases qui capture l'essentiel de la vidéo.",
  "synthesis": "Synthèse structurée (${synthTarget}) couvrant les principaux thèmes et arguments. Structure en paragraphes séparés par \\n\\n.",
  "keyPoints": ["Point essentiel 1", "Point essentiel 2", "... entre ${keyPointsTarget}"]
}`;

  const textRaw = await callAI(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: textPrompt }],
    true,
    useOpenRouter ? undefined : 'llama-3.3-70b-versatile',
    3,
    useOpenRouter ? 8000 : 4000,
  );
  const textParsed = JSON.parse(textRaw) as {
    summary?: string;
    synthesis?: string;
    keyPoints?: string[];
  };

  // Pause to avoid rate limit between the two large calls
  await new Promise(r => setTimeout(r, useOpenRouter ? 2000 : 5000));

  // Call 2 : blocs + chapitres + quiz
  const blocksInputChars = useOpenRouter ? 10000 : 4000;
  const blocksPrompt = `Génère pour cette vidéo islamique une note structurée, une table des matières et un quiz.

Titre : ${videoTitle}
Points clés : ${(textParsed.keyPoints ?? []).join(' | ')}
Transcription (extrait) :
${sampleTranscript(transcript, blocksInputChars)}

Réponds en JSON avec exactement ces 3 champs :
{
  "blocks": [...],
  "chapters": [...],
  "quizQuestions": [...]
}

RÈGLES pour les blocs (8-12 blocs) :
- Types : heading1, heading2, heading3, paragraph, bullet-list, callout, reminder, source, definition, divider, verse, hadith
- Commence par heading1 avec titre principal, organise par sections heading2
- Points importants en callout, termine par reminder
- Pour verse/hadith : metadata { "source": "...", "reference": "..." }

RÈGLES pour les chapitres (4-6 chapitres) :
- Identifie les grandes sections thématiques de la vidéo
- percentStart = position approximative 0-100 (0=début, 100=fin)
- Format : { "title": "Nom du chapitre", "percentStart": 0 }

RÈGLES pour le quiz (4-5 questions QCM) :
- 4 options par question, correctAnswer = index 0-3
- Basé UNIQUEMENT sur le contenu de la vidéo
- Format : { "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }`;

  const blocksRaw = await callAI(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: blocksPrompt }],
    true,
    useOpenRouter ? undefined : 'llama-3.1-8b-instant',
    3,
    useOpenRouter ? 6000 : 4500,
  );
  const blocksParsed = JSON.parse(blocksRaw) as {
    blocks?: { type: string; content: string; metadata?: Record<string, string> }[];
    chapters?: VideoChapter[];
    quizQuestions?: VideoQuizQuestion[];
  };

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