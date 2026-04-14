/**
 * Theme Module Exports
 *
 * Centralized exports for all theme-related files.
 * Import from here for consistent theme access across the app.
 *
 * @example
 * ```ts
 * import { colorTokens, tokens, fonts, themes } from "@mirai-app/ui/theme";
 * ```
 */

// Color tokens - flat naming convention from native app
export {
  colorTokens,
  // Individual color groups for selective imports
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
} from "./colors";

// Design tokens - spacing, sizing, radii, z-index
export {
  tokens,
  space,
  size,
  radius,
  zIndex,
  lineHeight,
  letterSpacing,
} from "./tokens";

// Font definitions
export { fonts, headingFont, bodyFont, monoFont } from "./fonts";

// Theme objects (light, dark, variants)
export {
  themes,
  lightTheme,
  darkTheme,
  themeVariants,
  allThemes,
} from "./themes";

// Animation configurations
export {
  animations,
  motionAnimations,
  motiAnimations,
  animationPresets,
} from "./animations";
