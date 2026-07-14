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
