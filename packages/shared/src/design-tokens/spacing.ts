/**
 * Design tokens - Spacing
 * Cross-platform spacing scale matching native app's design system
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Spacing values as CSS pixel strings */
export const spacingPx = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  xxl: "24px",
  xxxl: "32px",
} as const;

/** Spacing values as CSS rem strings (base 16px) */
export const spacingRem = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  xxl: "1.5rem",
  xxxl: "2rem",
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
