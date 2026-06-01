/**
 * Central design tokens for NutriSnap.
 * A single dark, premium palette — used everywhere so the UI stays consistent
 * and photographs well for screenshots.
 */

export const colors = {
  // Surfaces
  bg: '#0B0B12',
  surface: '#15151F',
  surfaceAlt: '#1C1C28',
  surfaceElevated: '#222230',
  border: '#2A2A3A',

  // Text
  text: '#FFFFFF',
  textDim: '#9A9AB0',
  textFaint: '#63637A',

  // Brand / calories
  brand: '#27E0A0', // mint green
  brandDim: '#16A37B',

  // Macro colors (used consistently across rings, bars, chips)
  protein: '#FF6B6B', // coral
  carbs: '#FFC94D', // amber
  fat: '#5B8DEF', // blue

  // Feedback
  danger: '#FF5A5F',
  warning: '#FFB020',
  track: '#26263A', // ring/bar background track

  // Misc
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const macroMeta = {
  protein: { label: 'Protein', color: colors.protein, kcalPerGram: 4 },
  carbs: { label: 'Carbs', color: colors.carbs, kcalPerGram: 4 },
  fat: { label: 'Fat', color: colors.fat, kcalPerGram: 9 },
} as const;

export type MacroKey = keyof typeof macroMeta;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const font = {
  // System rounded reads as friendly/premium and needs no asset loading
  size: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 40,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
