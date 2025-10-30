import type { ColorPalette } from '../types';

const professionalBaseLight = {
  primary: '#3b82f6', 'primary-focus': '#2563eb', 'primary-light': '#60a5fa', 'primary-lighter': '#dbeafe',
  secondary: '#10b981', accent: '#f97316', neutral: '#6b7280',
  'base-100': '#f8fafc', // Softer background (slate-50)
  'base-200': '#ffffff', // Cards remain white for contrast
  'base-300': '#f1f5f9', // Hover and subtle backgrounds (slate-100)
  'base-content': '#1f2937', 
  'base-border': '#e2e8f0', // Softer border (slate-200)
  info: '#0ea5e9', success: '#22c55e', warning: '#f59e0b', error: '#ef4444',
};

const professionalBaseDark = {
  primary: '#3b82f6', 'primary-focus': '#60a5fa', 'primary-light': '#2563eb', 'primary-lighter': '#1e3a8a',
  secondary: '#10b981', accent: '#f97316', neutral: '#9ca3af',
  'base-100': '#111827', 'base-200': '#1f2937', 'base-300': '#374151',
  'base-content': '#f9fafb', 'base-border': '#4b5563',
  info: '#0ea5e9', success: '#22c55e', warning: '#f59e0b', error: '#ef4444',
};

export const DEFAULT_PALETTE: ColorPalette = {
  name: 'Azul Corporativo',
  category: 'Profesional',
  light: professionalBaseLight,
  dark: professionalBaseDark,
};

export const COLOR_PALETTES: ColorPalette[] = [
  DEFAULT_PALETTE,
  {
    name: 'Verde Bosque',
    category: 'Profesional',
    light: { ...professionalBaseLight, primary: '#22c55e', 'primary-focus': '#16a34a', 'primary-light': '#4ade80', 'primary-lighter': '#dcfce7', secondary: '#06b6d4', accent: '#eab308' },
    dark: { ...professionalBaseDark, primary: '#22c55e', 'primary-focus': '#4ade80', 'primary-light': '#16a34a', 'primary-lighter': '#14532d', secondary: '#06b6d4', accent: '#eab308' },
  },
  {
    name: 'Púrpura Real',
    category: 'Profesional',
    light: { ...professionalBaseLight, primary: '#8b5cf6', 'primary-focus': '#7c3aed', 'primary-light': '#a78bfa', 'primary-lighter': '#ede9fe', secondary: '#ec4899', accent: '#f59e0b' },
    dark: { ...professionalBaseDark, primary: '#8b5cf6', 'primary-focus': '#a78bfa', 'primary-light': '#7c3aed', 'primary-lighter': '#4c1d95', secondary: '#ec4899', accent: '#f59e0b' },
  },
  {
    name: 'Rojo Carmesí',
    category: 'Profesional',
    light: { ...professionalBaseLight, primary: '#ef4444', 'primary-focus': '#dc2626', 'primary-light': '#f87171', 'primary-lighter': '#fee2e2', secondary: '#6366f1', accent: '#14b8a6' },
    dark: { ...professionalBaseDark, primary: '#ef4444', 'primary-focus': '#f87171', 'primary-light': '#dc2626', 'primary-lighter': '#7f1d1d', secondary: '#6366f1', accent: '#14b8a6' },
  },
];