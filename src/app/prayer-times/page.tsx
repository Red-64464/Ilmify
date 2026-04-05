'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Loader2, RefreshCw, Sun, Sunrise, Sunset,
  Moon, CloudSun, ChevronDown, Search, X, Bell, BellOff,
  ChevronLeft, ChevronRight, Timer,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Tabs from '@/components/ui/Tabs';
import {
  getPrayerTimesByCoords,
  getMonthlyPrayerTimes,
  getQiblaDirection,
  CALCULATION_METHODS,
  DEFAULT_METHOD,
  type PrayerTimings,
  type PrayerTimesResponse,
  type HijriDate,
} from '@/lib/api/aladhanApi';

// ─── LocalStorage keys ────────────────────────────────────────────
const LS_METHOD = 'ilmify_prayer_method';
const LS_COORDS = 'ilmify_prayer_coords';
const LS_LOCATION = 'ilmify_prayer_location';
const LS_NOTIF = 'ilmify_prayer_notif';
const LS_NOTIF_MINUTES = 'ilmify_prayer_notif_minutes';
const LS_MONTHLY_CACHE = 'ilmify_prayer_monthly';

function loadPref<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function savePref(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ─── Geocoding helpers ─────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers: { 'User-Agent': 'Ilmify/1.0' } }
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    const a = data.address;
    const city = a?.city || a?.town || a?.village || a?.municipality || '';
    const country = a?.country || '';
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    return data.display_name?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=fr`,
      { headers: { 'User-Agent': 'Ilmify/1.0' } }
    );
    if (!res.ok) return null;
    const results = await res.json();
    if (!results.length) return null;
    const r = results[0];
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), name: r.display_name?.split(',').slice(0, 2).join(',').trim() || query };
  } catch {
    return null;
  }
}

// ─── Prayer info ───────────────────────────────────────────────────
interface PrayerInfo {
  name: string;
  nameAr: string;
  icon: React.ElementType;
  color: string;
  key: keyof PrayerTimings;
  isAdhan: boolean;
}

const PRAYERS: PrayerInfo[] = [
  { name: 'Fajr', nameAr: 'الفجر', icon: Sunrise, color: '#818cf8', key: 'Fajr', isAdhan: true },
  { name: 'Lever du soleil', nameAr: 'الشروق', icon: Sun, color: '#fbbf24', key: 'Sunrise', isAdhan: false },
  { name: 'Dhuhr', nameAr: 'الظهر', icon: CloudSun, color: '#f59e0b', key: 'Dhuhr', isAdhan: true },
  { name: 'Asr', nameAr: 'العصر', icon: Sun, color: '#fb923c', key: 'Asr', isAdhan: true },
  { name: 'Maghrib', nameAr: 'المغرب', icon: Sunset, color: '#f87171', key: 'Maghrib', isAdhan: true },
  { name: 'Isha', nameAr: 'العشاء', icon: Moon, color: '#6366f1', key: 'Isha', isAdhan: true },
];

const PRAYER_KEYS: (keyof PrayerTimings)[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function parsePrayerTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getNextPrayerKey(timings: PrayerTimings): keyof PrayerTimings {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const key of PRAYER_KEYS) {
    const time = timings[key];
    if (!time) continue;
    if (parsePrayerTime(time) > currentMinutes) return key;
  }
  return 'Fajr';
}

function getCountdownText(timings: PrayerTimings, nextKey: keyof PrayerTimings): string {
  const now = new Date();
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const time = timings[nextKey];
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  let targetSeconds = h * 3600 + m * 60;

  if (targetSeconds <= currentSeconds && nextKey === 'Fajr') {
    targetSeconds += 24 * 3600;
  }

  let diff = targetSeconds - currentSeconds;
  if (diff < 0) diff += 24 * 3600;

  const hours = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;

  if (hours > 0) return `${hours}h ${String(mins).padStart(2, '0')}min ${String(secs).padStart(2, '0')}s`;
  if (mins > 0) return `${mins}min ${String(secs).padStart(2, '0')}s`;
  return `${secs}s`;
}

// ─── Notification helpers ──────────────────────────────────────────
function scheduleNotifications(timings: PrayerTimings, minutesBefore: number) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const todayStr = now.toDateString();

  PRAYERS.filter(p => p.isAdhan).forEach((prayer) => {
    const time = timings[prayer.key];
    if (!time) return;
    const [h, m] = time.split(':').map(Number);

    const prayerDate = new Date(now);
    prayerDate.setHours(h, m, 0, 0);

    const reminderDate = new Date(prayerDate.getTime() - minutesBefore * 60000);

    const scheduleOne = (date: Date, title: string, body: string) => {
      const delay = date.getTime() - now.getTime();
      if (delay <= 0 || delay > 24 * 3600000) return;

      const tag = `prayer-${prayer.key}-${todayStr}-${title}`;
      setTimeout(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body,
            tag,
          });
        } else {
          new Notification(title, { body, tag, icon: '/logo.png' });
        }
      }, delay);
    };

    if (minutesBefore > 0) {
      scheduleOne(reminderDate, `${prayer.name} dans ${minutesBefore} min`, `${prayer.nameAr} — Préparez-vous pour la prière`);
    }
    scheduleOne(prayerDate, `${prayer.name} — ${prayer.nameAr}`, `Il est l'heure de la prière de ${prayer.name} (${time})`);
  });
}

