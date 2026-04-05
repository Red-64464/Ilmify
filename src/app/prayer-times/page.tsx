'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Loader2, RefreshCw, Sun, Sunrise, Sunset,
  Moon, CloudSun, ChevronDown,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import {
  getPrayerTimesByCoords,
  CALCULATION_METHODS,
  type PrayerTimings,
  type HijriDate,
} from '@/lib/api/aladhanApi';

interface PrayerInfo {
  name: string;
  nameAr: string;
  icon: React.ElementType;
  color: string;
  key: keyof PrayerTimings;
}

const PRAYERS: PrayerInfo[] = [
  { name: 'Fajr', nameAr: 'الفجر', icon: Sunrise, color: '#818cf8', key: 'Fajr' },
  { name: 'Lever du soleil', nameAr: 'الشروق', icon: Sun, color: '#fbbf24', key: 'Sunrise' },
  { name: 'Dhuhr', nameAr: 'الظهر', icon: CloudSun, color: '#f59e0b', key: 'Dhuhr' },
  { name: 'Asr', nameAr: 'العصر', icon: Sun, color: '#fb923c', key: 'Asr' },
  { name: 'Maghrib', nameAr: 'المغرب', icon: Sunset, color: '#f87171', key: 'Maghrib' },
  { name: 'Isha', nameAr: 'العشاء', icon: Moon, color: '#6366f1', key: 'Isha' },
];

function getNextPrayer(timings: PrayerTimings): string | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prayerKeys: (keyof PrayerTimings)[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  for (const key of prayerKeys) {
    const time = timings[key];
    if (!time) continue;
    const [h, m] = time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) return key;
  }
  return 'Fajr'; // After Isha, next is Fajr
}

export default function PrayerTimesPage() {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [gregorianDate, setGregorianDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [method, setMethod] = useState(12); // UOIF default
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [nextPrayer, setNextPrayer] = useState<string | null>(null);

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number, calcMethod: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await getPrayerTimesByCoords(lat, lng, calcMethod);
      setTimings(res.data.timings);
      setHijriDate(res.data.date.hijri);
      setGregorianDate(res.data.date.readable);
      setNextPrayer(getNextPrayer(res.data.timings));
    } catch {
      setError('Erreur lors du chargement des horaires de prière');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        fetchPrayerTimes(latitude, longitude, method);
      },
      () => {
        setError('Impossible d\'obtenir votre position. Veuillez autoriser la géolocalisation.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [method, fetchPrayerTimes]);

  // Request location on mount
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update next prayer every minute
  useEffect(() => {
    if (!timings) return;
    const interval = setInterval(() => {
      setNextPrayer(getNextPrayer(timings));
    }, 60000);
    return () => clearInterval(interval);
  }, [timings]);

  const handleMethodChange = (newMethod: number) => {
    setMethod(newMethod);
    setShowMethodPicker(false);
    if (coords) {
      fetchPrayerTimes(coords.lat, coords.lng, newMethod);
    }
  };

  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      <PageHeader
        title="Horaires de Prière"
        subtitle="Basés sur votre position GPS"
      />

      <div className="px-4 sm:px-6 max-w-lg mx-auto space-y-6">
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
          <button
            onClick={requestLocation}
            disabled={loading}
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </motion.div>

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

        {/* Error */}
        {error && (
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(248, 113, 113, 0.08)', color: '#f87171' }}>
            <p className="text-sm">{error}</p>
            <button
              onClick={requestLocation}
              className="mt-2 px-4 py-1.5 rounded-lg text-sm cursor-pointer"
              style={{ background: 'rgba(248, 113, 113, 0.15)' }}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !timings && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        )}

        {/* Prayer times */}
        {timings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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

        {/* Calculation method */}
        <div className="relative">
          <button
            onClick={() => setShowMethodPicker(!showMethodPicker)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Méthode: {CALCULATION_METHODS.find((m) => m.id === method)?.name || 'UOIF'}</span>
            <ChevronDown size={14} className={showMethodPicker ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>

          {showMethodPicker && (
            <div
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
            </div>
          )}
        </div>

        {/* Source attribution */}
        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          Données fournies par Aladhan.com API • HadeethEnc.com • QuranEnc.com
        </p>
      </div>
    </div>
  );
}
