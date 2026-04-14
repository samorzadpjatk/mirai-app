/**
 * Light and Dark Theme Objects
 *
 * Theme tokens that map semantic names to color values.
 * These themes use the flat color naming from the native app.
 *
 * @see https://tamagui.dev/docs/core/themes
 */

import { colorTokens } from "./colors";

// Light theme - defined using flat color naming convention
export const lightTheme = {
  // Background tokens
  background: colorTokens.backgroundLight,
  backgroundHover: colorTokens.gray100,
  backgroundPress: colorTokens.gray200,
  backgroundFocus: colorTokens.gray100,
  backgroundStrong: colorTokens.gray50,
  backgroundTransparent: colorTokens.whiteOpacity90,

  // Card/surface backgrounds
  surface: colorTokens.white,
  surfaceHover: colorTokens.gray50,
  surfacePress: colorTokens.gray100,

  // Card variant backgrounds
  card: colorTokens.white,
  cardHover: colorTokens.gray50,
  cardPress: colorTokens.gray100,

  // Foreground/Text tokens
  color: colorTokens.gray900,
  colorHover: colorTokens.gray800,
  colorPress: colorTokens.gray900,
  colorFocus: colorTokens.gray800,

  // Text hierarchy
  colorStrong: colorTokens.gray900,
  colorMuted: colorTokens.textSecondary,
  colorTertiary: colorTokens.textTertiary,

  // Border tokens
  borderColor: colorTokens.gray200,
  borderColorHover: colorTokens.gray300,
  borderColorPress: colorTokens.gray300,
  borderColorFocus: colorTokens.primary,

  // Primary brand
  primary: colorTokens.primary,
  primaryHover: colorTokens.primaryOpacity80,
  primaryPress: colorTokens.primaryOpacity30,
  primaryFocus: colorTokens.primary,

  // Secondary/Accent
  accent: colorTokens.accentMagenta,
  accentHover: colorTokens.magentaOpacity80,
  accentPress: colorTokens.magentaOpacity30,

  // Status colors
  success: colorTokens.success,
  successHover: colorTokens.emerald400,
  successPress: colorTokens.successOpacity20,

  warning: colorTokens.warning,
  warningHover: colorTokens.orange400,
  warningPress: colorTokens.orange400,

  danger: colorTokens.danger,
  dangerHover: colorTokens.red400,
  dangerPress: colorTokens.dangerOpacity15,
  dangerFocus: colorTokens.red700,

  info: colorTokens.sky500,
  infoHover: colorTokens.sky400,
  infoPress: colorTokens.skyOpacity10,

  // Shadow
  shadowColor: colorTokens.blackOpacity12,
  shadowColorHover: colorTokens.blackOpacity38,

  // Placeholder
  placeholderColor: colorTokens.textTertiary,

  // Overlay
  overlay: colorTokens.blackOpacity38,

  // Utility
  transparent: colorTokens.transparent,
} as const;

// Dark theme - defined using flat color naming convention
export const darkTheme = {
  // Background tokens
  background: colorTokens.backgroundDark,
  backgroundHover: colorTokens.cardDark,
  backgroundPress: colorTokens.surfaceDark,
  backgroundFocus: colorTokens.cardDark,
  backgroundStrong: colorTokens.backgroundDarkAlt,
  backgroundTransparent: colorTokens.backgroundDarkOpacity80,

  // Card/surface backgrounds
  surface: colorTokens.cardDark,
  surfaceHover: colorTokens.surfaceDark,
  surfacePress: colorTokens.backgroundDarkAlt,

  // Card variant backgrounds
  card: colorTokens.cardDark,
  cardHover: colorTokens.cardDarkOpacity70,
  cardPress: colorTokens.surfaceDark,

  // Foreground/Text tokens
  color: colorTokens.textPrimary,
  colorHover: colorTokens.whiteOpacity90,
  colorPress: colorTokens.textPrimary,
  colorFocus: colorTokens.whiteOpacity90,

  // Text hierarchy
  colorStrong: colorTokens.white,
  colorMuted: colorTokens.textSecondary,
  colorTertiary: colorTokens.textTertiary,

  // Border tokens
  borderColor: colorTokens.borderDark,
  borderColorHover: colorTokens.zinc700,
  borderColorPress: colorTokens.borderWhite10,
  borderColorFocus: colorTokens.primary,

  // Primary brand
  primary: colorTokens.primary,
  primaryHover: colorTokens.primaryOpacity80,
  primaryPress: colorTokens.primaryOpacity30,
  primaryFocus: colorTokens.primary,

  // Secondary/Accent
  accent: colorTokens.accentMagenta,
  accentHover: colorTokens.magentaOpacity80,
  accentPress: colorTokens.magentaOpacity30,

  // Status colors
  success: colorTokens.success,
  successHover: colorTokens.emerald400,
  successPress: colorTokens.successOpacity20,

  warning: colorTokens.warning,
  warningHover: colorTokens.orange400,
  warningPress: colorTokens.orange400,

  danger: colorTokens.danger,
  dangerHover: colorTokens.red400,
  dangerPress: colorTokens.dangerOpacity15,
  dangerFocus: colorTokens.red900,

  info: colorTokens.sky500,
  infoHover: colorTokens.sky400,
  infoPress: colorTokens.skyOpacity14,

  // Shadow
  shadowColor: colorTokens.blackOpacity40,
  shadowColorHover: colorTokens.blackOpacity40,

  // Placeholder
  placeholderColor: colorTokens.textTertiary,

  // Overlay
  overlay: colorTokens.backgroundDarkOpacity80,

  // Utility
  transparent: colorTokens.transparent,
} as const;

// Theme collection for Tamagui config
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

// Additional theme variants for specific use cases
export const themeVariants = {
  // High contrast variants (accessibility)
  "light-hc": {
    ...lightTheme,
    color: "#000000",
    colorMuted: "#333333",
    borderColor: "#000000",
    background: "#ffffff",
  },
  "dark-hc": {
    ...darkTheme,
    color: "#ffffff",
    colorMuted: "#cccccc",
    borderColor: "#ffffff",
    background: "#000000",
  },

  // Brand emphasis variant
  "light-brand": {
    ...lightTheme,
    primary: colorTokens.primary,
    background: colorTokens.primaryOpacity10,
  },
  "dark-brand": {
    ...darkTheme,
    primary: colorTokens.primary,
    background: colorTokens.primaryOpacity20,
  },
};

// All themes combined
export const allThemes = {
  ...themes,
  ...themeVariants,
};

export default themes;
