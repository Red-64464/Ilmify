// QuranEnc API + Quran.com API (for Arabic text & audio) + Al-Quran Cloud API

const QURANENC_BASE = 'https://quranenc.com/api/v1';
const QURAN_COM_BASE = 'https://api.quran.com/api/v4';
const ALQURAN_CLOUD_BASE = 'https://api.alquran.cloud/v1';

// --- Available reciters ---
export const RECITERS = [
  { id: 7, name: 'Mishary Rashid Alafasy', nameAr: 'مشاري راشد العفاسي', style: 'Murattal' },
  { id: 1, name: 'Abdul Basit Abdul Samad', nameAr: 'عبد الباسط عبد الصمد', style: 'Murattal' },
  { id: 4, name: 'Abu Bakr Al-Shatri', nameAr: 'أبو بكر الشاطري', style: 'Murattal' },
  { id: 6, name: 'Saad Al-Ghamdi', nameAr: 'سعد الغامدي', style: 'Murattal' },
];

// --- Surah metadata (local, lightweight) ---
export const SURAH_LIST: { number: number; name: string; nameAr: string; ayahCount: number; revelationType: 'Meccan' | 'Medinan'; juzStart: number }[] = [
  { number: 1, name: 'Al-Fatiha', nameAr: 'الفاتحة', ayahCount: 7, revelationType: 'Meccan', juzStart: 1 },
  { number: 2, name: 'Al-Baqarah', nameAr: 'البقرة', ayahCount: 286, revelationType: 'Medinan', juzStart: 1 },
  { number: 3, name: 'Ali \'Imran', nameAr: 'آل عمران', ayahCount: 200, revelationType: 'Medinan', juzStart: 3 },
  { number: 4, name: 'An-Nisa', nameAr: 'النساء', ayahCount: 176, revelationType: 'Medinan', juzStart: 4 },
  { number: 5, name: 'Al-Ma\'idah', nameAr: 'المائدة', ayahCount: 120, revelationType: 'Medinan', juzStart: 6 },
  { number: 6, name: 'Al-An\'am', nameAr: 'الأنعام', ayahCount: 165, revelationType: 'Meccan', juzStart: 7 },
  { number: 7, name: 'Al-A\'raf', nameAr: 'الأعراف', ayahCount: 206, revelationType: 'Meccan', juzStart: 8 },
  { number: 8, name: 'Al-Anfal', nameAr: 'الأنفال', ayahCount: 75, revelationType: 'Medinan', juzStart: 9 },
  { number: 9, name: 'At-Tawbah', nameAr: 'التوبة', ayahCount: 129, revelationType: 'Medinan', juzStart: 10 },
  { number: 10, name: 'Yunus', nameAr: 'يونس', ayahCount: 109, revelationType: 'Meccan', juzStart: 11 },
  { number: 11, name: 'Hud', nameAr: 'هود', ayahCount: 123, revelationType: 'Meccan', juzStart: 11 },
  { number: 12, name: 'Yusuf', nameAr: 'يوسف', ayahCount: 111, revelationType: 'Meccan', juzStart: 12 },
  { number: 13, name: 'Ar-Ra\'d', nameAr: 'الرعد', ayahCount: 43, revelationType: 'Medinan', juzStart: 13 },
  { number: 14, name: 'Ibrahim', nameAr: 'إبراهيم', ayahCount: 52, revelationType: 'Meccan', juzStart: 13 },
  { number: 15, name: 'Al-Hijr', nameAr: 'الحجر', ayahCount: 99, revelationType: 'Meccan', juzStart: 14 },
  { number: 16, name: 'An-Nahl', nameAr: 'النحل', ayahCount: 128, revelationType: 'Meccan', juzStart: 14 },
  { number: 17, name: 'Al-Isra', nameAr: 'الإسراء', ayahCount: 111, revelationType: 'Meccan', juzStart: 15 },
  { number: 18, name: 'Al-Kahf', nameAr: 'الكهف', ayahCount: 110, revelationType: 'Meccan', juzStart: 15 },
  { number: 19, name: 'Maryam', nameAr: 'مريم', ayahCount: 98, revelationType: 'Meccan', juzStart: 16 },
  { number: 20, name: 'Ta-Ha', nameAr: 'طه', ayahCount: 135, revelationType: 'Meccan', juzStart: 16 },
  { number: 21, name: 'Al-Anbiya', nameAr: 'الأنبياء', ayahCount: 112, revelationType: 'Meccan', juzStart: 17 },
  { number: 22, name: 'Al-Hajj', nameAr: 'الحج', ayahCount: 78, revelationType: 'Medinan', juzStart: 17 },
  { number: 23, name: 'Al-Mu\'minun', nameAr: 'المؤمنون', ayahCount: 118, revelationType: 'Meccan', juzStart: 18 },
  { number: 24, name: 'An-Nur', nameAr: 'النور', ayahCount: 64, revelationType: 'Medinan', juzStart: 18 },
  { number: 25, name: 'Al-Furqan', nameAr: 'الفرقان', ayahCount: 77, revelationType: 'Meccan', juzStart: 18 },
  { number: 26, name: 'Ash-Shu\'ara', nameAr: 'الشعراء', ayahCount: 227, revelationType: 'Meccan', juzStart: 19 },
  { number: 27, name: 'An-Naml', nameAr: 'النمل', ayahCount: 93, revelationType: 'Meccan', juzStart: 19 },
  { number: 28, name: 'Al-Qasas', nameAr: 'القصص', ayahCount: 88, revelationType: 'Meccan', juzStart: 20 },
  { number: 29, name: 'Al-Ankabut', nameAr: 'العنكبوت', ayahCount: 69, revelationType: 'Meccan', juzStart: 20 },
  { number: 30, name: 'Ar-Rum', nameAr: 'الروم', ayahCount: 60, revelationType: 'Meccan', juzStart: 21 },
  { number: 31, name: 'Luqman', nameAr: 'لقمان', ayahCount: 34, revelationType: 'Meccan', juzStart: 21 },
  { number: 32, name: 'As-Sajdah', nameAr: 'السجدة', ayahCount: 30, revelationType: 'Meccan', juzStart: 21 },
  { number: 33, name: 'Al-Ahzab', nameAr: 'الأحزاب', ayahCount: 73, revelationType: 'Medinan', juzStart: 21 },
  { number: 34, name: 'Saba', nameAr: 'سبأ', ayahCount: 54, revelationType: 'Meccan', juzStart: 22 },
  { number: 35, name: 'Fatir', nameAr: 'فاطر', ayahCount: 45, revelationType: 'Meccan', juzStart: 22 },
  { number: 36, name: 'Ya-Sin', nameAr: 'يس', ayahCount: 83, revelationType: 'Meccan', juzStart: 22 },
  { number: 37, name: 'As-Saffat', nameAr: 'الصافات', ayahCount: 182, revelationType: 'Meccan', juzStart: 23 },
  { number: 38, name: 'Sad', nameAr: 'ص', ayahCount: 88, revelationType: 'Meccan', juzStart: 23 },
  { number: 39, name: 'Az-Zumar', nameAr: 'الزمر', ayahCount: 75, revelationType: 'Meccan', juzStart: 23 },
  { number: 40, name: 'Ghafir', nameAr: 'غافر', ayahCount: 85, revelationType: 'Meccan', juzStart: 24 },
  { number: 41, name: 'Fussilat', nameAr: 'فصلت', ayahCount: 54, revelationType: 'Meccan', juzStart: 24 },
  { number: 42, name: 'Ash-Shura', nameAr: 'الشورى', ayahCount: 53, revelationType: 'Meccan', juzStart: 25 },
  { number: 43, name: 'Az-Zukhruf', nameAr: 'الزخرف', ayahCount: 89, revelationType: 'Meccan', juzStart: 25 },
  { number: 44, name: 'Ad-Dukhan', nameAr: 'الدخان', ayahCount: 59, revelationType: 'Meccan', juzStart: 25 },
  { number: 45, name: 'Al-Jathiyah', nameAr: 'الجاثية', ayahCount: 37, revelationType: 'Meccan', juzStart: 25 },
  { number: 46, name: 'Al-Ahqaf', nameAr: 'الأحقاف', ayahCount: 35, revelationType: 'Meccan', juzStart: 26 },
  { number: 47, name: 'Muhammad', nameAr: 'محمد', ayahCount: 38, revelationType: 'Medinan', juzStart: 26 },
  { number: 48, name: 'Al-Fath', nameAr: 'الفتح', ayahCount: 29, revelationType: 'Medinan', juzStart: 26 },
  { number: 49, name: 'Al-Hujurat', nameAr: 'الحجرات', ayahCount: 18, revelationType: 'Medinan', juzStart: 26 },
  { number: 50, name: 'Qaf', nameAr: 'ق', ayahCount: 45, revelationType: 'Meccan', juzStart: 26 },
  { number: 51, name: 'Adh-Dhariyat', nameAr: 'الذاريات', ayahCount: 60, revelationType: 'Meccan', juzStart: 26 },
  { number: 52, name: 'At-Tur', nameAr: 'الطور', ayahCount: 49, revelationType: 'Meccan', juzStart: 27 },
  { number: 53, name: 'An-Najm', nameAr: 'النجم', ayahCount: 62, revelationType: 'Meccan', juzStart: 27 },
  { number: 54, name: 'Al-Qamar', nameAr: 'القمر', ayahCount: 55, revelationType: 'Meccan', juzStart: 27 },
  { number: 55, name: 'Ar-Rahman', nameAr: 'الرحمن', ayahCount: 78, revelationType: 'Meccan', juzStart: 27 },
  { number: 56, name: 'Al-Waqi\'ah', nameAr: 'الواقعة', ayahCount: 96, revelationType: 'Meccan', juzStart: 27 },
  { number: 57, name: 'Al-Hadid', nameAr: 'الحديد', ayahCount: 29, revelationType: 'Medinan', juzStart: 27 },
  { number: 58, name: 'Al-Mujadila', nameAr: 'المجادلة', ayahCount: 22, revelationType: 'Medinan', juzStart: 28 },
  { number: 59, name: 'Al-Hashr', nameAr: 'الحشر', ayahCount: 24, revelationType: 'Medinan', juzStart: 28 },
  { number: 60, name: 'Al-Mumtahanah', nameAr: 'الممتحنة', ayahCount: 13, revelationType: 'Medinan', juzStart: 28 },
  { number: 61, name: 'As-Saff', nameAr: 'الصف', ayahCount: 14, revelationType: 'Medinan', juzStart: 28 },
  { number: 62, name: 'Al-Jumu\'ah', nameAr: 'الجمعة', ayahCount: 11, revelationType: 'Medinan', juzStart: 28 },
  { number: 63, name: 'Al-Munafiqun', nameAr: 'المنافقون', ayahCount: 11, revelationType: 'Medinan', juzStart: 28 },
  { number: 64, name: 'At-Taghabun', nameAr: 'التغابن', ayahCount: 18, revelationType: 'Medinan', juzStart: 28 },
  { number: 65, name: 'At-Talaq', nameAr: 'الطلاق', ayahCount: 12, revelationType: 'Medinan', juzStart: 28 },
  { number: 66, name: 'At-Tahrim', nameAr: 'التحريم', ayahCount: 12, revelationType: 'Medinan', juzStart: 28 },
  { number: 67, name: 'Al-Mulk', nameAr: 'الملك', ayahCount: 30, revelationType: 'Meccan', juzStart: 29 },
  { number: 68, name: 'Al-Qalam', nameAr: 'القلم', ayahCount: 52, revelationType: 'Meccan', juzStart: 29 },
  { number: 69, name: 'Al-Haqqah', nameAr: 'الحاقة', ayahCount: 52, revelationType: 'Meccan', juzStart: 29 },
  { number: 70, name: 'Al-Ma\'arij', nameAr: 'المعارج', ayahCount: 44, revelationType: 'Meccan', juzStart: 29 },
  { number: 71, name: 'Nuh', nameAr: 'نوح', ayahCount: 28, revelationType: 'Meccan', juzStart: 29 },
  { number: 72, name: 'Al-Jinn', nameAr: 'الجن', ayahCount: 28, revelationType: 'Meccan', juzStart: 29 },
  { number: 73, name: 'Al-Muzzammil', nameAr: 'المزمل', ayahCount: 20, revelationType: 'Meccan', juzStart: 29 },
  { number: 74, name: 'Al-Muddaththir', nameAr: 'المدثر', ayahCount: 56, revelationType: 'Meccan', juzStart: 29 },
  { number: 75, name: 'Al-Qiyamah', nameAr: 'القيامة', ayahCount: 40, revelationType: 'Meccan', juzStart: 29 },
  { number: 76, name: 'Al-Insan', nameAr: 'الإنسان', ayahCount: 31, revelationType: 'Medinan', juzStart: 29 },
  { number: 77, name: 'Al-Mursalat', nameAr: 'المرسلات', ayahCount: 50, revelationType: 'Meccan', juzStart: 29 },
  { number: 78, name: 'An-Naba', nameAr: 'النبأ', ayahCount: 40, revelationType: 'Meccan', juzStart: 30 },
  { number: 79, name: 'An-Nazi\'at', nameAr: 'النازعات', ayahCount: 46, revelationType: 'Meccan', juzStart: 30 },
  { number: 80, name: 'Abasa', nameAr: 'عبس', ayahCount: 42, revelationType: 'Meccan', juzStart: 30 },
  { number: 81, name: 'At-Takwir', nameAr: 'التكوير', ayahCount: 29, revelationType: 'Meccan', juzStart: 30 },
  { number: 82, name: 'Al-Infitar', nameAr: 'الانفطار', ayahCount: 19, revelationType: 'Meccan', juzStart: 30 },
  { number: 83, name: 'Al-Mutaffifin', nameAr: 'المطففين', ayahCount: 36, revelationType: 'Meccan', juzStart: 30 },
  { number: 84, name: 'Al-Inshiqaq', nameAr: 'الانشقاق', ayahCount: 25, revelationType: 'Meccan', juzStart: 30 },
  { number: 85, name: 'Al-Buruj', nameAr: 'البروج', ayahCount: 22, revelationType: 'Meccan', juzStart: 30 },
  { number: 86, name: 'At-Tariq', nameAr: 'الطارق', ayahCount: 17, revelationType: 'Meccan', juzStart: 30 },
  { number: 87, name: 'Al-A\'la', nameAr: 'الأعلى', ayahCount: 19, revelationType: 'Meccan', juzStart: 30 },
  { number: 88, name: 'Al-Ghashiyah', nameAr: 'الغاشية', ayahCount: 26, revelationType: 'Meccan', juzStart: 30 },
  { number: 89, name: 'Al-Fajr', nameAr: 'الفجر', ayahCount: 30, revelationType: 'Meccan', juzStart: 30 },
  { number: 90, name: 'Al-Balad', nameAr: 'البلد', ayahCount: 20, revelationType: 'Meccan', juzStart: 30 },
  { number: 91, name: 'Ash-Shams', nameAr: 'الشمس', ayahCount: 15, revelationType: 'Meccan', juzStart: 30 },
  { number: 92, name: 'Al-Layl', nameAr: 'الليل', ayahCount: 21, revelationType: 'Meccan', juzStart: 30 },
  { number: 93, name: 'Ad-Duha', nameAr: 'الضحى', ayahCount: 11, revelationType: 'Meccan', juzStart: 30 },
  { number: 94, name: 'Ash-Sharh', nameAr: 'الشرح', ayahCount: 8, revelationType: 'Meccan', juzStart: 30 },
  { number: 95, name: 'At-Tin', nameAr: 'التين', ayahCount: 8, revelationType: 'Meccan', juzStart: 30 },
  { number: 96, name: 'Al-Alaq', nameAr: 'العلق', ayahCount: 19, revelationType: 'Meccan', juzStart: 30 },
  { number: 97, name: 'Al-Qadr', nameAr: 'القدر', ayahCount: 5, revelationType: 'Meccan', juzStart: 30 },
  { number: 98, name: 'Al-Bayyinah', nameAr: 'البينة', ayahCount: 8, revelationType: 'Medinan', juzStart: 30 },
  { number: 99, name: 'Az-Zalzalah', nameAr: 'الزلزلة', ayahCount: 8, revelationType: 'Medinan', juzStart: 30 },
  { number: 100, name: 'Al-Adiyat', nameAr: 'العاديات', ayahCount: 11, revelationType: 'Meccan', juzStart: 30 },
  { number: 101, name: 'Al-Qari\'ah', nameAr: 'القارعة', ayahCount: 11, revelationType: 'Meccan', juzStart: 30 },
  { number: 102, name: 'At-Takathur', nameAr: 'التكاثر', ayahCount: 8, revelationType: 'Meccan', juzStart: 30 },
  { number: 103, name: 'Al-Asr', nameAr: 'العصر', ayahCount: 3, revelationType: 'Meccan', juzStart: 30 },
  { number: 104, name: 'Al-Humazah', nameAr: 'الهمزة', ayahCount: 9, revelationType: 'Meccan', juzStart: 30 },
  { number: 105, name: 'Al-Fil', nameAr: 'الفيل', ayahCount: 5, revelationType: 'Meccan', juzStart: 30 },
  { number: 106, name: 'Quraysh', nameAr: 'قريش', ayahCount: 4, revelationType: 'Meccan', juzStart: 30 },
  { number: 107, name: 'Al-Ma\'un', nameAr: 'الماعون', ayahCount: 7, revelationType: 'Meccan', juzStart: 30 },
  { number: 108, name: 'Al-Kawthar', nameAr: 'الكوثر', ayahCount: 3, revelationType: 'Meccan', juzStart: 30 },
  { number: 109, name: 'Al-Kafirun', nameAr: 'الكافرون', ayahCount: 6, revelationType: 'Meccan', juzStart: 30 },
  { number: 110, name: 'An-Nasr', nameAr: 'النصر', ayahCount: 3, revelationType: 'Medinan', juzStart: 30 },
  { number: 111, name: 'Al-Masad', nameAr: 'المسد', ayahCount: 5, revelationType: 'Meccan', juzStart: 30 },
  { number: 112, name: 'Al-Ikhlas', nameAr: 'الإخلاص', ayahCount: 4, revelationType: 'Meccan', juzStart: 30 },
  { number: 113, name: 'Al-Falaq', nameAr: 'الفلق', ayahCount: 5, revelationType: 'Meccan', juzStart: 30 },
  { number: 114, name: 'An-Nas', nameAr: 'الناس', ayahCount: 6, revelationType: 'Meccan', juzStart: 30 },
];

