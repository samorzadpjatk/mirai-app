import { createStore } from "zustand/vanilla";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";
import {
  getBackgroundLocationPreference,
  hasBackgroundLocationTaskStarted,
  setBackgroundLocationPreference,
  startBackgroundLocationTask,
  stopBackgroundLocationTask,
} from "~/services/location/backgroundLocation";
import { LOCATION_SHARING_SETTINGS_KEY } from "~/services/location/constants";

export type LocationPermissionStatus = "granted" | "denied" | "undetermined";

export type ServerSharingUpdater = (input: {
  isSharingLocation: boolean;
  userIdsToShareWith: string[];
}) => Promise<unknown>;

let _updateSharingOnServer: ServerSharingUpdater | null = null;

/**
 * Inject the oRPC mutation function so the store can call the server
 * without depending on React hooks.
 */
export function setLocationServerUpdater(fn: ServerSharingUpdater | null) {
  _updateSharingOnServer = fn;
}

export interface LocationState {
  isLocationSharingEnabled: boolean;
  permissionStatus: LocationPermissionStatus;
  backgroundPermissionStatus: LocationPermissionStatus;
  isBackgroundLocationEnabled: boolean;
  isBackgroundLocationActive: boolean;
  isLoading: boolean;
  isUpdatingSharing: boolean;
  isUpdatingBackgroundLocation: boolean;
}

export interface LocationActions {
  /**
   * Initialize location state from local storage and system permissions.
   * Optionally pass server sharing settings to override local cache.
   */
  hydrate: (serverSharingEnabled?: boolean) => Promise<void>;
  /**
   * Synchronize background location task based on current state.
   */
  syncBackgroundTask: () => Promise<void>;
  requestLocationPermissions: () => Promise<LocationPermissionStatus>;
  toggleLocationSharing: () => Promise<void>;
  toggleBackgroundLocationUpdates: () => Promise<void>;
  openSystemLocationSettings: () => Promise<void>;
}

export type LocationStore = LocationState & LocationActions;

