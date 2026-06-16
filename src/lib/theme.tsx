'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  applyColors: (colors: Partial<ThemeColors>) => void;
  resetColors: () => void;
  isDark: boolean;
  setDark: (value: boolean) => void;
  toggleDark: () => void;
}

const defaultColors: ThemeColors = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#10b981',
};

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
}

function setCssVariable(name: string, value: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(name, value);
  }
}

function applyThemeColors(colors: ThemeColors) {
  const primaryRgb = hexToRgb(colors.primaryColor);
  const secondaryRgb = hexToRgb(colors.secondaryColor);
  const accentRgb = hexToRgb(colors.accentColor);

  setCssVariable('--color-primary', primaryRgb);
  setCssVariable('--color-secondary', secondaryRgb);
  setCssVariable('--color-accent', accentRgb);

  // We intentionally do NOT override the shade variables (--color-primary-50..950)
  // so that the static Tailwind-compatible RGB definitions in globals.css remain in effect.
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('schoolTheme');
        if (saved) {
          const parsed = JSON.parse(saved) as ThemeColors;
          setColors(parsed);
          applyThemeColors(parsed);
        } else {
          applyThemeColors(defaultColors);
        }
      } catch {
        applyThemeColors(defaultColors);
      }

      const savedMode = localStorage.getItem('aliSimbiDarkMode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = savedMode !== null ? savedMode === 'true' : prefersDark;
      setIsDark(initialDark);
      if (initialDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('aliSimbiDarkMode', String(isDark));
    }
  }, [isDark, mounted]);

  const applyColors = (newColors: Partial<ThemeColors>) => {
    const updated = { ...colors, ...newColors };
    setColors(updated);
    applyThemeColors(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('schoolTheme', JSON.stringify(updated));
    }
  };

  const resetColors = () => {
    setColors(defaultColors);
    applyThemeColors(defaultColors);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('schoolTheme');
    }
  };

  const setDark = (value: boolean) => setIsDark(value);
  const toggleDark = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ colors, applyColors, resetColors, isDark, setDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
