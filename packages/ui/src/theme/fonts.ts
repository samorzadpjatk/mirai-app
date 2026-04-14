/**
 * Font Definitions
 *
 * Space Grotesk for headings, Inter for body text.
 * Font weights and sizes based on native typography.ts
 *
 * @see https://tamagui.dev/docs/core/configuration#font-tokens
 */

import { createFont } from "tamagui";

// Space Grotesk - Headings
// Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
export const headingFont = createFont({
  family: "Space Grotesk, -apple-system, system-ui, sans-serif",
  size: {
    1: 10, // xs
    2: 12, // sm
    3: 14, // base
    4: 16, // lg
    5: 18, // xl
    6: 20, // xxl
    7: 24, // xxxl
    8: 28,
    9: 32,
    10: 36, // huge
    11: 40,
    12: 48,
    13: 56,
    14: 64,

    // Semantic aliases
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 36,

    // Display sizes
    $xs: 10,
    $sm: 12,
    $base: 14,
    $lg: 16,
    $xl: 18,
    $xxl: 20,
    $xxxl: 24,
    $huge: 36,
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 52,
    11: 60,
    12: 68,
    13: 76,
    14: 84,

    // Named line heights
    $tight: 1.2,
    $normal: 1.5,
    $relaxed: 1.75,
  },
  weight: {
    1: "300",
    2: "400",
    3: "500",
    4: "600",
    5: "700",
    6: "700",
    7: "700",
    8: "700",
    9: "700",
    10: "700",
    11: "700",
    12: "700",
    13: "700",
    14: "700",

    // Semantic weights
    $light: "300",
    $normal: "400",
    $medium: "500",
    $semibold: "600",
    $bold: "700",
  },
  letterSpacing: {
    1: -0.02,
    2: -0.01,
    3: 0,
    4: 0,
    5: 0.01,
    6: 0.02,
    7: 0.02,
    8: 0.02,
    9: 0.02,
    10: 0.02,
    11: 0.02,
    12: 0.02,
    13: 0.02,
    14: 0.02,

    // Named letter spacing
    $tighter: -0.05,
    $tight: -0.025,
    $normal: 0,
    $wide: 0.025,
    $wider: 0.05,
    $widest: 0.1,
  },
  face: {
    300: { normal: "SpaceGrotesk-Light", italic: "SpaceGrotesk-Light" },
    400: { normal: "SpaceGrotesk-Regular", italic: "SpaceGrotesk-Regular" },
    500: { normal: "SpaceGrotesk-Medium", italic: "SpaceGrotesk-Medium" },
    600: { normal: "SpaceGrotesk-SemiBold", italic: "SpaceGrotesk-SemiBold" },
    700: { normal: "SpaceGrotesk-Bold", italic: "SpaceGrotesk-Bold" },
  },
});

// Inter - Body text
// Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
export const bodyFont = createFont({
  family:
    "Inter, -apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  size: {
    1: 10, // xs
    2: 12, // sm
    3: 14, // base
    4: 16, // lg
    5: 18, // xl
    6: 20, // xxl
    7: 24, // xxxl
    8: 28,
    9: 32,
    10: 36, // huge
    11: 40,
    12: 48,
    13: 56,
    14: 64,

    // Semantic aliases
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 36,

    // Display sizes
    $xs: 10,
    $sm: 12,
    $base: 14,
    $lg: 16,
    $xl: 18,
    $xxl: 20,
    $xxxl: 24,
    $huge: 36,
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 52,
    11: 60,
    12: 68,
    13: 76,
    14: 84,

    // Named line heights
    $tight: 1.2,
    $normal: 1.5,
    $relaxed: 1.75,
  },
  weight: {
    1: "300",
    2: "400",
    3: "500",
    4: "600",
    5: "700",
    6: "700",
    7: "700",
    8: "700",
    9: "700",
    10: "700",
    11: "700",
    12: "700",
    13: "700",
    14: "700",

    // Semantic weights
    $light: "300",
    $normal: "400",
    $medium: "500",
    $semibold: "600",
    $bold: "700",
  },
  letterSpacing: {
    1: -0.01,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0.01,
    7: 0.01,
    8: 0.01,
    9: 0.01,
    10: 0.01,
    11: 0.01,
    12: 0.01,
    13: 0.01,
    14: 0.01,

    // Named letter spacing
    $tighter: -0.05,
    $tight: -0.025,
    $normal: 0,
    $wide: 0.025,
    $wider: 0.05,
    $widest: 0.1,
  },
  face: {
    300: { normal: "Inter-Light", italic: "Inter-LightItalic" },
    400: { normal: "Inter-Regular", italic: "Inter-Italic" },
    500: { normal: "Inter-Medium", italic: "Inter-MediumItalic" },
    600: { normal: "Inter-SemiBold", italic: "Inter-SemiBoldItalic" },
    700: { normal: "Inter-Bold", italic: "Inter-BoldItalic" },
  },
});

// Monospace font for code/technical content
export const monoFont = createFont({
  family: "JetBrains Mono, Fira Code, SF Mono, Monaco, Inconsolata, monospace",
  size: {
    1: 10,
    2: 12,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
    10: 36,
    11: 40,
    12: 48,
    13: 56,
    14: 64,
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 52,
    11: 60,
    12: 68,
    13: 76,
    14: 84,
  },
  weight: {
    1: "400",
    2: "400",
    3: "400",
    4: "500",
    5: "600",
    6: "700",
    7: "700",
    8: "700",
    9: "700",
    10: "700",
    11: "700",
    12: "700",
    13: "700",
    14: "700",
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
  },
});

// Font collection for Tamagui config
export const fonts = {
  heading: headingFont,
  body: bodyFont,
  mono: monoFont,
} as const;

export default fonts;
