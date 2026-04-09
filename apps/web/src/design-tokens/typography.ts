/**
 * Design tokens - Typography
 * Web-first typography using rem units for font sizes
 */

export const typography = {
  // Font sizes (in pixels for reference)
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 36,
  },

  // Font sizes as rem for web (base 16px) - preferred for web
  fontSizeRem: {
    xs: "0.625rem",
    sm: "0.75rem",
    base: "0.875rem",
    lg: "1rem",
    xl: "1.125rem",
    xxl: "1.25rem",
    xxxl: "1.5rem",
    huge: "2.25rem",
  },

  // Font weights
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font families
  fontFamily: {
    display: '"Space Grotesk", system-ui, sans-serif',
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
} as const;

export type Typography = typeof typography;
export type FontSizeKey = keyof typeof typography.fontSize;
export type FontWeightKey = keyof typeof typography.fontWeight;
