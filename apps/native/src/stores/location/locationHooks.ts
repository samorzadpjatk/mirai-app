import { useStore } from "zustand";
import type { LocationPermissionStatus, LocationStore } from "./locationStore";
import { locationStore } from "./locationStore";

/**
 * Hook to access the full location context (backward-compatible with useLocationContext).
 */
export function useLocationContext() {
  const state = useStore(locationStore);
  return {
    ...state,
    canViewOthersLocations: state.isLocationSharingEnabled && state.permissionStatus === "granted",
    canShareOwnLocation: state.isLocationSharingEnabled && state.permissionStatus === "granted",
  };
}

/**
 * Hook to access a specific slice of the location store.
 */
export function useLocationStore<T>(selector: (state: LocationStore) => T): T {
  return useStore(locationStore, selector);
}

export type { LocationPermissionStatus };
