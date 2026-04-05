// Aladhan API - Prayer times by coordinates

const ALADHAN_BASE = 'https://api.aladhan.com/v1';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface HijriDate {
  date: string;
  day: string;
  weekday: { en: string; ar: string };
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
}

export interface GregorianDate {
  date: string;
  day: string;
  weekday: { en: string };
  month: { number: number; en: string };
  year: string;
}

export interface PrayerTimesResponse {
  code: number;
  status: string;
  data: {
    timings: PrayerTimings;
    date: {
      readable: string;
      timestamp: string;
      hijri: HijriDate;
      gregorian: GregorianDate;
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: { id: number; name: string };
    };
  };
}

// Method IDs: 2 = ISNA, 3 = MWL, 5 = Egypt, 12 = UOIF (France), etc.
export async function getPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  method = 12, // UOIF for France by default
  date?: Date
): Promise<PrayerTimesResponse> {
  const d = date || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  const res = await fetch(
    `${ALADHAN_BASE}/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=${method}`
  );
  if (!res.ok) throw new Error(`Aladhan API error: ${res.status}`);
  return res.json();
}

export async function getMonthlyPrayerTimes(
  latitude: number,
  longitude: number,
  month: number,
  year: number,
  method = 12
): Promise<{ code: number; data: PrayerTimesResponse['data'][] }> {
  const res = await fetch(
    `${ALADHAN_BASE}/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${method}`
  );
  if (!res.ok) throw new Error(`Aladhan API error: ${res.status}`);
  return res.json();
}

export const CALCULATION_METHODS: { id: number; name: string }[] = [
  { id: 1, name: 'University of Islamic Sciences, Karachi' },
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 3, name: 'Muslim World League (MWL)' },
  { id: 4, name: 'Umm Al-Qura University, Makkah' },
  { id: 5, name: 'Egyptian General Authority of Survey' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran' },
  { id: 8, name: 'Gulf Region' },
  { id: 9, name: 'Kuwait' },
  { id: 10, name: 'Qatar' },
  { id: 11, name: 'Majlis Ugama Islam Singapura' },
  { id: 12, name: 'Union des Organisations Islamiques de France (UOIF)' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey' },
  { id: 14, name: 'Spiritual Administration of Muslims of Russia' },
  { id: 15, name: 'Moonsighting Committee Worldwide' },
];
