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

const DEFAULT_LOGO_URL = 'data:image/png;base64,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';

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
  
  // Effect to apply theme mode (light/dark)
  useEffect(() => {
    const root = window.document.documentElement;
    const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const initialTheme = storedTheme || 'light';
    setThemeMode(initialTheme);
    
    root.classList.remove('light', 'dark');
    root.classList.add(initialTheme);
    root.style.setProperty('color-scheme', initialTheme);
  }, []);

  // Effect to apply color palette
  useEffect(() => {
    const root = window.document.documentElement;
    Object.entries(currentPalette.colors).forEach(([name, value]) => {
      root.style.setProperty(`--color-${name}`, value as string);
    });
  }, [currentPalette]);

  const toggleTheme = () => {
    setThemeMode(prevMode => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newMode);
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newMode);
      root.style.setProperty('color-scheme', newMode);
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