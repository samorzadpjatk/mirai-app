/**
 * Color Tokens - Unified Palette
 *
 * Flat naming convention matching the native app's colors.ts
 * All colors from the native palette mapped to Tamagui tokens.
 *
 * @see https://tamagui.dev/docs/core/tokens#color-tokens
 * @see /apps/native/src/styles/colors.ts (source of truth)
 */

// Primary brand colors
const primaryColors = {
  // Main primary
  primary: "#00ced1",
  accentMagenta: "#E533FF",

  // Primary opacity variants
  primaryOpacity10: "rgba(0, 206, 209, 0.1)",
  primaryOpacity12: "rgba(0, 206, 209, 0.12)",
  primaryOpacity20: "rgba(0, 206, 209, 0.2)",
  primaryOpacity30: "rgba(0, 206, 209, 0.3)",
  primaryOpacity80: "rgba(0, 206, 209, 0.8)",

  // Magenta opacity variants
  magentaOpacity10: "rgba(229, 51, 255, 0.1)",
  magentaOpacity20: "rgba(229, 51, 255, 0.2)",
  magentaOpacity30: "rgba(229, 51, 255, 0.3)",
  magentaOpacity80: "rgba(229, 51, 255, 0.8)",
} as const;

// Background colors
const backgroundColors = {
  backgroundLight: "#f1f1f4",
  backgroundDark: "#17181c",
  backgroundDarkAlt: "#102222",
  cardDark: "#1b2828",
  surfaceDark: "#272935",

  // Background opacity variants
  backgroundDarkOpacity50: "rgba(23, 24, 28, 0.5)",
  backgroundDarkOpacity80: "rgba(23, 24, 28, 0.8)",
  backgroundDarkOpacity45: "rgba(15, 23, 42, 0.45)",
  backgroundDarkOpacity55: "rgba(10, 11, 13, 0.55)",

  // Card opacity variants
  cardDarkOpacity40: "rgba(27, 40, 40, 0.4)",
  cardDarkOpacity45: "rgba(39, 41, 53, 0.45)",
  cardDarkOpacity70: "rgba(27, 40, 40, 0.7)",
} as const;

// Border colors
const borderColors = {
  borderDark: "#395556",
  borderWhite5: "rgba(255, 255, 255, 0.05)",
  borderWhite10: "rgba(255, 255, 255, 0.1)",
  borderWhite18: "rgba(255, 255, 255, 0.18)",
  borderZinc700: "rgba(48, 54, 61, 1)",
} as const;

// Text colors
const textColors = {
  white: "#ffffff",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textTertiary: "#64748b",
  textMuted: "#475569",
} as const;

// White opacity variants (for text and overlays)
const whiteOpacity = {
  whiteOpacity90: "rgba(255, 255, 255, 0.9)",
  whiteOpacity70: "rgba(255, 255, 255, 0.7)",
  whiteOpacity40: "rgba(255, 255, 255, 0.4)",
  whiteOpacity20: "rgba(255, 255, 255, 0.2)",
  whiteOpacity18: "rgba(255, 255, 255, 0.18)",
  whiteOpacity15: "rgba(255, 255, 255, 0.15)",
  whiteOpacity12: "rgba(255, 255, 255, 0.12)",
  whiteOpacity10: "rgba(255, 255, 255, 0.1)",
  whiteOpacity8: "rgba(255, 255, 255, 0.08)",
  whiteOpacity6: "rgba(255, 255, 255, 0.06)",
  whiteOpacity5: "rgba(255, 255, 255, 0.05)",
  whiteOpacity4: "rgba(255, 255, 255, 0.04)",
} as const;

// Black opacity variants
const blackOpacity = {
  blackOpacity40: "rgba(0, 0, 0, 0.4)",
  blackOpacity38: "rgba(0, 0, 0, 0.38)",
  blackOpacity12: "rgba(0, 0, 0, 0.12)",
} as const;

// Gray scale
const grayColors = {
  gray50: "#f9fafb",
  gray100: "#f1f1f4",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
} as const;

// Slate scale
const slateColors = {
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate800: "#1e293b",
} as const;

// Slate opacity variants
const slateOpacity = {
  slateOpacity35: "rgba(148, 163, 184, 0.35)",
} as const;

// Red/Danger colors
const redColors = {
  red300: "#fecaca",
  red400: "#f87171",
  red700: "#b91c1c",
  red900: "#7f1d1d",
  danger: "#ef4444",
} as const;