export const locationStore = createStore<LocationStore>()((set, get) => ({
  // State
  isLocationSharingEnabled: false,
  permissionStatus: "undetermined",
  backgroundPermissionStatus: "undetermined",
  isBackgroundLocationEnabled: false,
  isBackgroundLocationActive: false,
  isLoading: true,
  isUpdatingSharing: false,
  isUpdatingBackgroundLocation: false,

  // Actions
  hydrate: async (serverSharingEnabled) => {
    try {
      const [
        savedSharing,
        savedBackgroundEnabled,
        foregroundPermissions,
        backgroundPermissions,
        taskStarted,
      ] = await Promise.all([
        AsyncStorage.getItem(LOCATION_SHARING_SETTINGS_KEY),
        getBackgroundLocationPreference(),
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        hasBackgroundLocationTaskStarted(),
      ]);

      const localSharingEnabled = savedSharing === "true";
      set({
        isLocationSharingEnabled: serverSharingEnabled ?? localSharingEnabled,
        permissionStatus: foregroundPermissions.status as LocationPermissionStatus,
        backgroundPermissionStatus: backgroundPermissions.status as LocationPermissionStatus,
        isBackgroundLocationEnabled: savedBackgroundEnabled,
        isBackgroundLocationActive: taskStarted,
      });
    } catch (error) {
      console.warn("Failed to load location settings:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  syncBackgroundTask: async () => {
    const state = get();
    try {
      if (
        !state.isBackgroundLocationEnabled ||
        !state.isLocationSharingEnabled ||
        state.permissionStatus !== "granted" ||
        state.backgroundPermissionStatus !== "granted"
      ) {
        await stopBackgroundLocationTask();
        set({ isBackgroundLocationActive: false });
        return;
      }

      await startBackgroundLocationTask();
      set({ isBackgroundLocationActive: true });
    } catch (error) {
      console.error("Failed to synchronize background location updates:", error);
      set({ isBackgroundLocationActive: false });
    }
  },

  openSystemLocationSettings: async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Failed to open system settings:", error);
      Alert.alert("Settings Unavailable", "Unable to open system settings on this device.");
    }
  },

  requestLocationPermissions: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      set({ permissionStatus: status as LocationPermissionStatus });

      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location permissions in your device settings to use location features.",
        );
      }

      return status;
    } catch (error) {
      console.error("Failed to request location permissions:", error);
      set({ permissionStatus: "denied" });
      Alert.alert(
        "Location Permission Required",
        "Please enable location permissions in your device settings to use location features.",
      );
      return "denied";
    }
  },

  toggleBackgroundLocationUpdates: async () => {
    const state = get();
    const nextEnabled = !state.isBackgroundLocationEnabled;

    set({ isUpdatingBackgroundLocation: true });

    try {
      if (!nextEnabled) {
        await setBackgroundLocationPreference(false);
        set({ isBackgroundLocationEnabled: false });
        await stopBackgroundLocationTask();
        set({ isBackgroundLocationActive: false });
        return;
      }

      if (!state.isLocationSharingEnabled) {
        Alert.alert(
          "Enable Location Sharing",
          "Turn on location sharing first. Background updates only work when sharing is enabled.",
        );
        return;
      }

      const foregroundPermissions = await Location.getForegroundPermissionsAsync();
      set({ permissionStatus: foregroundPermissions.status as LocationPermissionStatus });

      const foregroundStatus =
        foregroundPermissions.status === Location.PermissionStatus.GRANTED
          ? (foregroundPermissions.status as LocationPermissionStatus)
          : await get().requestLocationPermissions();

      if (foregroundStatus !== "granted") {
        Alert.alert(
          "Background Location Permission Required",
          "To keep sharing your location in the background, allow Always location access in system settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                void get().openSystemLocationSettings();
              },
            },
          ],
        );
        return;
      }

      const currentBackground = await Location.getBackgroundPermissionsAsync();
      set({ backgroundPermissionStatus: currentBackground.status as LocationPermissionStatus });

      let backgroundStatus = currentBackground.status;
      if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
        const requestedBackground = await Location.requestBackgroundPermissionsAsync();
        backgroundStatus = requestedBackground.status;
        set({ backgroundPermissionStatus: requestedBackground.status as LocationPermissionStatus });
      }

      if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Always Location Access Needed",
          "Background updates are off. Enable Always location access in system settings to continue sharing in the background.",
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                void get().openSystemLocationSettings();
              },
            },
          ],
        );
        return;
      }

      await startBackgroundLocationTask();
      await setBackgroundLocationPreference(true);

      set({ isBackgroundLocationEnabled: true, isBackgroundLocationActive: true });
    } catch (error) {
      console.error("Failed to toggle background location updates:", error);
      Alert.alert(
        "Background Updates Error",
        "Failed to change background location updates. Please try again.",
      );
    } finally {
      set({ isUpdatingBackgroundLocation: false });
    }
  },

  toggleLocationSharing: async () => {
    const state = get();
    try {
      const newEnabled = !state.isLocationSharingEnabled;

      set({ isUpdatingSharing: true });

      if (_updateSharingOnServer) {
        await _updateSharingOnServer({
          isSharingLocation: newEnabled,
          userIdsToShareWith: [],
        });
      }

      set({ isLocationSharingEnabled: newEnabled });
      await AsyncStorage.setItem(LOCATION_SHARING_SETTINGS_KEY, newEnabled.toString());

      if (newEnabled && state.permissionStatus === "undetermined") {
        await get().requestLocationPermissions();
      }

      if (!newEnabled) {
        await stopBackgroundLocationTask();
        set({ isBackgroundLocationActive: false });
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
    } finally {
      set({ isUpdatingSharing: false });
    }
  },
}));
