import { useEffect, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Alert, Linking } from "react-native";
import {
  shouldRequestNotificationPermission,
  buildNotificationPermissionResult,
} from "./useNotifications";

export interface UseNotificationPermissionReturn {
  permission: Notifications.PermissionStatus;
  requestPermission: () => Promise<Notifications.PermissionStatus>;
  openAppSettings: () => void;
}

export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permission, setPermission] = useState<Notifications.PermissionStatus>(
    Notifications.PermissionStatus.UNDETERMINED,
  );

  const requestPermission = useCallback(async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus: Notifications.PermissionStatus = existingStatus;

    if (shouldRequestNotificationPermission(existingStatus)) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = buildNotificationPermissionResult(existingStatus, status) as Notifications.PermissionStatus;
    }

    setPermission(finalStatus);
    return finalStatus;
  }, []);

  const openAppSettings = useCallback(() => {
    void Linking.openSettings().catch(() => {
      Alert.alert("Error", "Could not open device settings");
    });
  }, []);

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then((data) => {
        setPermission(data.status);
      })
      .catch(() => {
        // Silently ignore permission check errors
      });
  }, []);

  return {
    permission,
    requestPermission,
    openAppSettings,
  };
}
