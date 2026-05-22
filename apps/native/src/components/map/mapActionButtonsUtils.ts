import { colors } from "~/styles";

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

export function getBackgroundIconName(isBackgroundDisplayedOn: boolean): string {
  return isBackgroundDisplayedOn ? "navigate" : "navigate-outline";
}

export function getLocationIconName(isLocationSharingEnabled: boolean): string {
  return isLocationSharingEnabled ? "location" : "locate";
}

export function getThemeIconName(mapTheme: string): string {
  return mapTheme === "dark" ? "sunny" : "moon";
}

export function getBackgroundIconColor(
  isBackgroundControlDisabled: boolean,
  isBackgroundDisplayedOn: boolean,
): string {
  if (isBackgroundControlDisabled) return colors.textMuted;
  if (isBackgroundDisplayedOn) return colors.primary;
  return colors.white;
}
