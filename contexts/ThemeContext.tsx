
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import type { ThemeMode, ColorPalette } from '../types';
import { COLOR_PALETTES, DEFAULT_PALETTE } from '../constants/themes';
import { AuthContext } from './AuthContext';

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  currentPalette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  appTitle: string;
  setAppTitle: (title: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_LOGO_URL = 'https://jhhlrndxepowacrndhni.supabase.co/storage/v1/object/public/assets/report-ai-logo.png';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_URL);
  const [appTitle, setAppTitle] = useState<string>('Report-AI');

  // Initialize theme from user profile on login
  useEffect(() => {
    if (auth?.user) {
      const userPaletteName = auth.user.color_palette_name;
      const userPalette = COLOR_PALETTES.find(p => p.name === userPaletteName) || DEFAULT_PALETTE;
      setCurrentPalette(userPalette);

      setLogoUrl(auth.user.logo_url || DEFAULT_LOGO_URL);
      setAppTitle(auth.user.app_title || 'Report-AI');
    }
  }, [auth?.user]);
  
  // Effect to apply theme mode (light/dark) class on initial load
  useEffect(() => {
    const root = window.document.documentElement;
    const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const initialTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setThemeMode(initialTheme);
    
    root.classList.remove('light', 'dark');
    root.classList.add(initialTheme);
  }, []);

  // Effect to apply color palette CSS variables
  useEffect(() => {
    const root = window.document.documentElement;
    const colorsToApply = themeMode === 'dark' ? currentPalette.dark : currentPalette.light;
    
    for (const [name, value] of Object.entries(colorsToApply)) {
      // FIX: Cast `value` to string, as Object.entries types it as `unknown` but our ColorSet guarantees a string.
      root.style.setProperty(`--color-${name}`, value as string);
    }
  }, [currentPalette, themeMode]);

  const toggleTheme = () => {
    setThemeMode(prevMode => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newMode);
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newMode);
      return newMode;
    });
  };

  const value = useMemo(() => ({
    themeMode,
    toggleTheme,
    currentPalette,
    setPalette: setCurrentPalette,
    logoUrl,
    setLogoUrl,
    appTitle,
    setAppTitle,
  }), [themeMode, currentPalette, logoUrl, appTitle]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
