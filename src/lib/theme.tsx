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

  setCssVariable('--color-primary', colors.primaryColor);
  setCssVariable('--color-primary-rgb', primaryRgb);
  setCssVariable('--color-secondary', colors.secondaryColor);
  setCssVariable('--color-secondary-rgb', secondaryRgb);
  setCssVariable('--color-accent', colors.accentColor);
  setCssVariable('--color-accent-rgb', accentRgb);

  // Tailwind primary shade mapping (approximate)
  // We compute darker/lighter variants by manipulating HSL
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  shades.forEach((shade) => {
    const cssVar = `--color-primary-${shade}`;
    // Use the primary color as base; for a real implementation we'd compute
    // exact HSL variants. Here we set the variable so that any custom CSS
    // can reference it.
    setCssVariable(cssVar, colors.primaryColor);
  });
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);

  useEffect(() => {
    // Load saved colors from localStorage
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
    }
  }, []);

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

  return (
    <ThemeContext.Provider value={{ colors, applyColors, resetColors }}>
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
