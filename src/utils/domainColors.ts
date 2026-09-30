import { AppraisalInstrument } from '../types';

export interface DomainColorPalette {
  id: string;
  name: string;
  hex: string;
  bgLight: string;
  bgMedium: string;
  textDark: string;
  borderClass: string;
  ringClass: string;
  badgeClass: string;
  markerClass: string;
}

export const DOMAIN_COLOR_PALETTES: DomainColorPalette[] = [
  {
    id: 'emerald',
    name: 'Smaragdgrønn (PICO & Formål)',
    hex: '#10b981',
    bgLight: 'bg-emerald-50',
    bgMedium: 'bg-emerald-100',
    textDark: 'text-emerald-950',
    borderClass: 'border-emerald-400',
    ringClass: 'ring-emerald-500',
    badgeClass: 'bg-emerald-600 text-white',
    markerClass: 'bg-emerald-200 text-emerald-950 border border-emerald-400'
  },
  {
    id: 'blue',
    name: 'Kongeblå (Protokoll & Metoder)',
    hex: '#3b82f6',
    bgLight: 'bg-blue-50',
    bgMedium: 'bg-blue-100',
    textDark: 'text-blue-950',
    borderClass: 'border-blue-400',
    ringClass: 'ring-blue-500',
    badgeClass: 'bg-blue-600 text-white',
    markerClass: 'bg-blue-200 text-blue-950 border border-blue-400'
  },
  {
    id: 'purple',
    name: 'Fiolett (Søkestrategi & Databaser)',
    hex: '#8b5cf6',
    bgLight: 'bg-purple-50',
    bgMedium: 'bg-purple-100',
    textDark: 'text-purple-950',
    borderClass: 'border-purple-400',
    ringClass: 'ring-purple-500',
    badgeClass: 'bg-purple-600 text-white',
    markerClass: 'bg-purple-200 text-purple-950 border border-purple-400'
  },
  {
    id: 'amber',
    name: 'Gyllen rav (Kvalitet & RoB 2)',
    hex: '#f59e0b',
    bgLight: 'bg-amber-50',
    bgMedium: 'bg-amber-100',
    textDark: 'text-amber-950',
    borderClass: 'border-amber-400',
    ringClass: 'ring-amber-500',
    badgeClass: 'bg-amber-600 text-white',
    markerClass: 'bg-amber-200 text-amber-950 border border-amber-400'
  },
  {
    id: 'rose',
    name: 'Rubinrød (Eksklusjon & Bias)',
    hex: '#f43f5e',
    bgLight: 'bg-rose-50',
    bgMedium: 'bg-rose-100',
    textDark: 'text-rose-950',
    borderClass: 'border-rose-400',
    ringClass: 'ring-rose-500',
    badgeClass: 'bg-rose-600 text-white',
    markerClass: 'bg-rose-200 text-rose-950 border border-rose-400'
  },
  {
    id: 'cyan',
    name: 'Turkis/Cyan (Statistikk & Syntese)',
    hex: '#06b6d4',
    bgLight: 'bg-cyan-50',
    bgMedium: 'bg-cyan-100',
    textDark: 'text-cyan-950',
    borderClass: 'border-cyan-400',
    ringClass: 'ring-cyan-500',
    badgeClass: 'bg-cyan-600 text-white',
    markerClass: 'bg-cyan-200 text-cyan-950 border border-cyan-400'
  },
  {
    id: 'indigo',
    name: 'Indigo (Heterogenitet & Skjevhet)',
    hex: '#6366f1',
    bgLight: 'bg-indigo-50',
    bgMedium: 'bg-indigo-100',
    textDark: 'text-indigo-950',
    borderClass: 'border-indigo-400',
    ringClass: 'ring-indigo-500',
    badgeClass: 'bg-indigo-600 text-white',
    markerClass: 'bg-indigo-200 text-indigo-950 border border-indigo-400'
  },
  {
    id: 'teal',
    name: 'Mørk teal (Interessenter & Brukermedvirkning)',
    hex: '#0d9488',
    bgLight: 'bg-teal-50',
    bgMedium: 'bg-teal-100',
    textDark: 'text-teal-950',
    borderClass: 'border-teal-400',
    ringClass: 'ring-teal-500',
    badgeClass: 'bg-teal-600 text-white',
    markerClass: 'bg-teal-200 text-teal-950 border border-teal-400'
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia (Implementering & Anvendbarhet)',
    hex: '#c026d3',
    bgLight: 'bg-fuchsia-50',
    bgMedium: 'bg-fuchsia-100',
    textDark: 'text-fuchsia-950',
    borderClass: 'border-fuchsia-400',
    ringClass: 'ring-fuchsia-500',
    badgeClass: 'bg-fuchsia-600 text-white',
    markerClass: 'bg-fuchsia-200 text-fuchsia-950 border border-fuchsia-400'
  },
  {
    id: 'orange',
    name: 'Brent oransje (Uavhengighet & Habilitet)',
    hex: '#ea580c',
    bgLight: 'bg-orange-50',
    bgMedium: 'bg-orange-100',
    textDark: 'text-orange-950',
    borderClass: 'border-orange-400',
    ringClass: 'ring-orange-500',
    badgeClass: 'bg-orange-600 text-white',
    markerClass: 'bg-orange-200 text-orange-950 border border-orange-400'
  },
  {
    id: 'lime',
    name: 'Limegrønn (Konklusjon & Anbefaling)',
    hex: '#65a30d',
    bgLight: 'bg-lime-50',
    bgMedium: 'bg-lime-100',
    textDark: 'text-lime-950',
    borderClass: 'border-lime-400',
    ringClass: 'ring-lime-500',
    badgeClass: 'bg-lime-600 text-white',
    markerClass: 'bg-lime-200 text-lime-950 border border-lime-400'
  }
];

export function getDomainColorPalette(domainIndex: number): DomainColorPalette {
  const index = Math.abs(domainIndex) % DOMAIN_COLOR_PALETTES.length;
  return DOMAIN_COLOR_PALETTES[index];
}

export function getDomainColorByDomainId(domainId: string): DomainColorPalette {
  // Hash domainId to a stable color palette index
  let hash = 0;
  for (let i = 0; i < domainId.length; i++) {
    hash = (hash << 5) - hash + domainId.charCodeAt(i);
    hash |= 0;
  }
  return getDomainColorPalette(Math.abs(hash));
}
