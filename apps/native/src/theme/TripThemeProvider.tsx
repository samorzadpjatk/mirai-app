/** @jsxImportSource react */
"use client";

import { createContext, useContext, useMemo } from "react";
import { useTripThemeKey } from "~/hooks/trips";
import { colors } from "~/styles";
import {
  type ThemeKey,
  type ThemePalette,
  resolveThemeKey,
  resolveTripTheme,
} from "~/styles/tripThemes";

// Re-export so trip components can import the palette type alongside the hooks.
export type { ThemePalette, ThemeKey } from "~/styles/tripThemes";

type TripThemeValue = {
  /** Full palette (same keys as `colors`) resolved for the active trip. */
  palette: ThemePalette;
  /** Theme key, for gating decorative pirate elements. */
  themeKey: ThemeKey;
};

const DEFAULT_VALUE: TripThemeValue = { palette: colors, themeKey: "DEFAULT" };

const TripThemeContext = createContext<TripThemeValue>(DEFAULT_VALUE);

/**
 * Provides the resolved palette for the given trip to its subtree. Mounted once at
 * the app root (`src/app/_layout.tsx`), keyed on the globally selected trip, so
 * every screen can read the per-trip palette. Falls back to DEFAULT while loading,
 * when the trip is inaccessible, or in any subtree left unmounted (e.g. component
 * tests that render without a provider) — the context default keeps those on
 * DEFAULT.
 *
 * Backed by `trip.getTheme` (a single column) rather than `trip.getByIdFull`, so
 * mounting it at the root does not drag the heaviest endpoint in the API into the
 * cold-start critical path.
 */
export function TripThemeProvider({
  tripId,
  children,
}: {
  tripId?: string | null;
  children: React.ReactNode;
}) {
  const { theme: themeSource } = useTripThemeKey(tripId);

  const value = useMemo<TripThemeValue>(
    () => ({
      palette: resolveTripTheme(themeSource),
      themeKey: resolveThemeKey(themeSource),
    }),
    [themeSource],
  );

  return <TripThemeContext.Provider value={value}>{children}</TripThemeContext.Provider>;
}

export const useTripTheme = (): TripThemeValue => useContext(TripThemeContext);

/**
 * Memoize a themed StyleSheet from the active palette. `factory` should be a pure
 * palette -> styles function (ideally module-level, and it should call
 * `StyleSheet.create` itself) so styles recompute only when the palette identity
 * changes.
 */
export function useThemedStyles<T>(factory: (palette: ThemePalette) => T): T {
  const { palette } = useTripTheme();
  return useMemo(() => factory(palette), [palette, factory]);
}
