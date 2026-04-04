'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AppTheme {
  id: string;
  name: string;
  preview: string; // CSS gradient for preview swatch
  colors: {
    bgBase: string;
    bgSecondary: string;
    bgCard: string;
    bgElevated: string;
    borderSubtle: string;
    borderLight: string;
    borderAccent: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentLight: string;
    accentGlow: string;
    gold: string;
    goldGlow: string;
    shadowCard: string;
    shadowElevated: string;
  };
}

export const APP_THEMES: AppTheme[] = [
  {
    id: 'default',
    name: 'Émeraude Islamique',
    preview: 'linear-gradient(135deg, #0c2420, #1a7a6b)',
    colors: {
      bgBase: '#06120f',
      bgSecondary: '#091a17',
      bgCard: '#0c2420',
      bgElevated: '#0f2e29',
      borderSubtle: 'rgba(255, 255, 255, 0.05)',
      borderLight: 'rgba(255, 255, 255, 0.08)',
      borderAccent: 'rgba(196, 154, 61, 0.15)',
      textPrimary: '#efe9dd',
      textSecondary: '#c8bca5',
      textMuted: 'rgba(200, 188, 165, 0.55)',
      accent: '#2e9e8c',
      accentLight: 'rgba(26, 122, 107, 0.15)',
      accentGlow: 'rgba(26, 122, 107, 0.08)',
      gold: '#d4ad4a',
      goldGlow: 'rgba(196, 154, 61, 0.06)',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
      shadowElevated: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
    },
  },
  {
    id: 'rose',
    name: 'Rose Pastel',
    preview: 'linear-gradient(135deg, #1a0f14, #8b4567)',
    colors: {
      bgBase: '#0f0a0c',
      bgSecondary: '#1a1015',
      bgCard: '#24161d',
      bgElevated: '#2e1c26',
      borderSubtle: 'rgba(255, 200, 221, 0.06)',
      borderLight: 'rgba(255, 200, 221, 0.10)',
      borderAccent: 'rgba(219, 112, 147, 0.18)',
      textPrimary: '#f0e4e8',
      textSecondary: '#c8b0ba',
      textMuted: 'rgba(200, 176, 186, 0.55)',
      accent: '#c76b8a',
      accentLight: 'rgba(199, 107, 138, 0.15)',
      accentGlow: 'rgba(199, 107, 138, 0.08)',
      gold: '#d4a053',
      goldGlow: 'rgba(212, 160, 83, 0.06)',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
      shadowElevated: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
    },
  },
  {
    id: 'lavender',
    name: 'Lavande',
    preview: 'linear-gradient(135deg, #12101a, #6b5b95)',
    colors: {
      bgBase: '#0b0a10',
      bgSecondary: '#121019',
      bgCard: '#1a1625',
      bgElevated: '#221d2f',
      borderSubtle: 'rgba(200, 190, 255, 0.06)',
      borderLight: 'rgba(200, 190, 255, 0.10)',
      borderAccent: 'rgba(139, 119, 199, 0.18)',
      textPrimary: '#e8e4f0',
      textSecondary: '#b8aec8',
      textMuted: 'rgba(184, 174, 200, 0.55)',
      accent: '#8b77c7',
      accentLight: 'rgba(139, 119, 199, 0.15)',
      accentGlow: 'rgba(139, 119, 199, 0.08)',
      gold: '#c9a84c',
      goldGlow: 'rgba(201, 168, 76, 0.06)',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
      shadowElevated: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
    },
  },
  {
    id: 'ocean',
    name: 'Océan Profond',
    preview: 'linear-gradient(135deg, #0a1018, #2563a8)',
    colors: {
      bgBase: '#070c12',
      bgSecondary: '#0c1420',
      bgCard: '#111d2e',
      bgElevated: '#162638',
      borderSubtle: 'rgba(160, 200, 255, 0.06)',
      borderLight: 'rgba(160, 200, 255, 0.10)',
      borderAccent: 'rgba(59, 130, 199, 0.18)',
      textPrimary: '#e4ecf4',
      textSecondary: '#a8bcd0',
      textMuted: 'rgba(168, 188, 208, 0.55)',
      accent: '#3b82c7',
      accentLight: 'rgba(59, 130, 199, 0.15)',
      accentGlow: 'rgba(59, 130, 199, 0.08)',
      gold: '#d4a84a',
      goldGlow: 'rgba(212, 168, 74, 0.06)',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
      shadowElevated: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
    },
  },
  {
    id: 'sunset',
    name: 'Coucher de Soleil',
    preview: 'linear-gradient(135deg, #140e0a, #b86225)',
    colors: {
      bgBase: '#0f0a07',
      bgSecondary: '#1a1210',
      bgCard: '#241a14',
      bgElevated: '#2e221a',
      borderSubtle: 'rgba(255, 200, 150, 0.06)',
      borderLight: 'rgba(255, 200, 150, 0.10)',
      borderAccent: 'rgba(199, 120, 59, 0.18)',
      textPrimary: '#f0e8e0',
      textSecondary: '#c8b8a4',
      textMuted: 'rgba(200, 184, 164, 0.55)',
      accent: '#c47835',
      accentLight: 'rgba(196, 120, 53, 0.15)',
      accentGlow: 'rgba(196, 120, 53, 0.08)',
      gold: '#d4a84a',
      goldGlow: 'rgba(212, 168, 74, 0.06)',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
      shadowElevated: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
    },
  },
  {
    id: 'midnight',
    name: 'Minuit Royal',
    preview: 'linear-gradient(135deg, #0a0a14, #3d3d8b)',
    colors: {
      bgBase: '#08080f',
      bgSecondary: '#10101c',
      bgCard: '#181828',
      bgElevated: '#202034',
      borderSubtle: 'rgba(180, 180, 255, 0.06)',
      borderLight: 'rgba(180, 180, 255, 0.10)',
      borderAccent: 'rgba(120, 120, 199, 0.18)',
      textPrimary: '#e6e4f2',
      textSecondary: '#b4b0cc',
      textMuted: 'rgba(180, 176, 204, 0.55)',
      accent: '#7878c7',
      accentLight: 'rgba(120, 120, 199, 0.15)',
      accentGlow: 'rgba(120, 120, 199, 0.08)',
      gold: '#c9a84c',
      goldGlow: 'rgba(201, 168, 76, 0.06)',
      shadowCard: '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
      shadowElevated: '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
    },
  },
];

