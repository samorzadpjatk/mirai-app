import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";
import {
  getBackgroundLocationPreference,
  hasBackgroundLocationTaskStarted,
  setBackgroundLocationPreference,
  startBackgroundLocationTask,
  stopBackgroundLocationTask,
} from "~/location/backgroundLocation";
import { LOCATION_SHARING_SETTINGS_KEY } from "~/location/constants";

export type LocationPermissionStatus = "granted" | "denied" | "undetermined";

interface LocationState {
  isLocationSharingEnabled: boolean;
  permissionStatus: LocationPermissionStatus;
  backgroundPermissionStatus: LocationPermissionStatus;
  isBackgroundLocationEnabled: boolean;
  isBackgroundLocationActive: boolean;
  isLoading: boolean;
  isUpdatingSharing: boolean;
  isUpdatingBackgroundLocation: boolean;
}

type LocationAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SHARING_ENABLED"; payload: boolean }
  | { type: "SET_PERMISSION_STATUS"; payload: LocationPermissionStatus }
  | {
      type: "SET_BACKGROUND_PERMISSION_STATUS";
      payload: LocationPermissionStatus;
    }
  | { type: "SET_BACKGROUND_ENABLED"; payload: boolean }
  | { type: "SET_BACKGROUND_ACTIVE"; payload: boolean }
  | { type: "TOGGLE_SHARING" }
  | { type: "SET_UPDATING_SHARING"; payload: boolean }
  | { type: "SET_UPDATING_BACKGROUND"; payload: boolean };

const initialState: LocationState = {
  isLocationSharingEnabled: false,
  permissionStatus: "undetermined",
  backgroundPermissionStatus: "undetermined",
  isBackgroundLocationEnabled: false,
  isBackgroundLocationActive: false,
  isLoading: true,
  isUpdatingSharing: false,
  isUpdatingBackgroundLocation: false,
};

function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SHARING_ENABLED":
      return { ...state, isLocationSharingEnabled: action.payload };
    case "SET_PERMISSION_STATUS":
      return { ...state, permissionStatus: action.payload };
    case "SET_BACKGROUND_PERMISSION_STATUS":
      return { ...state, backgroundPermissionStatus: action.payload };
    case "SET_BACKGROUND_ENABLED":
      return { ...state, isBackgroundLocationEnabled: action.payload };
    case "SET_BACKGROUND_ACTIVE":
      return { ...state, isBackgroundLocationActive: action.payload };
    case "SET_UPDATING_SHARING":
      return { ...state, isUpdatingSharing: action.payload };
    case "SET_UPDATING_BACKGROUND":
      return { ...state, isUpdatingBackgroundLocation: action.payload };
    case "TOGGLE_SHARING":
      return { ...state, isLocationSharingEnabled: !state.isLocationSharingEnabled };
    default:
      return state;
  }
}

interface LocationContextType extends LocationState {
  requestLocationPermissions: () => Promise<LocationPermissionStatus>;
  toggleLocationSharing: () => Promise<void>;
  toggleBackgroundLocationUpdates: () => Promise<void>;
  openSystemLocationSettings: () => Promise<void>;
  canViewOthersLocations: boolean;
  canShareOwnLocation: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(locationReducer, initialState);

  // Get current sharing settings from server
  const { data: sharingSettings } = useQuery(
    trpc.location.getMySharingSettings.queryOptions(),
  );

