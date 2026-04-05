// HadeethEnc API

const HADEETHENC_BASE = 'https://hadeethenc.com/api/v1';

export interface HadeethCategory {
  id: string;
  title: string;
  hadeeths_count: string;
  parent_id: string | null;
}

export interface HadeethListItem {
  id: string;
  title: string;
  translations: string[];
}

export interface HadeethDetail {
  id: string;
  title: string;
  hadeeth: string;
  attribution: string;
  grade: string;
  explanation: string;
  hints: string[];
  categories: string[];
  translations: string[];
  words_meanings: { word: string; meaning: string }[];
  reference: string;
}

// Get root categories
export async function getRootCategories(language = 'fr'): Promise<HadeethCategory[]> {
  const res = await fetch(
    `${HADEETHENC_BASE}/categories/roots/?language=${encodeURIComponent(language)}`
  );
  if (!res.ok) throw new Error(`HadeethEnc API error: ${res.status}`);
  return res.json();
}

// Get all categories
export async function getCategories(language = 'fr'): Promise<HadeethCategory[]> {
  const res = await fetch(
    `${HADEETHENC_BASE}/categories/list/?language=${encodeURIComponent(language)}`
  );
  if (!res.ok) throw new Error(`HadeethEnc API error: ${res.status}`);
  return res.json();
}

// Get hadiths list by category
export async function getHadithsByCategory(
  categoryId: string,
  language = 'fr',
  page = 1,
  perPage = 20
): Promise<{ data: HadeethListItem[] }> {
  const res = await fetch(
    `${HADEETHENC_BASE}/hadeeths/list/?language=${encodeURIComponent(language)}&category_id=${encodeURIComponent(categoryId)}&page=${page}&per_page=${perPage}`
  );
  if (!res.ok) throw new Error(`HadeethEnc API error: ${res.status}`);
  const data = await res.json();
  // API returns array directly or { data: [] }
  if (Array.isArray(data)) return { data };
  return data;
}

// Get single hadith detail
export async function getHadithDetail(
  hadithId: string,
  language = 'fr'
): Promise<HadeethDetail> {
  const res = await fetch(
    `${HADEETHENC_BASE}/hadeeths/one/?language=${encodeURIComponent(language)}&id=${encodeURIComponent(hadithId)}`
  );
  if (!res.ok) throw new Error(`HadeethEnc API error: ${res.status}`);
  return res.json();
}