// --- QuranEnc: get verse translation ---
export interface QuranEncVerse {
  sura: number;
  aya: number;
  translation: string;
  footnotes: string;
}

export async function getVerseTranslation(
  surah: number,
  ayah: number,
  translationKey = 'french_hameedullah'
): Promise<QuranEncVerse> {
  const res = await fetch(
    `${QURANENC_BASE}/translation/aya/${encodeURIComponent(translationKey)}/${surah}/${ayah}`
  );
  if (!res.ok) throw new Error(`QuranEnc API error: ${res.status}`);
  const data = await res.json();
  // API wraps response in { result: { ... } }
  return data.result || data;
}

export async function getSurahTranslation(
  surah: number,
  translationKey = 'french_hameedullah'
): Promise<QuranEncVerse[]> {
  const res = await fetch(
    `${QURANENC_BASE}/translation/sura/${encodeURIComponent(translationKey)}/${surah}`
  );
  if (!res.ok) throw new Error(`QuranEnc API error: ${res.status}`);
  const data = await res.json();
  return data.result || data;
}

// --- Quran.com: get Arabic text ---
export interface QuranComVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

export async function getArabicVerse(surah: number, ayah: number): Promise<string> {
  const res = await fetch(
    `${QURAN_COM_BASE}/quran/verses/uthmani?verse_key=${surah}:${ayah}`
  );
  if (!res.ok) throw new Error(`Quran.com API error: ${res.status}`);
  const data = await res.json();
  return data.verses?.[0]?.text_uthmani || '';
}