  // Mutation to update sharing settings
  const updateSharingMutation = useMutation(
    trpc.location.updateSharingSettings.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["location", "getMySharingSettings"],
        });
      },
      onError: (error) => {
        console.error("Failed to update location sharing settings:", error);

        if (error?.data?.code === "UNAUTHORIZED") {
          Alert.alert(
            "Authentication Required",
            "Please sign in again to update location settings.",
          );
        } else if (error?.data?.code === "FORBIDDEN") {
          Alert.alert(
            "Access Denied",
            "You don't have permission to update location settings.",
          );
        } else {
          Alert.alert(
            "Connection Error",
            "Failed to update location sharing settings. Please check your internet connection and try again.",
          );
        }
      },
    }),
  );

  useEffect(() => {
    void (async () => {
      try {
        const [savedSharing, savedBackgroundEnabled, foregroundPermissions, backgroundPermissions, taskStarted] =
          await Promise.all([
            AsyncStorage.getItem(LOCATION_SHARING_SETTINGS_KEY),
            getBackgroundLocationPreference(),
            Location.getForegroundPermissionsAsync(),
            Location.getBackgroundPermissionsAsync(),
            hasBackgroundLocationTaskStarted(),
          ]);

        const localSharingEnabled = savedSharing === "true";
        if (sharingSettings) {
          dispatch({
            type: "SET_SHARING_ENABLED",
            payload: sharingSettings.isSharingLocation,
          });
        } else {
          dispatch({
            type: "SET_SHARING_ENABLED",
            payload: localSharingEnabled,
          });
        }

        dispatch({
          type: "SET_PERMISSION_STATUS",
          payload: foregroundPermissions.status as LocationPermissionStatus,
        });
        dispatch({
          type: "SET_BACKGROUND_PERMISSION_STATUS",
          payload: backgroundPermissions.status as LocationPermissionStatus,
        });
        dispatch({
          type: "SET_BACKGROUND_ENABLED",
          payload: savedBackgroundEnabled,
        });
        dispatch({
          type: "SET_BACKGROUND_ACTIVE",
          payload: taskStarted,
        });
      } catch (error) {
        console.warn("Failed to load location settings:", error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    })();
  }, [sharingSettings]);

  useEffect(() => {
    void (async () => {
      try {
        if (
          !state.isBackgroundLocationEnabled ||
          !state.isLocationSharingEnabled ||
          state.permissionStatus !== "granted" ||
          state.backgroundPermissionStatus !== "granted"
        ) {
          await stopBackgroundLocationTask();
          dispatch({ type: "SET_BACKGROUND_ACTIVE", payload: false });
          return;
        }

        await startBackgroundLocationTask();
        dispatch({ type: "SET_BACKGROUND_ACTIVE", payload: true });
      } catch (error) {
        console.error("Failed to synchronize background location updates:", error);
        dispatch({ type: "SET_BACKGROUND_ACTIVE", payload: false });
      }
    })();
  }, [
    state.isBackgroundLocationEnabled,
    state.isLocationSharingEnabled,
    state.permissionStatus,
    state.backgroundPermissionStatus,
  ]);

  const openSystemLocationSettings = async (): Promise<void> => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Failed to open system settings:", error);
      Alert.alert(
        "Settings Unavailable",
        "Unable to open system settings on this device.",
      );
    }
  };

  const requestLocationPermissions = async (): Promise<LocationPermissionStatus> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch({
        type: "SET_PERMISSION_STATUS",
        payload: status as LocationPermissionStatus,
      });

      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location permissions in your device settings to use location features.",
        );
      }

      return status as LocationPermissionStatus;
    } catch (error) {
      console.error("Failed to request location permissions:", error);
      dispatch({ type: "SET_PERMISSION_STATUS", payload: "denied" });
      Alert.alert(
        "Location Permission Required",
        "Please enable location permissions in your device settings to use location features.",
      );
      return "denied";
    }
  };

  const toggleBackgroundLocationUpdates = async (): Promise<void> => {
    const nextEnabled = !state.isBackgroundLocationEnabled;

    dispatch({ type: "SET_UPDATING_BACKGROUND", payload: true });

    try {
      if (!nextEnabled) {
        await setBackgroundLocationPreference(false);
        dispatch({ type: "SET_BACKGROUND_ENABLED", payload: false });
        await stopBackgroundLocationTask();
        dispatch({ type: "SET_BACKGROUND_ACTIVE", payload: false });
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
      dispatch({
        type: "SET_PERMISSION_STATUS",
        payload: foregroundPermissions.status as LocationPermissionStatus,
      });
      const foregroundStatus =
        foregroundPermissions.status === Location.PermissionStatus.GRANTED
          ? (foregroundPermissions.status as LocationPermissionStatus)
          : await requestLocationPermissions();
      if (foregroundStatus !== "granted") {
        Alert.alert(
          "Background Location Permission Required",
          "To keep sharing your location in the background, allow Always location access in system settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                void openSystemLocationSettings();
              },
            },
          ],
        );
        return;
      }

      const currentBackground = await Location.getBackgroundPermissionsAsync();
      dispatch({
        type: "SET_BACKGROUND_PERMISSION_STATUS",
        payload: currentBackground.status as LocationPermissionStatus,
      });

      let backgroundStatus = currentBackground.status;
      if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
        const requestedBackground = await Location.requestBackgroundPermissionsAsync();
        backgroundStatus = requestedBackground.status;
        dispatch({
          type: "SET_BACKGROUND_PERMISSION_STATUS",
          payload: requestedBackground.status as LocationPermissionStatus,
        });
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
                void openSystemLocationSettings();
              },
            },
          ],
        );
        return;
      }

      await startBackgroundLocationTask();
      await setBackgroundLocationPreference(true);

      dispatch({ type: "SET_BACKGROUND_ENABLED", payload: true });
      dispatch({ type: "SET_BACKGROUND_ACTIVE", payload: true });
    } catch (error) {
      console.error("Failed to toggle background location updates:", error);
      Alert.alert(
        "Background Updates Error",
        "Failed to change background location updates. Please try again.",
      );
    } finally {
      dispatch({ type: "SET_UPDATING_BACKGROUND", payload: false });
    }
  };

  const toggleLocationSharing = async (): Promise<void> => {
    try {
      const newEnabled = !state.isLocationSharingEnabled;

      dispatch({ type: "SET_UPDATING_SHARING", payload: true });

      await updateSharingMutation.mutateAsync({
        isSharingLocation: newEnabled,
        userIdsToShareWith: [],
      });

      dispatch({ type: "TOGGLE_SHARING" });
      await AsyncStorage.setItem(LOCATION_SHARING_SETTINGS_KEY, newEnabled.toString());

      if (newEnabled && state.permissionStatus === "undetermined") {
        await requestLocationPermissions();
      }

      if (!newEnabled) {
        await stopBackgroundLocationTask();
        dispatch({ type: "SET_BACKGROUND_ACTIVE", payload: false });
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
      dispatch({ type: "SET_UPDATING_SHARING", payload: false });
    }
  };

  const canViewOthersLocations =
    state.isLocationSharingEnabled && state.permissionStatus === "granted";
  const canShareOwnLocation =
    state.isLocationSharingEnabled && state.permissionStatus === "granted";

  const value: LocationContextType = {
    ...state,
    requestLocationPermissions,
    toggleLocationSharing,
    toggleBackgroundLocationUpdates,
    openSystemLocationSettings,
    canViewOthersLocations,
    canShareOwnLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextType {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}