interface ThemeContextValue {
  currentTheme: AppTheme;
  setThemeById: (id: string) => void;
  themes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--bg-base', c.bgBase);
  root.style.setProperty('--bg-secondary', c.bgSecondary);
  root.style.setProperty('--bg-card', c.bgCard);
  root.style.setProperty('--bg-elevated', c.bgElevated);
  root.style.setProperty('--border-subtle', c.borderSubtle);
  root.style.setProperty('--border-light', c.borderLight);
  root.style.setProperty('--border-accent', c.borderAccent);
  root.style.setProperty('--text-primary', c.textPrimary);
  root.style.setProperty('--text-secondary', c.textSecondary);
  root.style.setProperty('--text-muted', c.textMuted);
  root.style.setProperty('--accent', c.accent);
  root.style.setProperty('--accent-light', c.accentLight);
  root.style.setProperty('--gold', c.gold);
  root.style.setProperty('--glow-green', c.accentGlow);
  root.style.setProperty('--glow-gold', c.goldGlow);
  root.style.setProperty('--shadow-card', c.shadowCard);
  root.style.setProperty('--shadow-elevated', c.shadowElevated);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(APP_THEMES[0]);

  useEffect(() => {
    const saved = localStorage.getItem('ilmify-theme');
    if (saved) {
      const found = APP_THEMES.find((t) => t.id === saved);
      if (found) {
        setCurrentTheme(found);
        applyTheme(found);
      }
    }
  }, []);

  const setThemeById = useCallback((id: string) => {
    const found = APP_THEMES.find((t) => t.id === id);
    if (found) {
      setCurrentTheme(found);
      applyTheme(found);
      localStorage.setItem('ilmify-theme', id);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setThemeById, themes: APP_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};
