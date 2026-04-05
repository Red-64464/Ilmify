// Sunnah.com API client (proxied through Netlify Function)

const PROXY_BASE = '/.netlify/functions/sunnah-proxy';

async function sunnahFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ path, ...params });
  const res = await fetch(`${PROXY_BASE}?${qs.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 503 && body?.error?.includes('not configured')) {
      throw new Error('SUNNAH_API_KEY_MISSING');
    }
    throw new Error(`Sunnah.com API error: ${res.status}`);
  }
  return res.json();
}

// --- Types ---

export interface SunnahCollection {
  name: string;
  hasBooks: boolean;
  hasChapters: boolean;
  collection: { lang: string; title: string; shortIntro: string }[];
  totalHadith: number;
  totalAvailableHadith: number;
}

export interface SunnahBook {
  bookNumber: string;
  book: { lang: string; name: string }[];
  hadithStartNumber: number;
  hadithEndNumber: number;
  numberOfHadith: number;
}

export interface SunnahHadith {
  collection: string;
  bookNumber: string;
  chapterId: string;
  hadithNumber: string;
  hadith: {
    lang: string;
    chapterNumber: string;
    chapterTitle: string;
    urn: number;
    body: string;
    grades: { graded_by: string; grade: string }[];
  }[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  previous: number | null;
  next: number | null;
}

// --- Endpoints ---

export async function getCollections(): Promise<SunnahCollection[]> {
  const res = await sunnahFetch<PaginatedResponse<SunnahCollection>>('/collections', { limit: '100' });
  return res.data;
}

export async function getBooks(collectionName: string): Promise<SunnahBook[]> {
  const res = await sunnahFetch<PaginatedResponse<SunnahBook>>(
    `/collections/${encodeURIComponent(collectionName)}/books`,
    { limit: '100' }
  );
  return res.data;
}

export async function getHadithsByBook(
  collectionName: string,
  bookNumber: string,
  page = 1,
  limit = 30
): Promise<PaginatedResponse<SunnahHadith>> {
  return sunnahFetch<PaginatedResponse<SunnahHadith>>(
    `/collections/${encodeURIComponent(collectionName)}/books/${encodeURIComponent(bookNumber)}/hadiths`,
    { page: String(page), limit: String(limit) }
  );
}

export async function getHadith(
  collectionName: string,
  hadithNumber: string
): Promise<SunnahHadith> {
  return sunnahFetch<SunnahHadith>(
    `/collections/${encodeURIComponent(collectionName)}/hadiths/${encodeURIComponent(hadithNumber)}`
  );
}

export async function getRandomHadith(): Promise<SunnahHadith> {
  return sunnahFetch<SunnahHadith>('/hadiths/random');
}

// Helper: extract body text for a preferred language
export function getHadithBody(hadith: SunnahHadith, lang = 'en'): string {
  const match = hadith.hadith.find((h) => h.lang === lang) || hadith.hadith[0];
  return match?.body || '';
}

// Helper: extract grades
export function getHadithGrades(hadith: SunnahHadith, lang = 'en'): string {
  const match = hadith.hadith.find((h) => h.lang === lang) || hadith.hadith[0];
  return match?.grades?.map((g) => `${g.grade} (${g.graded_by})`).join(', ') || '';
}

// Helper: extract chapter title
export function getChapterTitle(hadith: SunnahHadith, lang = 'en'): string {
  const match = hadith.hadith.find((h) => h.lang === lang) || hadith.hadith[0];
  return match?.chapterTitle || '';
}
