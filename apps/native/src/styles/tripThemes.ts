import { colors } from "./colors";

/**
 * Per-trip visual themes. A theme is a full palette with the SAME keys as the
 * global `colors` object, so any component can swap `colors` for a resolved
 * palette without changing style shapes. The pirate theme overrides only the
 * accent tokens (primary/magenta + their opacity variants) so the dark-first
 * backgrounds and semantic status colors (success/danger/warning) stay readable
 * and keep their meaning. Consumed via `TripThemeProvider` / `useTripTheme`.
 */

export type ThemePalette = typeof colors;
export type ThemeKey = "DEFAULT" | "PIRATE";

const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Palette pulled from the Integral pirate poster: treasure/hat gold + feather red.
const PIRATE_GOLD = "#F2C14E";
const PIRATE_RED = "#C0392B";

const piratePalette: ThemePalette = {
  ...colors,
  // Accent swaps
  primary: PIRATE_GOLD,
  accentMagenta: PIRATE_RED,
  // Surface warmth: swap the default teal-green timber for aged ship wood so the
  // gold accents sit on walnut/oak instead of green (kept dark for readability).
  cardDark: "#241a12",
  surfaceDark: "#2a2018",
  cardDarkOpacity40: "rgba(36, 26, 18, 0.4)",
  cardDarkOpacity70: "rgba(36, 26, 18, 0.7)",
  borderDark: "#5a4326",
  backgroundDarkAlt: "#17100a",
  // Navigation header follows the deep walnut surface family instead of navy.
  headerBackground: "#241a12",
  // Secondary/muted texts read gray-on-gray against the wooden deck background;
  // brighten them so they stay legible while keeping the same visual hierarchy.
  textSecondary: "rgba(255, 255, 255, 0.92)",
  textTertiary: "rgba(255, 255, 255, 0.78)",
  textMuted: "rgba(255, 255, 255, 0.70)",
  feedCardBg: "rgba(36, 26, 18, 0.82)",
  feedCardHeaderBg: "rgba(26, 18, 11, 0.6)",
  feedCardMediaBg: "#1a120b",
  feedAvatarBg: "#241a12",
  // All primary opacity variants regenerated from the gold accent
  primaryOpacity10: hexToRgba(PIRATE_GOLD, 0.1),
  primaryOpacity12: hexToRgba(PIRATE_GOLD, 0.12),
  primaryOpacity20: hexToRgba(PIRATE_GOLD, 0.2),
  primaryOpacity30: hexToRgba(PIRATE_GOLD, 0.3),
  primaryOpacity80: hexToRgba(PIRATE_GOLD, 0.8),
  // All magenta opacity variants regenerated from the red accent
  magentaOpacity10: hexToRgba(PIRATE_RED, 0.1),
  magentaOpacity20: hexToRgba(PIRATE_RED, 0.2),
  magentaOpacity30: hexToRgba(PIRATE_RED, 0.3),
  magentaOpacity80: hexToRgba(PIRATE_RED, 0.8),
};

export const tripThemes: Record<ThemeKey, ThemePalette> = {
  DEFAULT: colors,
  PIRATE: piratePalette,
};

export const resolveThemeKey = (key?: string | null): ThemeKey =>
  key === "PIRATE" ? "PIRATE" : "DEFAULT";

export const resolveTripTheme = (key?: string | null): ThemePalette =>
  tripThemes[resolveThemeKey(key)];
