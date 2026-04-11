import { useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useQuery, useMutation } from "urql";
import {
  GetMySharingSettingsDocument,
  UpdateLocationSharingDocument,
} from "@mirai-app/graphql-client";

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
  // GraphQL mutation for updating sharing settings
  const [, updateSharing] = useMutation(UpdateLocationSharingDocument);

  // GraphQL query for sharing settings
  const [{ data: sharingSettings, fetching: isSettingsLoading }] = useQuery({
    query: GetMySharingSettingsDocument,
  });

  const [isLocationSharingEnabled, setIsLocationSharingEnabled] =
    useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved location sharing preference and sync with server
  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
        const localEnabled = saved === "true";

        // Use server state if available, otherwise use local state
        if (sharingSettings?.mySharingSettings) {
          setIsLocationSharingEnabled(
            sharingSettings.mySharingSettings.isSharingLocation,
          );
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
        setPermissionStatus(status as LocationPermissionStatus);
      } catch (error) {
        console.warn("Failed to check location permissions:", error);
        setPermissionStatus("denied");
      }
    })();
  }, []);

  const requestLocationPermissions =
    useCallback(async (): Promise<LocationPermissionStatus> => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status as LocationPermissionStatus);

        if (status !== Location.PermissionStatus.GRANTED) {
          Alert.alert(
            "Location Permission Required",
            "Please enable location permissions in your device settings to use location features.",
          );
        }

        return status as LocationPermissionStatus;
      } catch (error) {
        console.error("Failed to request location permissions:", error);
        setPermissionStatus("denied");
        Alert.alert(
          "Location Permission Required",
          "Please enable location permissions in your device settings to use location features.",
        );
        return "denied";
      }
    }, []);

  const toggleLocationSharing = useCallback(
    async (enabled: boolean) => {
      try {
        // Update server state first
        const result = await updateSharing({
          input: {
            isSharingLocation: enabled,
            userIdsToShareWith: [], // Start with empty list, can be expanded later
          },
        });

        if (result.error) {
          throw result.error;
        }

        // Only update local state after server succeeds
        setIsLocationSharingEnabled(enabled);
        await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, enabled.toString());

        if (enabled && permissionStatus === "undetermined") {
          await requestLocationPermissions();
        }
      } catch (error) {
        console.error("Failed to toggle location sharing:", error);
        if (error instanceof Error) {
          Alert.alert(
            "Authentication Error",
            "Failed to update location settings. Please check your connection and try again.",
          );
        } else {
          Alert.alert("Error", "Failed to update location settings");
        }
      }
    },
    [permissionStatus, requestLocationPermissions, updateSharing],
  );

  const canViewOthersLocations =
    isLocationSharingEnabled && permissionStatus === "granted";
  const canShareOwnLocation =
    isLocationSharingEnabled && permissionStatus === "granted";

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
