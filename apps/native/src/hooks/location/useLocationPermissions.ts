import { orpc } from "@mirai-app/orpc/client";
import { invalidateLocationQueries } from "@mirai-app/orpc/client/query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useLocationPermission } from "./useLocationPermission";

export const LOCATION_SETTINGS_KEY = "location_sharing_enabled";

export type LocationPermissionStatus = "granted" | "denied" | "undetermined";

export interface UseLocationPermissionsReturn {
  /** Whether location sharing is enabled by the user */
  isLocationSharingEnabled: boolean;
  /** Current permission status */
  permissionStatus: LocationPermissionStatus;
  /** Whether we're currently checking/loading permissions */
  isLoading: boolean;
  /** Request location permissions */
  requestLocationPermissions: () => Promise<LocationPermissionStatus>;
  /** Toggle location sharing on/off */
  toggleLocationSharing: (enabled: boolean) => Promise<void>;
  /** Check if user can see others' locations (requires permission + enabled setting) */
  canViewOthersLocations: boolean;
  /** Check if user can share their own location */
  canShareOwnLocation: boolean;
}

export function calculateCanViewOthersLocations(
  isLocationSharingEnabled: boolean,
  permissionStatus: string,
): boolean {
  return isLocationSharingEnabled && permissionStatus === "granted";
}

export function calculateCanShareOwnLocation(
  isLocationSharingEnabled: boolean,
  permissionStatus: string,
): boolean {
  return calculateCanViewOthersLocations(isLocationSharingEnabled, permissionStatus);
}

export function shouldShowLocationPermissionAlert(status: string): boolean {
  return status !== "granted";
}

export function buildLocationPermissionAlert(): {
  title: string;
  message: string;
} {
  return {
    title: "Location Permission Required",
    message: "Please enable location permissions in your device settings to use location features.",
  };
}

export interface LocationSharingToggleDeps {
  permissionStatus: string;
  requestLocationPermissions: () => Promise<string>;
  updateSharingMutation: {
    mutateAsync: (data: {
      isSharingLocation: boolean;
      userIdsToShareWith: string[];
    }) => Promise<unknown>;
  };
}

export async function executeToggleLocationSharing(
  enabled: boolean,
  deps: LocationSharingToggleDeps,
): Promise<void> {
  const { permissionStatus, requestLocationPermissions, updateSharingMutation } = deps;

  await updateSharingMutation.mutateAsync({
    isSharingLocation: enabled,
    userIdsToShareWith: [],
  });

  if (enabled && permissionStatus === "undetermined") {
    await requestLocationPermissions();
  }
}

export async function syncLocationSharingState(
  sharingSettings: { isSharingLocation: boolean } | undefined,
  getItem: (key: string) => Promise<string | null>,
): Promise<{ enabled: boolean; error: boolean }> {
  try {
    const saved = await getItem(LOCATION_SETTINGS_KEY);
    const localEnabled = saved === "true";

    if (sharingSettings) {
      return { enabled: sharingSettings.isSharingLocation, error: false };
    }
    return { enabled: localEnabled, error: false };
  } catch {
    return { enabled: false, error: true };
  }
}

export function buildLocationSharingToggle(
  setIsLocationSharingEnabled: (enabled: boolean) => void,
  deps: LocationSharingToggleDeps,
): (enabled: boolean) => Promise<void> {
  return async (enabled: boolean) => {
    try {
      await executeToggleLocationSharing(enabled, deps);
      setIsLocationSharingEnabled(enabled);
      await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, enabled.toString());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update location settings";
      Alert.alert("Location Sharing Error", errorMessage);
    }
  };
}

export function useLocationPermissions(): UseLocationPermissionsReturn {
  const queryClient = useQueryClient();
  const updateSharingMutation = useMutation(
    orpc.location.updateSharingSettings.mutationOptions({
      onSuccess: async () => {
        await invalidateLocationQueries(queryClient);
      },
      onError: () => {
        /* no-op */
      },
    }),
  );

  const sharingSettingsQuery = useQuery(
    orpc.location.getMySharingSettings.queryOptions({ input: {} }),
  );
  const sharingSettings = sharingSettingsQuery.data;
  const isSettingsLoading = sharingSettingsQuery.isLoading;

  const { permissionStatus, requestLocationPermissions } = useLocationPermission();

  const [isLocationSharingEnabled, setIsLocationSharingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved location sharing preference and sync with server
  useEffect(() => {
    void (async () => {
      const { enabled } = await syncLocationSharingState(sharingSettings, AsyncStorage.getItem);
      setIsLocationSharingEnabled(enabled);
      setIsLoading(false);
    })();
  }, [sharingSettings]);

  const toggleLocationSharing = useCallback(
    buildLocationSharingToggle(setIsLocationSharingEnabled, {
      permissionStatus,
      requestLocationPermissions,
      updateSharingMutation,
    }),
    // Same reason as useSelectedTrip: depend on the stable `mutateAsync`, not on
    // the mutation result object that TanStack Query rebuilds every render.
    [permissionStatus, requestLocationPermissions, updateSharingMutation.mutateAsync],
  );

  const canViewOthersLocations = calculateCanViewOthersLocations(
    isLocationSharingEnabled,
    permissionStatus,
  );
  const canShareOwnLocation = calculateCanShareOwnLocation(
    isLocationSharingEnabled,
    permissionStatus,
  );

  return {
    isLocationSharingEnabled,
    permissionStatus,
    isLoading: isLoading || isSettingsLoading,
    requestLocationPermissions,
    toggleLocationSharing,
    canViewOthersLocations,
    canShareOwnLocation,
  };
}
