import { useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/trpc/client";
import { invalidateLocationQueries } from "@mirai-app/trpc/client/query";

const LOCATION_SETTINGS_KEY = "location_sharing_enabled";

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

export function useLocationPermissions(): UseLocationPermissionsReturn {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateSharingMutation = useMutation(trpc.location.updateSharingSettings.mutationOptions({
    onSuccess: async () => { await invalidateLocationQueries(queryClient); },
    onError: (error) => { console.error("Failed to update location sharing settings:", error); },
  }));
  
  const sharingSettingsQuery = useQuery(trpc.location.getMySharingSettings.queryOptions());
  const sharingSettings = sharingSettingsQuery.data;
  const isSettingsLoading = sharingSettingsQuery.isLoading;

  const [isLocationSharingEnabled, setIsLocationSharingEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>("undetermined");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved location sharing preference and sync with server
  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
        const localEnabled = saved === "true";
        
        // Use server state if available, otherwise use local state
        if (sharingSettings) {
          setIsLocationSharingEnabled(sharingSettings.isSharingLocation);
        } else {
          setIsLocationSharingEnabled(localEnabled);
        }
      } catch (error) {
        console.warn("Failed to load location settings:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [sharingSettings]);

  // Check current permission status
  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
      } catch (error) {
        console.warn("Failed to check location permissions:", error);
        setPermissionStatus("denied");
      }
    })();
  }, []);

  const requestLocationPermissions = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location permissions in your device settings to use location features."
        );
      }
      
      return status;
    } catch (error) {
      console.error("Failed to request location permissions:", error);
      setPermissionStatus("denied");
      Alert.alert(
        "Location Permission Required",
        "Please enable location permissions in your device settings to use location features."
      );
      return "denied";
    }
  }, []);

  const toggleLocationSharing = useCallback(async (enabled: boolean) => {
    try {
      // Don't update local state immediately - wait for server confirmation
      // This prevents UI from showing enabled state if auth fails
      
      // Update server state first
      await updateSharingMutation.mutateAsync({
        isSharingLocation: enabled,
        userIdsToShareWith: [], // Start with empty list, can be expanded later
      });
      
      // Only update local state after server succeeds (query will be invalidated automatically)
      setIsLocationSharingEnabled(enabled);
      await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, enabled.toString());
      
      if (enabled && permissionStatus === "undetermined") {
        await requestLocationPermissions();
      }
    } catch (error) {
      console.error("Failed to toggle location sharing:", error);
      // Don't revert state since we didn't change it yet
      if (error instanceof Error) {
        Alert.alert("Authentication Error", "Failed to update location settings. Please check your connection and try again.");
      } else {
        Alert.alert("Error", "Failed to update location settings");
      }
    }
  }, [permissionStatus, requestLocationPermissions, updateSharingMutation]);

  const canViewOthersLocations = isLocationSharingEnabled && permissionStatus === "granted";
  const canShareOwnLocation = isLocationSharingEnabled && permissionStatus === "granted";

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
