/* ═══════════════════════════════════════════════════════════════
   PREMIUM COURSE COLOR PALETTE
   Inspired by: J.P. Morgan, Amex, Charles Schwab, Goldman Sachs,
   Fidelity, Morgan Stanley, Vanguard, BlackRock, UBS
   ═══════════════════════════════════════════════════════════════ */

export type ColorCategory = 'brown' | 'blue' | 'green' | 'warm' | 'cool' | 'jewel';

export interface CourseColor {
  name: string;
  hex: string;
  category: ColorCategory;
}

// Browns - J.P. Morgan, UBS, Private Banking
const BROWNS: CourseColor[] = [
  { name: 'J.P. Morgan', hex: '#4A3728', category: 'brown' },
  { name: 'Espresso', hex: '#3C2415', category: 'brown' },
  { name: 'Mahogany', hex: '#5D3A1A', category: 'brown' },
  { name: 'Cognac', hex: '#9A463D', category: 'brown' },
  { name: 'Walnut', hex: '#5D432C', category: 'brown' },
  { name: 'UBS Brown', hex: '#6E4C3E', category: 'brown' },
];

// Blues - Amex, Schwab, Goldman
const BLUES: CourseColor[] = [
  { name: 'Amex Blue', hex: '#006FCF', category: 'blue' },
  { name: 'Schwab Teal', hex: '#00A0DF', category: 'blue' },
  { name: 'Navy', hex: '#1E3A5F', category: 'blue' },
  { name: 'Sapphire', hex: '#0F52BA', category: 'blue' },
  { name: 'Ocean', hex: '#1A7F8E', category: 'blue' },
];

// Greens - Fidelity, BlackRock
const GREENS: CourseColor[] = [
  { name: 'Fidelity', hex: '#4A8522', category: 'green' },
  { name: 'Emerald', hex: '#046A38', category: 'green' },
  { name: 'Sage', hex: '#7D8B75', category: 'green' },
  { name: 'Forest', hex: '#2D5A45', category: 'green' },
];

// Warm Metallics - Premium card tiers
const WARM_METALLICS: CourseColor[] = [
  { name: 'Gold', hex: '#C9A962', category: 'warm' },
  { name: 'Bronze', hex: '#B08D57', category: 'warm' },
  { name: 'Copper', hex: '#B87333', category: 'warm' },
  { name: 'Rose Gold', hex: '#B76E79', category: 'warm' },
];

// Cool Metallics
const COOL_METALLICS: CourseColor[] = [
  { name: 'Platinum', hex: '#A8A9AD', category: 'cool' },
  { name: 'Steel', hex: '#71797E', category: 'cool' },
  { name: 'Slate', hex: '#64748B', category: 'cool' },
  { name: 'Graphite', hex: '#54585A', category: 'cool' },
];

// Jewel Tones & Reds - Vanguard
const JEWEL_TONES: CourseColor[] = [
  { name: 'Burgundy', hex: '#96172E', category: 'jewel' },
  { name: 'Wine', hex: '#722F37', category: 'jewel' },
  { name: 'Plum', hex: '#6B3654', category: 'jewel' },
  { name: 'Terracotta', hex: '#C4725D', category: 'jewel' },
  { name: 'Indigo', hex: '#4B5D78', category: 'jewel' },
];

// All colors combined
export const COURSE_COLORS: CourseColor[] = [
  ...BROWNS,
  ...BLUES,
  ...GREENS,
  ...WARM_METALLICS,
  ...COOL_METALLICS,
  ...JEWEL_TONES,
];

// Organized by category for picker UI
export const COLOR_CATEGORIES = {
  brown: { label: 'Browns', colors: BROWNS },
  blue: { label: 'Blues', colors: BLUES },
  green: { label: 'Greens', colors: GREENS },
  warm: { label: 'Warm Metallics', colors: WARM_METALLICS },
  cool: { label: 'Cool Metallics', colors: COOL_METALLICS },
  jewel: { label: 'Jewel Tones', colors: JEWEL_TONES },
} as const;

/**
 * Sentinel value used as a fallback when a course has no color stored in the
 * database. Centralised here so useCourses.tsx and Calendar.tsx don't
 * duplicate the same magic string.
 */
export const LEGACY_DEFAULT_COURSE_COLOR = '#7C3AED';

// Default color sequence for new courses (diverse mix)
export const DEFAULT_COLOR_SEQUENCE = [
  '#4A3728',  // J.P. Morgan Brown
  '#006FCF',  // Amex Blue
  '#C9A962',  // Gold
  '#4A8522',  // Fidelity Green
  '#96172E',  // Burgundy
  '#00A0DF',  // Schwab Teal
  '#5D3A1A',  // Mahogany
  '#64748B',  // Slate
];

/**
 * Get the next available color from the palette based on existing courses
 */
export function getNextColor(existingColors: string[]): string {
  // Find the first color from default sequence not already used
  for (const hex of DEFAULT_COLOR_SEQUENCE) {
    if (!existingColors.includes(hex)) {
      return hex;
    }
  }
  // If all default colors are used, cycle through based on count
  const index = existingColors.length % DEFAULT_COLOR_SEQUENCE.length;
  return DEFAULT_COLOR_SEQUENCE[index];
}

/**
 * Get color by index (for initial assignment)
 */
export function getColorByIndex(index: number): string {
  return DEFAULT_COLOR_SEQUENCE[index % DEFAULT_COLOR_SEQUENCE.length];
}

/**
 * Get all available colors for color picker
 */
export function getAllColors(): CourseColor[] {
  return [...COURSE_COLORS];
}

/**
 * Lighten a hex color for backgrounds
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Convert hex color to RGB string (without alpha) for CSS variables
 */
export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Get color name by hex value
 */
export function getColorName(hex: string): string {
  const color = COURSE_COLORS.find(c => c.hex === hex);
  return color?.name || 'Custom';
}
