import { colors } from "~/styles";
import type { ThemePalette } from "~/theme/TripThemeProvider";

export function calculateBackgroundDisplayState(
  isLocationSharingEnabled: boolean,
  isBackgroundLocationEnabled: boolean,
): boolean {
  return isLocationSharingEnabled && isBackgroundLocationEnabled;
}

export function buildBackgroundStatusLabel(isBackgroundDisplayedOn: boolean): string {
  return isBackgroundDisplayedOn ? "On" : "Off";
}

export function calculateBackgroundControlDisabled(
  isLocationSharingEnabled: boolean,
  isLoading: boolean,
  isUpdatingBackgroundLocation: boolean,
): boolean {
  return !isLocationSharingEnabled || isLoading || isUpdatingBackgroundLocation;
}

export function getBackgroundIconName(
  isBackgroundDisplayedOn: boolean,
): "navigate" | "navigate-outline" {
  return isBackgroundDisplayedOn ? "navigate" : "navigate-outline";
}

export function getLocationIconName(isLocationSharingEnabled: boolean): "location" | "locate" {
  return isLocationSharingEnabled ? "location" : "locate";
}

export function getThemeIconName(mapTheme: string): "sunny" | "moon" {
  return mapTheme === "dark" ? "sunny" : "moon";
}

export function getBackgroundIconColor(
  isBackgroundControlDisabled: boolean,
  isBackgroundDisplayedOn: boolean,
  palette: ThemePalette = colors,
): string {
  if (isBackgroundControlDisabled) return palette.textMuted;
  if (isBackgroundDisplayedOn) return palette.primary;
  return palette.white;
}