export async function getArabicSurah(surah: number): Promise<QuranComVerse[]> {
  const res = await fetch(
    `${QURAN_COM_BASE}/quran/verses/uthmani?chapter_number=${surah}`
  );
  if (!res.ok) throw new Error(`Quran.com API error: ${res.status}`);
  const data = await res.json();
  return data.verses || [];
}

// --- Reciter slug mapping for cdn.islamic.network ---
const RECITER_SLUGS: Record<number, string> = {
  7: 'ar.alafasy',
  1: 'ar.abdulbasitmurattal',
  4: 'ar.shaatree',
  6: 'ar.saoodshuraym',
};

// --- Quran.com: get audio URL ---
export function getAudioUrl(surah: number, ayah: number, reciterId = 7): string {
  const slug = RECITER_SLUGS[reciterId] || 'ar.alafasy';
  return `https://cdn.islamic.network/quran/audio/128/${slug}/${getAbsoluteAyahNumber(surah, ayah)}.mp3`;
}

// Helper: convert surah:ayah to absolute ayah number
function getAbsoluteAyahNumber(surah: number, ayah: number): number {
  let total = 0;
  for (let i = 0; i < surah - 1; i++) {
    total += SURAH_LIST[i].ayahCount;
  }
  return total + ayah;
}

// Audio from Quran.com API (verse audio)
export async function getVerseAudio(surah: number, ayah: number, recitationId = 7): Promise<string> {
  const res = await fetch(
    `${QURAN_COM_BASE}/recitations/${recitationId}/by_ayah/${surah}:${ayah}`
  );
  if (!res.ok) {
    // Fallback to constructed URL
    return getAudioUrl(surah, ayah, recitationId);
  }
  const data = await res.json();
  const audioFile = data.audio_files?.[0];
  if (audioFile?.url) {
    return audioFile.url.startsWith('http') ? audioFile.url : `https://audio.qurancdn.com/${audioFile.url}`;
  }
  return getAudioUrl(surah, ayah, recitationId);
}

