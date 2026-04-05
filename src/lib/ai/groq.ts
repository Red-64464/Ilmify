const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

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

async function callGroq(
  messages: GroqMessage[],
  json = false,
  model = 'llama-3.3-70b-versatile',
  retries = 3,
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('Clé API Groq non configurée. Ajoutez NEXT_PUBLIC_GROQ_API_KEY dans .env.local');

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  };
  if (json) body.response_format = { type: 'json_object' };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        // Don't retry on auth errors (401/403) or bad request (400)
        if (res.status === 401 || res.status === 403 || res.status === 400) {
          throw new Error(`Erreur Groq (${res.status}): ${err.slice(0, 200)}`);
        }
        throw new Error(`Erreur Groq (${res.status}): ${err.slice(0, 200)}`);
      }

      const data = await res.json();
      return (data.choices as GroqChoice[])[0].message.content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry on non-retryable errors
      if (lastError.message.includes('(401)') || lastError.message.includes('(403)') || lastError.message.includes('(400)')) {
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
