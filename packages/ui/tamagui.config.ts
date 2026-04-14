/**
 * Tamagui UI Theme Configuration
 *
 * This file exports the main Tamagui configuration with:
 * - Design tokens (colors, spacing, typography)
 * - Light/Dark theme objects
 * - Font definitions (Space Grotesk + Inter)
 * - Animation configurations
 *
 * This is the source of truth for the entire UI system.
 *
 * @see https://tamagui.dev/docs/core/configuration
 */

import { createTamagui } from "tamagui";
import { colorTokens } from "./src/theme/colors";
import { tokens } from "./src/theme/tokens";
import { fonts } from "./src/theme/fonts";
import { allThemes } from "./src/theme/themes";
import { animations } from "./src/theme/animations";

// Main Tamagui configuration
// Combines tokens, themes, fonts, and animations into a unified system
export const config = createTamagui({
  // Design tokens (colors, spacing, sizing, z-index)
  tokens: {
    color: colorTokens,
    space: tokens.space,
    size: tokens.size,
    radius: tokens.radius,
    zIndex: tokens.zIndex,
    lineHeight: tokens.lineHeight,
    letterSpacing: tokens.letterSpacing,
  },

  // Theme definitions (light, dark, and variants)
  themes: allThemes,

  // Font definitions (Space Grotesk for headings, Inter for body)
  fonts,

  // Animation configurations for transitions and effects
  animations,

  // Media query breakpoints for responsive design
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    gtXl: { minWidth: 1420 + 1 },
    gtXxl: { minWidth: 1600 + 1 },
  },

  // Shorthands for common style properties
  // These allow writing `px` instead of `paddingHorizontal`
  shorthands: {
    // Padding
    px: "paddingHorizontal",
    py: "paddingVertical",
    pt: "paddingTop",
    pr: "paddingRight",
    pb: "paddingBottom",
    pl: "paddingLeft",
    p: "padding",

    // Margin
    mx: "marginHorizontal",
    my: "marginVertical",
    mt: "marginTop",
    mr: "marginRight",
    mb: "marginBottom",
    ml: "marginLeft",
    m: "margin",

    // Border
    bw: "borderWidth",
    bc: "borderColor",
    br: "borderRadius",

    // Size
    w: "width",
    h: "height",
    minW: "minWidth",
    minH: "minHeight",
    maxW: "maxWidth",
    maxH: "maxHeight",

    // Flex
    fd: "flexDirection",
    jc: "justifyContent",
    ai: "alignItems",
    ac: "alignContent",
    fw: "flexWrap",

    // Other
    bg: "backgroundColor",
    c: "color",
    fs: "fontSize",
    ff: "fontFamily",
    fwght: "fontWeight",
    ls: "letterSpacing",
    lh: "lineHeight",
    ta: "textAlign",
    pe: "pointerEvents",
    ov: "overflow",
    op: "opacity",
    z: "zIndex",
  },

  // Settings for SSR and animation
  settings: {
    // Allow CSS variables for themes (better SSR support)
    allowedStyleValues: "somewhat-strict-web",
    // Enable autocompletion for specific values
    autocompleteSpecificTokens: "except-special",
    // Disable root theme class for SSR safety
    disableRootThemeClass: false,
    // Default theme to use
    defaultTheme: "light",
  },
});

// Type exports for TypeScript augmentation
// This provides IDE autocomplete for theme tokens
export type Conf = typeof config;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends Conf {}
}

// Default export for convenience
export default config;
