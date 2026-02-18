import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

let Location: typeof import("expo-location") | null = null;
try {
  Location = require("expo-location") as typeof import("expo-location");
} catch {
  console.warn("expo-location native module not available — location features disabled");
}

const LOCATION_SETTINGS_KEY = "location_sharing_enabled";

export type LocationPermissionStatus = "granted" | "denied" | "undetermined";

interface LocationState {
  isLocationSharingEnabled: boolean;
  permissionStatus: LocationPermissionStatus;
  isLoading: boolean;
  isUpdatingSharing: boolean;
}

type LocationAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SHARING_ENABLED"; payload: boolean }
  | { type: "SET_PERMISSION_STATUS"; payload: LocationPermissionStatus }
  | { type: "TOGGLE_SHARING" }
  | { type: "SET_UPDATING_SHARING"; payload: boolean };

const initialState: LocationState = {
  isLocationSharingEnabled: false,
  permissionStatus: "undetermined",
  isLoading: true,
  isUpdatingSharing: false,
};

function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SHARING_ENABLED":
      return { ...state, isLocationSharingEnabled: action.payload };
    case "SET_PERMISSION_STATUS":
      return { ...state, permissionStatus: action.payload };
    case "SET_UPDATING_SHARING":
      return { ...state, isUpdatingSharing: action.payload };
    case "TOGGLE_SHARING":
      return { ...state, isLocationSharingEnabled: !state.isLocationSharingEnabled };
    default:
      return state;
  }
}

interface LocationContextType extends LocationState {
  requestLocationPermissions: () => Promise<LocationPermissionStatus>;
  toggleLocationSharing: () => Promise<void>;
  canViewOthersLocations: boolean;
  canShareOwnLocation: boolean;
  isUpdatingSharing: boolean;
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
    trpc.location.getMySharingSettings.queryOptions()
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
        
        // Provide more specific error messages based on error type
        if (error?.data?.code === "UNAUTHORIZED") {
          Alert.alert(
            "Authentication Required", 
            "Please sign in again to update location settings."
          );
        } else if (error?.data?.code === "FORBIDDEN") {
          Alert.alert(
            "Access Denied", 
            "You don't have permission to update location settings."
          );
        } else {
          Alert.alert(
            "Connection Error", 
            "Failed to update location sharing settings. Please check your internet connection and try again."
          );
        }
      },
    })
  );

  // Load saved location sharing preference and sync with server
  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
        const localEnabled = saved === "true";
        
        // Use server state if available, otherwise use local state
        if (sharingSettings) {
          dispatch({ type: "SET_SHARING_ENABLED", payload: sharingSettings.isSharingLocation });
        } else {
          dispatch({ type: "SET_SHARING_ENABLED", payload: localEnabled });
        }
      } catch (error) {
        console.warn("Failed to load location settings:", error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    })();
  }, [sharingSettings]);

  // Check current permission status
  useEffect(() => {
    if (!Location) {
      dispatch({ type: "SET_PERMISSION_STATUS", payload: "denied" });
      return;
    }
    void (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        dispatch({ type: "SET_PERMISSION_STATUS", payload: status as LocationPermissionStatus });
      } catch (error) {
        console.warn("Failed to check location permissions:", error);
        dispatch({ type: "SET_PERMISSION_STATUS", payload: "denied" });
      }
    })();
  }, []);

  const requestLocationPermissions = async (): Promise<LocationPermissionStatus> => {
    if (!Location) {
      dispatch({ type: "SET_PERMISSION_STATUS", payload: "denied" });
      return "denied";
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch({ type: "SET_PERMISSION_STATUS", payload: status as LocationPermissionStatus });
      
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location permissions in your device settings to use location features."
        );
      }
      
      return status as LocationPermissionStatus;
    } catch (error) {
      console.error("Failed to request location permissions:", error);
      dispatch({ type: "SET_PERMISSION_STATUS", payload: "denied" });
      Alert.alert(
        "Location Permission Required",
        "Please enable location permissions in your device settings to use location features."
      );
      return "denied";
    }
  };

  const toggleLocationSharing = async (): Promise<void> => {
    try {
      const newEnabled = !state.isLocationSharingEnabled;
      
      // Set updating state to true
      dispatch({ type: "SET_UPDATING_SHARING", payload: true });
      
      // Don't update local state immediately - wait for server confirmation
      // This prevents UI from showing enabled state if auth fails
      
      // Update server state first
      await updateSharingMutation.mutateAsync({
        isSharingLocation: newEnabled,
        userIdsToShareWith: [], // Start with empty list, can be expanded later
      });
      
      // Only update local state after server succeeds
      dispatch({ type: "TOGGLE_SHARING" });
      await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, newEnabled.toString());
      
      if (newEnabled && state.permissionStatus === "undetermined") {
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
    } finally {
      // Always reset updating state
      dispatch({ type: "SET_UPDATING_SHARING", payload: false });
    }
  };

  const canViewOthersLocations = state.isLocationSharingEnabled && state.permissionStatus === "granted";
  const canShareOwnLocation = state.isLocationSharingEnabled && state.permissionStatus === "granted";

  const value: LocationContextType = {
    ...state,
    requestLocationPermissions,
    toggleLocationSharing,
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
