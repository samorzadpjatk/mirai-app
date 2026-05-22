import { useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import {
  shouldShowLocationPermissionAlert,
  buildLocationPermissionAlert,
} from "./useLocationPermissions";

export type LocationPermissionStatus = "granted" | "denied" | "undetermined";

export interface UseLocationPermissionReturn {
  permissionStatus: LocationPermissionStatus;
  requestLocationPermissions: () => Promise<LocationPermissionStatus>;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
      } catch {
        setPermissionStatus("denied");
      }
    })();
  }, []);

  const requestLocationPermissions = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (shouldShowLocationPermissionAlert(status)) {
        const alert = buildLocationPermissionAlert();
        Alert.alert(alert.title, alert.message);
      }

      return status;
    } catch {
      setPermissionStatus("denied");
      const alert = buildLocationPermissionAlert();
      Alert.alert(alert.title, alert.message);
      return "denied";
    }
  }, []);

  return {
    permissionStatus,
    requestLocationPermissions,
  };
}
