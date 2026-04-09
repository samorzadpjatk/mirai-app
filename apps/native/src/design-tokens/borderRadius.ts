/**
 * Design tokens - Border Radius
 * Cross-platform border radius values matching native app's design system
 */

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/** Border radius values as CSS pixel strings */
export const borderRadiusPx = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  full: "9999px",
} as const;

/** Border radius values as CSS rem strings */
export const borderRadiusRem = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  full: "9999px",
} as const;

export type BorderRadius = typeof borderRadius;
export type BorderRadiusKey = keyof BorderRadius;
