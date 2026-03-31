

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
  logoFontSize: string;
  setLogoFontSize: (size: string) => void;
  logoFontFamily: string;
  setLogoFontFamily: (family: string) => void;
  logoColor: string;
  setLogoColor: (color: string) => void;
  isLogoAnimated: boolean;
  setIsLogoAnimated: (animated: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_LOGO_URL = '/logo.png';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_URL);
  const [appTitle, setAppTitle] = useState<string>('Report-AI');
  const [logoFontSize, setLogoFontSize] = useState('1.5rem');
  const [logoFontFamily, setLogoFontFamily] = useState('');
  const [logoColor, setLogoColor] = useState('#3b82f6');
  const [isLogoAnimated, setIsLogoAnimated] = useState<boolean>(false);


  // Effect to load user-specific theme palette on login
  useEffect(() => {
    if (auth?.user) {
      const userPaletteName = auth.user.color_palette_name;
      const userPalette = COLOR_PALETTES.find(p => p.name === userPaletteName) || DEFAULT_PALETTE;
      setCurrentPalette(userPalette);
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
    logoFontSize,
    setLogoFontSize,
    logoFontFamily,
    setLogoFontFamily,
    logoColor,
    setLogoColor,
    isLogoAnimated,
    setIsLogoAnimated,
  }), [themeMode, currentPalette, logoUrl, appTitle, logoFontSize, logoFontFamily, logoColor, isLogoAnimated]);
  
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