// --- Al-Quran Cloud: get transliteration for a surah ---
export interface AlQuranAyah {
  number: number;
  text: string;
  numberInSurah: number;
}

export async function getTransliteration(surah: number): Promise<AlQuranAyah[]> {
  const res = await fetch(`${ALQURAN_CLOUD_BASE}/surah/${surah}/en.transliteration`);
  if (!res.ok) throw new Error(`Al-Quran Cloud API error: ${res.status}`);
  const data = await res.json();
  return data.data?.ayahs || [];
}

// --- Al-Quran Cloud: get surah info/metadata ---
export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export async function getSurahInfo(surah: number): Promise<SurahInfo> {
  const res = await fetch(`${ALQURAN_CLOUD_BASE}/surah/${surah}`);
  if (!res.ok) throw new Error(`Al-Quran Cloud API error: ${res.status}`);
  const data = await res.json();
  return data.data;
}

// --- Juz mapping (local data) ---
export interface JuzInfo {
  juzNumber: number;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  surahs: number[];
}

export function getJuzMapping(): JuzInfo[] {
  return [
    { juzNumber: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141, surahs: [1, 2] },
    { juzNumber: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252, surahs: [2] },
    { juzNumber: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92, surahs: [2, 3] },
    { juzNumber: 4, startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23, surahs: [3, 4] },
    { juzNumber: 5, startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147, surahs: [4] },
    { juzNumber: 6, startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81, surahs: [4, 5] },
    { juzNumber: 7, startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110, surahs: [5, 6] },
    { juzNumber: 8, startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87, surahs: [6, 7] },
    { juzNumber: 9, startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40, surahs: [7, 8] },
    { juzNumber: 10, startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92, surahs: [8, 9] },
    { juzNumber: 11, startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5, surahs: [9, 10, 11] },
    { juzNumber: 12, startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52, surahs: [11, 12] },
    { juzNumber: 13, startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52, surahs: [12, 13, 14] },
    { juzNumber: 14, startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128, surahs: [15, 16] },
    { juzNumber: 15, startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74, surahs: [17, 18] },
    { juzNumber: 16, startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135, surahs: [18, 19, 20] },
    { juzNumber: 17, startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78, surahs: [21, 22] },
    { juzNumber: 18, startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20, surahs: [23, 24, 25] },
    { juzNumber: 19, startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55, surahs: [25, 26, 27] },
    { juzNumber: 20, startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45, surahs: [27, 28, 29] },
    { juzNumber: 21, startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30, surahs: [29, 30, 31, 32, 33] },
    { juzNumber: 22, startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27, surahs: [33, 34, 35, 36] },
    { juzNumber: 23, startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31, surahs: [36, 37, 38, 39] },
    { juzNumber: 24, startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46, surahs: [39, 40, 41] },
    { juzNumber: 25, startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37, surahs: [41, 42, 43, 44, 45] },
    { juzNumber: 26, startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30, surahs: [46, 47, 48, 49, 50, 51] },
    { juzNumber: 27, startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29, surahs: [51, 52, 53, 54, 55, 56, 57] },
    { juzNumber: 28, startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12, surahs: [58, 59, 60, 61, 62, 63, 64, 65, 66] },
    { juzNumber: 29, startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50, surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77] },
    { juzNumber: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6, surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] },
  ];
}

