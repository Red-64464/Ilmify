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
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'peach',
    name: 'Pêche Veloutée',
    preview: 'linear-gradient(135deg, #f7b89c, #ff8b6b, #ffb347)',
    colors: {
      bgBase: '#10090a',
      bgSecondary: '#1a1012',
      bgCard: '#241518',
      bgElevated: '#2e1b1f',
      borderSubtle: 'rgba(255, 190, 160, 0.06)',
      borderLight: 'rgba(255, 190, 160, 0.11)',
      borderAccent: 'rgba(235, 140, 100, 0.2)',
      textPrimary: '#f5ece6',
      textSecondary: '#cfb8ad',
      textMuted: 'rgba(207, 184, 173, 0.5)',
      accent: '#eb8c64',
      accentLight: 'rgba(235, 140, 100, 0.14)',
      accentGlow: 'rgba(235, 140, 100, 0.07)',
      gold: '#e8a84e',
      goldGlow: 'rgba(232, 168, 78, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'lilac',
    name: 'Lilas Brumeux',
    preview: 'linear-gradient(135deg, #c9b8e8, #a78bca, #d4a5c9)',
    colors: {
      bgBase: '#0d0b12',
      bgSecondary: '#14111e',
      bgCard: '#1c1828',
      bgElevated: '#241f34',
      borderSubtle: 'rgba(210, 190, 255, 0.06)',
      borderLight: 'rgba(210, 190, 255, 0.11)',
      borderAccent: 'rgba(170, 140, 220, 0.2)',
      textPrimary: '#eee9f8',
      textSecondary: '#c4b8d8',
      textMuted: 'rgba(196, 184, 216, 0.5)',
      accent: '#b89ae0',
      accentLight: 'rgba(184, 154, 224, 0.14)',
      accentGlow: 'rgba(184, 154, 224, 0.07)',
      gold: '#d4a84c',
      goldGlow: 'rgba(212, 168, 76, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura Rose',
    preview: 'linear-gradient(135deg, #f9c6d0, #e88fa5, #f5adc0)',
    colors: {
      bgBase: '#120b0f',
      bgSecondary: '#1c1018',
      bgCard: '#261622',
      bgElevated: '#301c2c',
      borderSubtle: 'rgba(255, 200, 220, 0.07)',
      borderLight: 'rgba(255, 200, 220, 0.12)',
      borderAccent: 'rgba(225, 135, 165, 0.2)',
      textPrimary: '#f8edf2',
      textSecondary: '#d4b8c4',
      textMuted: 'rgba(212, 184, 196, 0.5)',
      accent: '#e187a5',
      accentLight: 'rgba(225, 135, 165, 0.14)',
      accentGlow: 'rgba(225, 135, 165, 0.07)',
      gold: '#dfab6a',
      goldGlow: 'rgba(223, 171, 106, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'arctic',
    name: 'Saphir Givré',
    preview: 'linear-gradient(135deg, #a8d8f0, #6ab4e8, #8ecae6)',
    colors: {
      bgBase: '#070d14',
      bgSecondary: '#0c1520',
      bgCard: '#111e2d',
      bgElevated: '#16263a',
      borderSubtle: 'rgba(160, 220, 255, 0.06)',
      borderLight: 'rgba(160, 220, 255, 0.11)',
      borderAccent: 'rgba(100, 180, 235, 0.2)',
      textPrimary: '#e4f0fa',
      textSecondary: '#a8c8e0',
      textMuted: 'rgba(168, 200, 224, 0.5)',
      accent: '#64b4eb',
      accentLight: 'rgba(100, 180, 235, 0.14)',
      accentGlow: 'rgba(100, 180, 235, 0.07)',
      gold: '#d4b060',
      goldGlow: 'rgba(212, 176, 96, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'matcha',
    name: 'Thé Matcha',
    preview: 'linear-gradient(135deg, #b8d8b0, #7ab87a, #a8c87a)',
    colors: {
      bgBase: '#080f08',
      bgSecondary: '#0f180f',
      bgCard: '#162016',
      bgElevated: '#1c2a1c',
      borderSubtle: 'rgba(180, 230, 170, 0.06)',
      borderLight: 'rgba(180, 230, 170, 0.10)',
      borderAccent: 'rgba(130, 190, 120, 0.2)',
      textPrimary: '#e8f4e4',
      textSecondary: '#b4ccb0',
      textMuted: 'rgba(180, 204, 176, 0.5)',
      accent: '#82be78',
      accentLight: 'rgba(130, 190, 120, 0.14)',
      accentGlow: 'rgba(130, 190, 120, 0.07)',
      gold: '#c8b848',
      goldGlow: 'rgba(200, 184, 72, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'aurora',
    name: 'Aurore Boréale',
    preview: 'linear-gradient(135deg, #a0e8d0, #70c8d8, #80a8e8)',
    colors: {
      bgBase: '#070c10',
      bgSecondary: '#0c141a',
      bgCard: '#121c22',
      bgElevated: '#18242e',
      borderSubtle: 'rgba(150, 230, 210, 0.06)',
      borderLight: 'rgba(150, 230, 210, 0.11)',
      borderAccent: 'rgba(100, 200, 180, 0.2)',
      textPrimary: '#e4f4f0',
      textSecondary: '#a8ccc4',
      textMuted: 'rgba(168, 204, 196, 0.5)',
      accent: '#64c8b4',
      accentLight: 'rgba(100, 200, 180, 0.14)',
      accentGlow: 'rgba(100, 200, 180, 0.07)',
      gold: '#d4c060',
      goldGlow: 'rgba(212, 192, 96, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'plum',
    name: 'Prune Royale',
    preview: 'linear-gradient(135deg, #d4a8d4, #9b5fb8, #c47dba)',
    colors: {
      bgBase: '#0f0810',
      bgSecondary: '#190f1c',
      bgCard: '#221528',
      bgElevated: '#2c1c34',
      borderSubtle: 'rgba(220, 170, 230, 0.07)',
      borderLight: 'rgba(220, 170, 230, 0.12)',
      borderAccent: 'rgba(180, 120, 200, 0.2)',
      textPrimary: '#f0e8f4',
      textSecondary: '#c8aad0',
      textMuted: 'rgba(200, 170, 208, 0.5)',
      accent: '#c078c8',
      accentLight: 'rgba(192, 120, 200, 0.14)',
      accentGlow: 'rgba(192, 120, 200, 0.07)',
      gold: '#e0b86a',
      goldGlow: 'rgba(224, 184, 106, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'sand',
    name: 'Sable Doré',
    preview: 'linear-gradient(135deg, #f0d89a, #d4a84a, #e8c060)',
    colors: {
      bgBase: '#0f0d08',
      bgSecondary: '#1a170d',
      bgCard: '#231f12',
      bgElevated: '#2c2818',
      borderSubtle: 'rgba(240, 210, 140, 0.07)',
      borderLight: 'rgba(240, 210, 140, 0.12)',
      borderAccent: 'rgba(200, 165, 80, 0.2)',
      textPrimary: '#f5f0e0',
      textSecondary: '#cfc0a0',
      textMuted: 'rgba(207, 192, 160, 0.5)',
      accent: '#c8a050',
      accentLight: 'rgba(200, 160, 80, 0.14)',
      accentGlow: 'rgba(200, 160, 80, 0.07)',
      gold: '#d4a84a',
      goldGlow: 'rgba(212, 168, 74, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'midnight',
    name: 'Minuit Indigo',
    preview: 'linear-gradient(135deg, #8888f8, #6060e0, #a080f0)',
    colors: {
      bgBase: '#08080f',
      bgSecondary: '#10101c',
      bgCard: '#181828',
      bgElevated: '#202034',
      borderSubtle: 'rgba(180, 180, 255, 0.06)',
      borderLight: 'rgba(180, 180, 255, 0.11)',
      borderAccent: 'rgba(140, 140, 240, 0.2)',
      textPrimary: '#e8e6f8',
      textSecondary: '#b4b0d0',
      textMuted: 'rgba(180, 176, 208, 0.5)',
      accent: '#9090e8',
      accentLight: 'rgba(144, 144, 232, 0.14)',
      accentGlow: 'rgba(144, 144, 232, 0.07)',
      gold: '#d0b060',
      goldGlow: 'rgba(208, 176, 96, 0.07)',
      shadowCard: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      shadowElevated: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
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