// ─── Tab config ────────────────────────────────────────────────────
const VIEW_TABS = [
  { id: 'today', label: 'Aujourd\'hui' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'qibla', label: 'Qibla' },
];

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ─── Component ─────────────────────────────────────────────────────
export default function PrayerTimesPage() {
  // Core state
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [gregorianDate, setGregorianDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    () => loadPref(LS_COORDS, null)
  );
  const [locationName, setLocationName] = useState(
    () => loadPref(LS_LOCATION, '')
  );
  const [method, setMethod] = useState(
    () => loadPref(LS_METHOD, DEFAULT_METHOD)
  );
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [nextPrayer, setNextPrayer] = useState<keyof PrayerTimings | null>(null);
  const [countdown, setCountdown] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [searchingAddress, setSearchingAddress] = useState(false);

  // View mode
  const [activeView, setActiveView] = useState('today');

  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(
    () => loadPref(LS_NOTIF, false)
  );
  const [notifMinutes, setNotifMinutes] = useState(
    () => loadPref(LS_NOTIF_MINUTES, 10)
  );

  // Monthly calendar
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<PrayerTimesResponse['data'][] | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Qibla
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [qiblaLoading, setQiblaLoading] = useState(false);
  const [compassSupported, setCompassSupported] = useState(true);

  const methodPickerRef = useRef<HTMLDivElement>(null);

  // ─── Fetch prayer times ──────────────────────────────────────────
  const fetchPrayerTimes = useCallback(async (lat: number, lng: number, calcMethod: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await getPrayerTimesByCoords(lat, lng, calcMethod);
      setTimings(res.data.timings);
      setHijriDate(res.data.date.hijri);
      setGregorianDate(res.data.date.readable);
      const next = getNextPrayerKey(res.data.timings);
      setNextPrayer(next);
      setCountdown(getCountdownText(res.data.timings, next));

      // Cache for offline
      try {
        savePref(`${LS_MONTHLY_CACHE}_today`, { timings: res.data.timings, hijri: res.data.date.hijri, gregorian: res.data.date.readable, ts: Date.now() });
      } catch { /* quota */ }
    } catch {
      // Try offline cache
      try {
        const cached = loadPref(`${LS_MONTHLY_CACHE}_today`, null) as { timings: PrayerTimings; hijri: HijriDate; gregorian: string; ts: number } | null;
        if (cached && Date.now() - cached.ts < 86400000) {
          setTimings(cached.timings);
          setHijriDate(cached.hijri);
          setGregorianDate(cached.gregorian);
          const next = getNextPrayerKey(cached.timings);
          setNextPrayer(next);
          setCountdown(getCountdownText(cached.timings, next));
          setError('Horaires en cache (hors-ligne)');
          return;
        }
      } catch { /* ignore */ }
      setError('Erreur lors du chargement des horaires de prière');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Location ────────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoords(newCoords);
        savePref(LS_COORDS, newCoords);
        const name = await reverseGeocode(latitude, longitude);
        setLocationName(name);
        savePref(LS_LOCATION, name);
        fetchPrayerTimes(latitude, longitude, method);
      },
      () => {
        const cached = loadPref<{ lat: number; lng: number } | null>(LS_COORDS, null);
        if (cached) {
          fetchPrayerTimes(cached.lat, cached.lng, method);
        } else {
          setError('Impossible d\'obtenir votre position. Entrez une ville manuellement.');
          setShowManualInput(true);
          setLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [method, fetchPrayerTimes]);

  const handleManualSearch = useCallback(async () => {
    if (!manualAddress.trim() || searchingAddress) return;
    setSearchingAddress(true);
    setError('');
    const result = await geocodeAddress(manualAddress.trim());
    if (result) {
      const newCoords = { lat: result.lat, lng: result.lng };
      setCoords(newCoords);
      savePref(LS_COORDS, newCoords);
      setLocationName(result.name);
      savePref(LS_LOCATION, result.name);
      setShowManualInput(false);
      setManualAddress('');
      fetchPrayerTimes(result.lat, result.lng, method);
    } else {
      setError('Ville non trouvée. Vérifiez l\'orthographe.');
    }
    setSearchingAddress(false);
  }, [manualAddress, searchingAddress, method, fetchPrayerTimes]);

  // ─── Init on mount ───────────────────────────────────────────────
  useEffect(() => {
    const savedCoords = loadPref<{ lat: number; lng: number } | null>(LS_COORDS, null);
    if (savedCoords) {
      fetchPrayerTimes(savedCoords.lat, savedCoords.lng, method);
      // Silently update GPS in background
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const newCoords = { lat: latitude, lng: longitude };
            setCoords(newCoords);
            savePref(LS_COORDS, newCoords);
            const name = await reverseGeocode(latitude, longitude);
            setLocationName(name);
            savePref(LS_LOCATION, name);
            fetchPrayerTimes(latitude, longitude, method);
          },
          () => { /* GPS failed, cached coords are fine */ },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } else {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 1-second countdown timer ────────────────────────────────────
  useEffect(() => {
    if (!timings) return;
    const tick = () => {
      const next = getNextPrayerKey(timings);
      setNextPrayer(next);
      setCountdown(getCountdownText(timings, next));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  // ─── Notifications ───────────────────────────────────────────────
  const toggleNotifications = useCallback(async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      savePref(LS_NOTIF, false);
      return;
    }
    if (!('Notification' in window)) {
      setError('Les notifications ne sont pas supportées par ce navigateur');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifEnabled(true);
      savePref(LS_NOTIF, true);
      if (timings) scheduleNotifications(timings, notifMinutes);
    } else {
      setError('Permission de notification refusée');
    }
  }, [notifEnabled, timings, notifMinutes]);

  useEffect(() => {
    if (notifEnabled && timings) {
      scheduleNotifications(timings, notifMinutes);
    }
  }, [timings, notifEnabled, notifMinutes]);

  const handleNotifMinutesChange = (mins: number) => {
    setNotifMinutes(mins);
    savePref(LS_NOTIF_MINUTES, mins);
    if (notifEnabled && timings) {
      scheduleNotifications(timings, mins);
    }
  };

  // ─── Method change ───────────────────────────────────────────────
  const handleMethodChange = (newMethod: number) => {
    setMethod(newMethod);
    savePref(LS_METHOD, newMethod);
    setShowMethodPicker(false);
    if (coords) {
      fetchPrayerTimes(coords.lat, coords.lng, newMethod);
    }
  };

  // ─── Monthly calendar ────────────────────────────────────────────
  const fetchMonthly = useCallback(async () => {
    if (!coords) return;
    setMonthlyLoading(true);
    try {
      const cacheKey = `${LS_MONTHLY_CACHE}_${calYear}_${calMonth}_${method}`;
      const cached = loadPref<{ data: PrayerTimesResponse['data'][]; ts: number } | null>(cacheKey, null);
      if (cached && Date.now() - cached.ts < 86400000) {
        setMonthlyData(cached.data);
        setMonthlyLoading(false);
        return;
      }
      const res = await getMonthlyPrayerTimes(coords.lat, coords.lng, calMonth, calYear, method);
      setMonthlyData(res.data);
      savePref(cacheKey, { data: res.data, ts: Date.now() });
    } catch {
      setError('Erreur lors du chargement du calendrier');
    } finally {
      setMonthlyLoading(false);
    }
  }, [coords, calMonth, calYear, method]);

  useEffect(() => {
    if (activeView === 'calendar') fetchMonthly();
  }, [activeView, fetchMonthly]);

  const handleCalNav = (dir: -1 | 1) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCalMonth(m);
    setCalYear(y);
  };

  // ─── Qibla ───────────────────────────────────────────────────────
  const fetchQibla = useCallback(async () => {
    if (!coords) return;
    setQiblaLoading(true);
    try {
      const res = await getQiblaDirection(coords.lat, coords.lng);
      setQiblaDirection(res.data.direction);
    } catch {
      setError('Erreur lors du chargement de la direction Qibla');
    } finally {
      setQiblaLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    if (activeView === 'qibla') fetchQibla();
  }, [activeView, fetchQibla]);

  // Device compass
  useEffect(() => {
    if (activeView !== 'qibla') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading ?? (e.alpha != null ? (360 - e.alpha) % 360 : null);
      if (heading != null) setDeviceHeading(heading);
    };

    const doe = DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    if (typeof doe.requestPermission === 'function') {
      doe.requestPermission().then((perm) => {
        if (perm === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setCompassSupported(false);
        }
      }).catch(() => setCompassSupported(false));
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
      const timeout = setTimeout(() => {
        if (deviceHeading === null) setCompassSupported(false);
      }, 3000);
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const qiblaRotation = useMemo(() => {
    if (qiblaDirection == null) return 0;
    if (deviceHeading != null) return qiblaDirection - deviceHeading;
    return qiblaDirection;
  }, [qiblaDirection, deviceHeading]);

  // ─── Close method picker on outside click ────────────────────────
  useEffect(() => {
    if (!showMethodPicker) return;
    const handler = (e: MouseEvent) => {
      if (methodPickerRef.current && !methodPickerRef.current.contains(e.target as Node)) {
        setShowMethodPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMethodPicker]);

  // ─── Pre-fetch monthly for offline ───────────────────────────────
  useEffect(() => {
    if (!coords) return;
    const now = new Date();
    const cacheKey = `${LS_MONTHLY_CACHE}_${now.getFullYear()}_${now.getMonth() + 1}_${method}`;
    const cached = loadPref(cacheKey, null);
    if (!cached) {
      getMonthlyPrayerTimes(coords.lat, coords.lng, now.getMonth() + 1, now.getFullYear(), method)
        .then((res) => savePref(cacheKey, { data: res.data, ts: Date.now() }))
        .catch(() => { /* best effort */ });
    }
  }, [coords, method]);

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      <PageHeader
        title="Horaires de Prière"
        subtitle="Basés sur votre position"
      />

      <div className="px-4 sm:px-6 max-w-lg mx-auto space-y-5">
        {/* Location info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(46, 158, 140, 0.1)' }}>
              <MapPin size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {locationName || 'Position non disponible'}
              </p>
              {gregorianDate && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {gregorianDate}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: notifEnabled ? '#3aaa60' : 'var(--text-muted)' }}
              title={notifEnabled ? 'Notifications activées' : 'Activer les notifications'}
            >
              {notifEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              title="Rechercher une ville"
            >
              <Search size={16} />
            </button>
            <button
              onClick={requestLocation}
              disabled={loading}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--accent)' }}
              title="Actualiser la position GPS"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </motion.div>

        {/* Notification minutes settings */}
        {notifEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl p-3 flex items-center justify-between gap-3"
            style={{ background: 'rgba(58, 170, 96, 0.06)', border: '1px solid rgba(58, 170, 96, 0.15)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: '#3aaa60' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Rappel avant la prière :</span>
            </div>
            <div className="flex items-center gap-1">
              {[5, 10, 15, 30].map((m) => (
                <button
                  key={m}
                  onClick={() => handleNotifMinutesChange(m)}
                  className="px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    background: notifMinutes === m ? 'rgba(58, 170, 96, 0.15)' : 'transparent',
                    color: notifMinutes === m ? '#3aaa60' : 'var(--text-muted)',
                  }}
                >
                  {m}min
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Manual address search */}
        <AnimatePresence>
          {showManualInput && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="rounded-xl p-3 flex gap-2"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
              }}
            >
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="Entrez une ville (ex: Paris, Bruxelles...)"
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
                autoFocus
              />
              <button
                onClick={handleManualSearch}
                disabled={searchingAddress || !manualAddress.trim()}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  opacity: searchingAddress || !manualAddress.trim() ? 0.5 : 1,
                }}
              >
                {searchingAddress ? <Loader2 size={16} className="animate-spin" /> : 'OK'}
              </button>
              <button
                onClick={() => { setShowManualInput(false); setManualAddress(''); }}
                className="p-2 rounded-lg cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hijri date */}
        {hijriDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-4 text-center"
            style={{
              background: 'rgba(212, 173, 74, 0.06)',
              border: '1px solid rgba(212, 173, 74, 0.15)',
            }}
          >
            <p className="text-lg font-arabic" style={{ color: '#d4ad4a' }} dir="rtl">
              {hijriDate.day} {hijriDate.month.ar} {hijriDate.year}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {hijriDate.day} {hijriDate.month.en} {hijriDate.year} {hijriDate.designation.abbreviated}
            </p>
          </motion.div>
        )}

        {/* Countdown banner */}
        {timings && nextPrayer && countdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 text-center"
            style={{
              background: 'rgba(46, 158, 140, 0.08)',
              border: '1px solid rgba(46, 158, 140, 0.2)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Timer size={14} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Prochaine prière : {PRAYERS.find(p => p.key === nextPrayer)?.name}
              </span>
            </div>
            <p className="text-2xl font-mono font-bold tracking-wide" style={{ color: 'var(--accent)' }}>
              {countdown}
            </p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(248, 113, 113, 0.08)', color: '#f87171' }}>
            <p className="text-sm">{error}</p>
            {!timings && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={requestLocation}
                  className="px-4 py-1.5 rounded-lg text-sm cursor-pointer"
                  style={{ background: 'rgba(248, 113, 113, 0.15)' }}
                >
                  Réessayer GPS
                </button>
                <button
                  onClick={() => { setShowManualInput(true); setError(''); }}
                  className="px-4 py-1.5 rounded-lg text-sm cursor-pointer"
                  style={{ background: 'rgba(46, 158, 140, 0.15)', color: 'var(--accent)' }}
                >
                  Entrer une ville
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && !timings && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        )}

        {/* View tabs */}
        {timings && (
          <div className="overflow-x-auto">
            <Tabs tabs={VIEW_TABS} activeTab={activeView} onChange={setActiveView} />
          </div>
        )}

        {/* ───── Today View ───── */}
        {timings && activeView === 'today' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {PRAYERS.map((prayer, index) => {
              const time = timings[prayer.key] || '--:--';
              const isNext = nextPrayer === prayer.key;
              const Icon = prayer.icon;

              return (
                <motion.div
                  key={prayer.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all"
                  style={{
                    background: isNext
                      ? 'rgba(46, 158, 140, 0.1)'
                      : 'var(--bg-elevated)',
                    border: isNext
                      ? '1px solid rgba(46, 158, 140, 0.3)'
                      : '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    className="p-2 rounded-xl"
                    style={{ background: `${prayer.color}15` }}
                  >
                    <Icon size={18} style={{ color: prayer.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: isNext ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {prayer.name}
                    </p>
                    <p className="text-xs font-arabic" style={{ color: 'var(--text-muted)' }}>
                      {prayer.nameAr}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNext && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(46, 158, 140, 0.15)', color: 'var(--accent)' }}>
                        Prochaine
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-base font-mono font-semibold" style={{ color: isNext ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {time.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ───── Calendar View ───── */}
        {activeView === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleCalNav(-1)}
                className="p-2 rounded-lg cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {MONTH_NAMES_FR[calMonth - 1]} {calYear}
              </h3>
              <button
                onClick={() => handleCalNav(1)}
                className="p-2 rounded-lg cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {monthlyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            ) : monthlyData ? (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-subtle)' }}>
                <table className="w-full text-xs" style={{ minWidth: '500px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                      <th className="px-2 py-2.5 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Jour</th>
                      {PRAYERS.map((p) => (
                        <th key={p.key} className="px-2 py-2.5 text-center font-medium" style={{ color: p.color }}>
                          {p.name.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((day, i) => {
                      const isToday =
                        calMonth === new Date().getMonth() + 1 &&
                        calYear === new Date().getFullYear() &&
                        parseInt(day.date.gregorian.day) === new Date().getDate();
                      return (
                        <tr
                          key={i}
                          style={{
                            background: isToday ? 'rgba(46, 158, 140, 0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                            borderTop: '1px solid var(--border-subtle)',
                          }}
                        >
                          <td className="px-2 py-2" style={{ color: isToday ? 'var(--accent)' : 'var(--text-secondary)' }}>
                            <span className="font-medium">{day.date.gregorian.day}</span>
                            <span className="ml-1 opacity-50">{day.date.hijri.day}</span>
                          </td>
                          {PRAYERS.map((p) => (
                            <td key={p.key} className="px-2 py-2 text-center font-mono" style={{ color: isToday && nextPrayer === p.key ? 'var(--accent)' : 'var(--text-secondary)' }}>
                              {day.timings[p.key]?.split(' ')[0] || '--:--'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
                Sélectionnez une position pour voir le calendrier
              </p>
            )}
          </motion.div>
        )}

        {/* ───── Qibla View ───── */}
        {activeView === 'qibla' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 py-4"
          >
            {qiblaLoading ? (
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
            ) : qiblaDirection != null ? (
              <>
                {/* Compass */}
                <div className="relative w-64 h-64">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '2px solid var(--border-light)',
                      boxShadow: 'var(--shadow-elevated)',
                    }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="relative w-56 h-56"
                      style={{
                        transform: deviceHeading != null ? `rotate(${-deviceHeading}deg)` : 'none',
                        transition: 'transform 0.3s ease-out',
                      }}
                    >
                      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold" style={{ color: '#f87171' }}>N</span>
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>S</span>
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>E</span>
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>O</span>

                      {Array.from({ length: 36 }, (_, i) => (
                        <div
                          key={i}
                          className="absolute left-1/2 top-0 origin-bottom"
                          style={{
                            width: '1px',
                            height: i % 9 === 0 ? '12px' : '6px',
                            background: i % 9 === 0 ? 'var(--text-secondary)' : 'var(--border-subtle)',
                            transform: `translateX(-50%) rotate(${i * 10}deg)`,
                            transformOrigin: '50% 112px',
                          }}
                        />
                      ))}

                      <div
                        className="absolute left-1/2 top-1/2"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${qiblaDirection}deg)`,
                        }}
                      >
                        <div className="flex flex-col items-center" style={{ marginTop: '-70px' }}>
                          <div
                            className="w-4 h-4 rotate-45 mb-1"
                            style={{ background: '#d4ad4a' }}
                          />
                          <div className="w-0.5 h-16" style={{ background: 'linear-gradient(to bottom, #d4ad4a, transparent)' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(212, 173, 74, 0.12)',
                      border: '2px solid rgba(212, 173, 74, 0.3)',
                    }}
                  >
                    <span className="text-lg">🕋</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Direction : <span style={{ color: '#d4ad4a' }}>{qiblaDirection.toFixed(1)}°</span> depuis le Nord
                  </p>
                  {!compassSupported && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Boussole non disponible sur cet appareil. Utilisez la direction en degrés.
                    </p>
                  )}
                  {compassSupported && deviceHeading != null && (
                    <p className="text-xs" style={{ color: '#3aaa60' }}>
                      ✓ Boussole active — Orientez votre appareil
                    </p>
                  )}
                  {compassSupported && deviceHeading == null && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Recherche de la boussole...
                    </p>
                  )}
                </div>

                <div
                  className="rounded-xl p-4 w-full text-center"
                  style={{
                    background: 'rgba(212, 173, 74, 0.06)',
                    border: '1px solid rgba(212, 173, 74, 0.12)',
                  }}
                >
                  <p className="text-lg font-arabic mb-1" style={{ color: '#d4ad4a' }} dir="rtl">
                    الكعبة المشرفة
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    La Mecque, Arabie Saoudite — 21.4225° N, 39.8262° E
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                Sélectionnez une position pour afficher la direction de la Qibla
              </p>
            )}
          </motion.div>
        )}

        {/* Calculation method */}
        <div className="relative" ref={methodPickerRef}>
          <button
            onClick={() => setShowMethodPicker(!showMethodPicker)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Méthode: {CALCULATION_METHODS.find((m) => m.id === method)?.name || 'MWL'}</span>
            <ChevronDown size={14} className={showMethodPicker ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>

          <AnimatePresence>
            {showMethodPicker && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden max-h-52 overflow-y-auto scrollbar-none z-10"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-elevated)',
                }}
              >
                {CALCULATION_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleMethodChange(m.id)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{
                      color: m.id === method ? 'var(--accent)' : 'var(--text-secondary)',
                      background: m.id === method ? 'rgba(46, 158, 140, 0.08)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (m.id !== method) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (m.id !== method) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Source attribution */}
        <p className="text-[10px] text-center pb-4" style={{ color: 'var(--text-muted)' }}>
          Données fournies par Aladhan.com API • HadeethEnc.com • QuranEnc.com
        </p>
      </div>
    </div>
  );
}