// --- Quran.com: get tafsir for a verse ---
export async function getTafsir(surah: number, ayah: number, tafsirId = 169): Promise<string> {
  try {
    const res = await fetch(
      `${QURAN_COM_BASE}/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data.tafsir?.text || '';
  } catch {
    return '';
  }
}

// --- Quran.com: get surah audio (full surah by reciter) ---
export async function getSurahAudio(surah: number, reciterId = 7): Promise<string[]> {
  try {
    const res = await fetch(
      `${QURAN_COM_BASE}/recitations/${reciterId}/by_chapter/${surah}`
    );
    if (!res.ok) throw new Error(`Quran.com API error: ${res.status}`);
    const data = await res.json();
    return (data.audio_files || []).map((f: { url: string }) =>
      f.url.startsWith('http') ? f.url : `https://audio.qurancdn.com/${f.url}`
    );
  } catch {
    // Fallback: build URLs from CDN
    const surahData = SURAH_LIST.find((s) => s.number === surah);
    if (!surahData) return [];
    return Array.from({ length: surahData.ayahCount }, (_, i) =>
      getAudioUrl(surah, i + 1, reciterId)
    );
  }
}

// --- Translation key mapping for QuranEnc ---
const TRANSLATION_KEYS: Record<string, string> = {
  fr: 'french_hameedullah',
  en: 'english_saheeh',
};

