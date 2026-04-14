/**
 * Design Tokens - Spacing, Radii, Z-Index
 *
 * Tamagui uses $-prefixed tokens that map to CSS variables.
 * These tokens provide consistent spacing and sizing across the app.
 *
 * @see https://tamagui.dev/docs/core/tokens
 */

// Spacing tokens ($0-$12)
// Based on 4px grid system from native spacing.ts
// Note: Token names must be valid identifiers (no dots)
export const space = {
  // Base scale (4px increments)
  $0: 0,
  $0_5: 2,
  $1: 4, // xs
  $2: 8, // sm
  $3: 12, // md
  $4: 16, // lg
  $5: 20, // xl
  $6: 24, // xxl
  $7: 28,
  $8: 32, // xxxl
  $9: 40,
  $10: 48,
  $11: 64,
  $12: 80,

  // Named aliases for semantic use
  $xs: 4,
  $sm: 8,
  $md: 12,
  $lg: 16,
  $xl: 20,
  $xxl: 24,
  $xxxl: 32,
  $huge: 48,

  // Negative values (for margins)
  $n1: -4,
  $n2: -8,
  $n3: -12,
  $n4: -16,
  $n5: -20,
  $n6: -24,
  $n7: -28,
  $n8: -32,
  $n9: -40,
  $n10: -48,
  $n11: -64,
  $n12: -80,
} as const;

// Size tokens (widths, heights)
export const size = {
  // Same scale as space for consistency
  $0: 0,
  $0_5: 2,
  $1: 4,
  $2: 8,
  $3: 12,
  $4: 16,
  $5: 20,
  $6: 24,
  $7: 28,
  $8: 32,
  $9: 40,
  $10: 48,
  $11: 64,
  $12: 80,

  // Semantic sizes
  $xs: 4,
  $sm: 8,
  $md: 12,
  $lg: 16,
  $xl: 20,
  $xxl: 24,
  $xxxl: 32,
  $huge: 48,

  // Component sizes
  $buttonSm: 32,
  $buttonMd: 40,
  $buttonLg: 48,
  $inputHeight: 48,
  $avatarSm: 32,
  $avatarMd: 48,
  $avatarLg: 64,
  $iconSm: 16,
  $iconMd: 24,
  $iconLg: 32,
} as const;

// Border radius tokens
export const radius = {
  $0: 0,
  $1: 4,
  $2: 8, // sm
  $3: 12, // md
  $4: 16, // lg
  $5: 20, // xl
  $6: 24,
  $7: 28,
  $8: 32,
  $true: 8, // Default
  $full: 9999,

  // Semantic aliases
  $sm: 8,
  $md: 12,
  $lg: 16,
  $xl: 20,
} as const;

// Z-index tokens
export const zIndex = {
  $0: 0,
  $1: 10,
  $2: 20,
  $3: 30,
  $4: 40,
  $5: 50,

  // Semantic z-index values
  $base: 0,
  $dropdown: 100,
  $sticky: 200,
  $fixed: 300,
  $modal: 400,
  $popover: 500,
  $tooltip: 600,
  $toast: 700,
} as const;

// Line height tokens
export const lineHeight = {
  $1: 16,
  $2: 20,
  $3: 24,
  $4: 28,
  $5: 32,
  $6: 40,
  $7: 48,
  $8: 64,
  $9: 80,
  $10: 96,

  // Relative line heights
  $tight: 1.2,
  $normal: 1.5,
  $relaxed: 1.75,
} as const;

// Letter spacing tokens
export const letterSpacing = {
  $tighter: -0.05,
  $tight: -0.025,
  $normal: 0,
  $wide: 0.025,
  $wider: 0.05,
  $widest: 0.1,
} as const;

// All tokens combined for Tamagui config
export const tokens = {
  space,
  size,
  radius,
  zIndex,
  lineHeight,
  letterSpacing,
} as const;

export default tokens;