// Red opacity variants
const redOpacity = {
  red900Opacity30: "rgba(127, 29, 29, 0.3)",
  redOpacity500: "rgba(220, 38, 38, 0.55)",
  redOpacity500Background: "rgba(220, 38, 38, 0.14)",
} as const;

// Danger opacity variants
const dangerOpacity = {
  dangerOpacity12: "rgba(239, 68, 68, 0.12)",
  dangerOpacity15: "rgba(239, 68, 68, 0.15)",
  dangerOpacity35: "rgba(239, 68, 68, 0.35)",
  dangerOpacity45: "rgba(239, 68, 68, 0.45)",
  dangerOpacity50: "rgba(239, 68, 68, 0.5)",
  dangerOpacity85: "rgba(239, 68, 68, 0.85)",
} as const;

// Green/Success colors
const greenColors = {
  success: "#22c55e",
  green400: "#4ade80",
  green700: "#16a34a",
} as const;

// Success opacity variants
const successOpacity = {
  successOpacity08: "rgba(16, 185, 129, 0.08)",
  successOpacity12: "rgba(16, 185, 129, 0.12)",
  successOpacity20: "rgba(16, 185, 129, 0.2)",
  successOpacity35: "rgba(34, 197, 94, 0.35)",
  successOpacity45: "rgba(16, 185, 129, 0.5)",
  successOpacity50: "rgba(16, 185, 129, 0.5)",
  successOpacity90: "rgba(34, 197, 94, 0.9)",
} as const;

// Emerald variants
const emeraldColors = {
  emerald400: "#4ade80",
  emerald500: "#22c55e",
  emerald700: "#16a34a",
} as const;

// Orange/Yellow/Warning colors
const orangeColors = {
  warning: "#f59e0b",
  orange400: "#fb923c",
  orange500: "#f97316",
  orange700: "#c2410c",
  yellow400: "#facc15",
} as const;

// Blue colors
const blueColors = {
  blue100: "#dbeafe",
  blue400: "#60a5fa",
  blue500: "#3b82f6",
  blue700: "#1d4ed8",
} as const;

// Sky colors (for staff voting)
const skyColors = {
  sky400: "#38bdf8",
  sky500: "#0ea5e9",
  sky700: "#0284c7",
} as const;

// Sky opacity variants
const skyOpacity = {
  skyOpacity10: "rgba(14, 165, 233, 0.1)",
  skyOpacity14: "rgba(14, 165, 233, 0.14)",
  skyOpacity35: "rgba(14, 165, 233, 0.35)",
} as const;

// Zinc colors
const zincColors = {
  zinc100: "#f4f4f5",
  zinc700: "#52525b",
  zinc800: "#27272a",
  zinc900: "#18181b",
} as const;

// Status colors
const statusColors = {
  statusHidden: "#64748b",
  statusVisible: "#0ea5e9",
  statusActive: "#22c55e",
  statusVotingPhase: "#f59e0b",
  statusCompleted: "#10b981",
} as const;

// Semantic colors (mapped to theme roles)
const semanticColors = {
  transparent: "transparent",
  currentColor: "currentColor",
  inherit: "inherit",
} as const;

// All color tokens combined
export const colorTokens = {
  ...primaryColors,
  ...backgroundColors,
  ...borderColors,
  ...textColors,
  ...whiteOpacity,
  ...blackOpacity,
  ...grayColors,
  ...slateColors,
  ...slateOpacity,
  ...redColors,
  ...redOpacity,
  ...dangerOpacity,
  ...greenColors,
  ...successOpacity,
  ...emeraldColors,
  ...orangeColors,
  ...blueColors,
  ...skyColors,
  ...skyOpacity,
  ...zincColors,
  ...statusColors,
  ...semanticColors,
} as const;

// Export individual color groups for selective imports
export {
  primaryColors,
  backgroundColors,
  borderColors,
  textColors,
  whiteOpacity,
  blackOpacity,
  grayColors,
  slateColors,
  slateOpacity,
  redColors,
  redOpacity,
  dangerOpacity,
  greenColors,
  successOpacity,
  emeraldColors,
  orangeColors,
  blueColors,
  skyColors,
  skyOpacity,
  zincColors,
  statusColors,
  semanticColors,
};

export default colorTokens;
