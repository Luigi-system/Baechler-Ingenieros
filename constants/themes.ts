
import type { ColorPalette } from '../types';

export const DEFAULT_PALETTE: ColorPalette = {
  name: 'Azul Corporativo',
  category: 'Profesional',
  colors: {
    primary: '#3b82f6', // blue-500
    secondary: '#10b981', // emerald-500
    accent: '#f97316', // orange-500
    neutral: '#6b7280', // gray-500
    'base-100': '#ffffff', // white
  },
};

export const COLOR_PALETTES: ColorPalette[] = [
  DEFAULT_PALETTE,
  {
    name: 'Verde Bosque',
    category: 'Profesional',
    colors: { primary: '#22c55e', secondary: '#06b6d4', accent: '#eab308', neutral: '#4b5563', 'base-100': '#ffffff' },
  },
  {
    name: 'Púrpura Real',
    category: 'Profesional',
    colors: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#f59e0b', neutral: '#4b5563', 'base-100': '#ffffff' },
  },
  {
    name: 'Rojo Carmesí',
    category: 'Profesional',
    colors: { primary: '#ef4444', secondary: '#6366f1', accent: '#14b8a6', neutral: '#4b5563', 'base-100': '#ffffff' },
  },
  {
    name: 'Onda Marina',
    category: 'Moderno',
    colors: { primary: '#0ea5e9', secondary: '#a3e635', accent: '#f43f5e', neutral: '#71717a', 'base-100': '#f8fafc' },
  },
  {
    name: 'Brillo del Atardecer',
    category: 'Moderno',
    colors: { primary: '#f97316', secondary: '#d946ef', accent: '#22d3ee', neutral: '#71717a', 'base-100': '#f8fafc' },
  },
   {
    name: 'Menta Fresca',
    category: 'Moderno',
    colors: { primary: '#10b981', secondary: '#60a5fa', accent: '#fbbf24', neutral: '#71717a', 'base-100': '#f8fafc' },
  },
  {
    name: 'Cyberpunk',
    category: 'Vibrante',
    colors: { primary: '#d946ef', secondary: '#22d3ee', accent: '#bef264', neutral: '#e5e7eb', 'base-100': '#111827' },
  },
  {
    name: 'Ritmo Retro',
    category: 'Vibrante',
    colors: { primary: '#fb923c', secondary: '#4ade80', accent: '#c084fc', neutral: '#94a3b8', 'base-100': '#f1f5f9' },
  },
];