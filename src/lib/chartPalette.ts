/**
 * Centralized chart color palette.
 * Hex values correspond to CSS variables --chart-1 through --chart-6
 * (hsl values from index.css :root defaults).
 *
 * Using hex for SVG / Recharts attribute compatibility.
 * For theme-switching, colors are picked to work well in both light/dark.
 */

export const CHART_PALETTE = [
  '#8B5CF6', // chart-1: violet
  '#F05A28', // chart-2: orange
  '#3B82F6', // chart-3: blue
  '#F59E0B', // chart-4: amber
  '#EC4899', // chart-5: pink
  '#06B6D4', // chart-6: cyan
] as const;

/** Assignment category → display color */
export const ASSIGNMENT_TYPE_COLORS: Record<string, string> = {
  quiz:        '#F59E0B', // amber
  homework:    '#3B82F6', // blue
  exam:        '#EF4444', // red
  project:     '#8B5CF6', // violet
  discussion:  '#EC4899', // pink
  lab:         '#6366F1', // indigo
  essay:       '#F05A28', // orange
  other:       '#6B7280', // gray
};

/** Sentiment/status → display color for AI advisor widgets */
export const SENTIMENT_COLORS: Record<string, string> = {
  excellent:          '#10B981',
  good:               '#06B6D4',
  'needs-attention':  '#F59E0B',
  critical:           '#EF4444',
};