export function getTranslationKey(lang: 'fr' | 'en' = 'fr'): string {
  return TRANSLATION_KEYS[lang] || TRANSLATION_KEYS.fr;
}

// --- Quran.com: full-text search ---
export interface QuranSearchResult {
  verseKey: string;
  surah: number;
  ayah: number;
  text: string;
  highlightedText: string;
  surahName: string;
  surahNameAr: string;
}

export async function searchQuran(query: string, language = 'fr', page = 1): Promise<{ results: QuranSearchResult[]; totalResults: number; totalPages: number }> {
  try {
    const langCode = language === 'fr' ? 45 : 131; // QuranEnc resource IDs for translations
    const res = await fetch(
      `${QURAN_COM_BASE}/search?q=${encodeURIComponent(query)}&size=20&page=${page}&language=${langCode}`
    );
    if (!res.ok) throw new Error(`Search API error: ${res.status}`);
    const data = await res.json();
    const results: QuranSearchResult[] = (data.search?.results || []).map((r: { verse_key: string; text: string; highlighted?: string }) => {
      const [s, a] = r.verse_key.split(':').map(Number);
      const surahInfo = SURAH_LIST[s - 1];
      return {
        verseKey: r.verse_key,
        surah: s,
        ayah: a,
        text: r.text,
        highlightedText: r.highlighted || r.text,
        surahName: surahInfo?.name || `Sourate ${s}`,
        surahNameAr: surahInfo?.nameAr || '',
      };
    });
    return {
      results,
      totalResults: data.search?.total_results || 0,
      totalPages: data.search?.total_pages || 0,
    };
  } catch {
    return { results: [], totalResults: 0, totalPages: 0 };
  }
}
