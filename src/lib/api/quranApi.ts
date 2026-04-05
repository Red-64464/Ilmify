// QuranEnc API + Quran.com API (for Arabic text & audio)

const QURANENC_BASE = 'https://quranenc.com/api/v1';
const QURAN_COM_BASE = 'https://api.quran.com/api/v4';

// --- Surah metadata (local, lightweight) ---
export const SURAH_LIST: { number: number; name: string; nameAr: string; ayahCount: number }[] = [
  { number: 1, name: 'Al-Fatiha', nameAr: 'الفاتحة', ayahCount: 7 },
  { number: 2, name: 'Al-Baqarah', nameAr: 'البقرة', ayahCount: 286 },
  { number: 3, name: 'Ali \'Imran', nameAr: 'آل عمران', ayahCount: 200 },
  { number: 4, name: 'An-Nisa', nameAr: 'النساء', ayahCount: 176 },
  { number: 5, name: 'Al-Ma\'idah', nameAr: 'المائدة', ayahCount: 120 },
  { number: 6, name: 'Al-An\'am', nameAr: 'الأنعام', ayahCount: 165 },
  { number: 7, name: 'Al-A\'raf', nameAr: 'الأعراف', ayahCount: 206 },
  { number: 8, name: 'Al-Anfal', nameAr: 'الأنفال', ayahCount: 75 },
  { number: 9, name: 'At-Tawbah', nameAr: 'التوبة', ayahCount: 129 },
  { number: 10, name: 'Yunus', nameAr: 'يونس', ayahCount: 109 },
  { number: 11, name: 'Hud', nameAr: 'هود', ayahCount: 123 },
  { number: 12, name: 'Yusuf', nameAr: 'يوسف', ayahCount: 111 },
  { number: 13, name: 'Ar-Ra\'d', nameAr: 'الرعد', ayahCount: 43 },
  { number: 14, name: 'Ibrahim', nameAr: 'إبراهيم', ayahCount: 52 },
  { number: 15, name: 'Al-Hijr', nameAr: 'الحجر', ayahCount: 99 },
  { number: 16, name: 'An-Nahl', nameAr: 'النحل', ayahCount: 128 },
  { number: 17, name: 'Al-Isra', nameAr: 'الإسراء', ayahCount: 111 },
  { number: 18, name: 'Al-Kahf', nameAr: 'الكهف', ayahCount: 110 },
  { number: 19, name: 'Maryam', nameAr: 'مريم', ayahCount: 98 },
  { number: 20, name: 'Ta-Ha', nameAr: 'طه', ayahCount: 135 },
  { number: 21, name: 'Al-Anbiya', nameAr: 'الأنبياء', ayahCount: 112 },
  { number: 22, name: 'Al-Hajj', nameAr: 'الحج', ayahCount: 78 },
  { number: 23, name: 'Al-Mu\'minun', nameAr: 'المؤمنون', ayahCount: 118 },
  { number: 24, name: 'An-Nur', nameAr: 'النور', ayahCount: 64 },
  { number: 25, name: 'Al-Furqan', nameAr: 'الفرقان', ayahCount: 77 },
  { number: 26, name: 'Ash-Shu\'ara', nameAr: 'الشعراء', ayahCount: 227 },
  { number: 27, name: 'An-Naml', nameAr: 'النمل', ayahCount: 93 },
  { number: 28, name: 'Al-Qasas', nameAr: 'القصص', ayahCount: 88 },
  { number: 29, name: 'Al-Ankabut', nameAr: 'العنكبوت', ayahCount: 69 },
  { number: 30, name: 'Ar-Rum', nameAr: 'الروم', ayahCount: 60 },
  { number: 31, name: 'Luqman', nameAr: 'لقمان', ayahCount: 34 },
  { number: 32, name: 'As-Sajdah', nameAr: 'السجدة', ayahCount: 30 },
  { number: 33, name: 'Al-Ahzab', nameAr: 'الأحزاب', ayahCount: 73 },
  { number: 34, name: 'Saba', nameAr: 'سبأ', ayahCount: 54 },
  { number: 35, name: 'Fatir', nameAr: 'فاطر', ayahCount: 45 },
  { number: 36, name: 'Ya-Sin', nameAr: 'يس', ayahCount: 83 },
  { number: 37, name: 'As-Saffat', nameAr: 'الصافات', ayahCount: 182 },
  { number: 38, name: 'Sad', nameAr: 'ص', ayahCount: 88 },
  { number: 39, name: 'Az-Zumar', nameAr: 'الزمر', ayahCount: 75 },
  { number: 40, name: 'Ghafir', nameAr: 'غافر', ayahCount: 85 },
  { number: 41, name: 'Fussilat', nameAr: 'فصلت', ayahCount: 54 },
  { number: 42, name: 'Ash-Shura', nameAr: 'الشورى', ayahCount: 53 },
  { number: 43, name: 'Az-Zukhruf', nameAr: 'الزخرف', ayahCount: 89 },
  { number: 44, name: 'Ad-Dukhan', nameAr: 'الدخان', ayahCount: 59 },
  { number: 45, name: 'Al-Jathiyah', nameAr: 'الجاثية', ayahCount: 37 },
  { number: 46, name: 'Al-Ahqaf', nameAr: 'الأحقاف', ayahCount: 35 },
  { number: 47, name: 'Muhammad', nameAr: 'محمد', ayahCount: 38 },
  { number: 48, name: 'Al-Fath', nameAr: 'الفتح', ayahCount: 29 },
  { number: 49, name: 'Al-Hujurat', nameAr: 'الحجرات', ayahCount: 18 },
  { number: 50, name: 'Qaf', nameAr: 'ق', ayahCount: 45 },
  { number: 51, name: 'Adh-Dhariyat', nameAr: 'الذاريات', ayahCount: 60 },
  { number: 52, name: 'At-Tur', nameAr: 'الطور', ayahCount: 49 },
  { number: 53, name: 'An-Najm', nameAr: 'النجم', ayahCount: 62 },
  { number: 54, name: 'Al-Qamar', nameAr: 'القمر', ayahCount: 55 },
  { number: 55, name: 'Ar-Rahman', nameAr: 'الرحمن', ayahCount: 78 },
  { number: 56, name: 'Al-Waqi\'ah', nameAr: 'الواقعة', ayahCount: 96 },
  { number: 57, name: 'Al-Hadid', nameAr: 'الحديد', ayahCount: 29 },
  { number: 58, name: 'Al-Mujadila', nameAr: 'المجادلة', ayahCount: 22 },
  { number: 59, name: 'Al-Hashr', nameAr: 'الحشر', ayahCount: 24 },
  { number: 60, name: 'Al-Mumtahanah', nameAr: 'الممتحنة', ayahCount: 13 },
  { number: 61, name: 'As-Saff', nameAr: 'الصف', ayahCount: 14 },
  { number: 62, name: 'Al-Jumu\'ah', nameAr: 'الجمعة', ayahCount: 11 },
  { number: 63, name: 'Al-Munafiqun', nameAr: 'المنافقون', ayahCount: 11 },
  { number: 64, name: 'At-Taghabun', nameAr: 'التغابن', ayahCount: 18 },
  { number: 65, name: 'At-Talaq', nameAr: 'الطلاق', ayahCount: 12 },
  { number: 66, name: 'At-Tahrim', nameAr: 'التحريم', ayahCount: 12 },
  { number: 67, name: 'Al-Mulk', nameAr: 'الملك', ayahCount: 30 },
  { number: 68, name: 'Al-Qalam', nameAr: 'القلم', ayahCount: 52 },
  { number: 69, name: 'Al-Haqqah', nameAr: 'الحاقة', ayahCount: 52 },
  { number: 70, name: 'Al-Ma\'arij', nameAr: 'المعارج', ayahCount: 44 },
  { number: 71, name: 'Nuh', nameAr: 'نوح', ayahCount: 28 },
  { number: 72, name: 'Al-Jinn', nameAr: 'الجن', ayahCount: 28 },
  { number: 73, name: 'Al-Muzzammil', nameAr: 'المزمل', ayahCount: 20 },
  { number: 74, name: 'Al-Muddaththir', nameAr: 'المدثر', ayahCount: 56 },
  { number: 75, name: 'Al-Qiyamah', nameAr: 'القيامة', ayahCount: 40 },
  { number: 76, name: 'Al-Insan', nameAr: 'الإنسان', ayahCount: 31 },
  { number: 77, name: 'Al-Mursalat', nameAr: 'المرسلات', ayahCount: 50 },
  { number: 78, name: 'An-Naba', nameAr: 'النبأ', ayahCount: 40 },
  { number: 79, name: 'An-Nazi\'at', nameAr: 'النازعات', ayahCount: 46 },
  { number: 80, name: 'Abasa', nameAr: 'عبس', ayahCount: 42 },
  { number: 81, name: 'At-Takwir', nameAr: 'التكوير', ayahCount: 29 },
  { number: 82, name: 'Al-Infitar', nameAr: 'الانفطار', ayahCount: 19 },
  { number: 83, name: 'Al-Mutaffifin', nameAr: 'المطففين', ayahCount: 36 },
  { number: 84, name: 'Al-Inshiqaq', nameAr: 'الانشقاق', ayahCount: 25 },
  { number: 85, name: 'Al-Buruj', nameAr: 'البروج', ayahCount: 22 },
  { number: 86, name: 'At-Tariq', nameAr: 'الطارق', ayahCount: 17 },
  { number: 87, name: 'Al-A\'la', nameAr: 'الأعلى', ayahCount: 19 },
  { number: 88, name: 'Al-Ghashiyah', nameAr: 'الغاشية', ayahCount: 26 },
  { number: 89, name: 'Al-Fajr', nameAr: 'الفجر', ayahCount: 30 },
  { number: 90, name: 'Al-Balad', nameAr: 'البلد', ayahCount: 20 },
  { number: 91, name: 'Ash-Shams', nameAr: 'الشمس', ayahCount: 15 },
  { number: 92, name: 'Al-Layl', nameAr: 'الليل', ayahCount: 21 },
  { number: 93, name: 'Ad-Duha', nameAr: 'الضحى', ayahCount: 11 },
  { number: 94, name: 'Ash-Sharh', nameAr: 'الشرح', ayahCount: 8 },
  { number: 95, name: 'At-Tin', nameAr: 'التين', ayahCount: 8 },
  { number: 96, name: 'Al-Alaq', nameAr: 'العلق', ayahCount: 19 },
  { number: 97, name: 'Al-Qadr', nameAr: 'القدر', ayahCount: 5 },
  { number: 98, name: 'Al-Bayyinah', nameAr: 'البينة', ayahCount: 8 },
  { number: 99, name: 'Az-Zalzalah', nameAr: 'الزلزلة', ayahCount: 8 },
  { number: 100, name: 'Al-Adiyat', nameAr: 'العاديات', ayahCount: 11 },
  { number: 101, name: 'Al-Qari\'ah', nameAr: 'القارعة', ayahCount: 11 },
  { number: 102, name: 'At-Takathur', nameAr: 'التكاثر', ayahCount: 8 },
  { number: 103, name: 'Al-Asr', nameAr: 'العصر', ayahCount: 3 },
  { number: 104, name: 'Al-Humazah', nameAr: 'الهمزة', ayahCount: 9 },
  { number: 105, name: 'Al-Fil', nameAr: 'الفيل', ayahCount: 5 },
  { number: 106, name: 'Quraysh', nameAr: 'قريش', ayahCount: 4 },
  { number: 107, name: 'Al-Ma\'un', nameAr: 'الماعون', ayahCount: 7 },
  { number: 108, name: 'Al-Kawthar', nameAr: 'الكوثر', ayahCount: 3 },
  { number: 109, name: 'Al-Kafirun', nameAr: 'الكافرون', ayahCount: 6 },
  { number: 110, name: 'An-Nasr', nameAr: 'النصر', ayahCount: 3 },
  { number: 111, name: 'Al-Masad', nameAr: 'المسد', ayahCount: 5 },
  { number: 112, name: 'Al-Ikhlas', nameAr: 'الإخلاص', ayahCount: 4 },
  { number: 113, name: 'Al-Falaq', nameAr: 'الفلق', ayahCount: 5 },
  { number: 114, name: 'An-Nas', nameAr: 'الناس', ayahCount: 6 },
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

// --- Quran.com: get audio URL ---
export function getAudioUrl(surah: number, ayah: number, reciterId = 7): string {
  // Reciter 7 = Mishary Rashid Alafasy
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getAbsoluteAyahNumber(surah, ayah)}.mp3`;
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
