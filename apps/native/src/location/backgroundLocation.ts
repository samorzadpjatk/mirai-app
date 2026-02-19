import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  BACKGROUND_LOCATION_SETTINGS_KEY,
  BACKGROUND_LOCATION_TASK_NAME,
} from "~/location/constants";

const BACKGROUND_LOCATION_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 25,
  deferredUpdatesInterval: 60_000,
  deferredUpdatesDistance: 25,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  activityType: Location.ActivityType.Other,
  foregroundService: {
    notificationTitle: "MIRAI is sharing your location",
    notificationBody: "Background location updates are active.",
    notificationColor: "#00ced1",
    killServiceOnDestroy: false,
  },
};

export async function getBackgroundLocationPreference(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(BACKGROUND_LOCATION_SETTINGS_KEY);
    return value === "true";
  } catch (error) {
    console.warn("Failed to read background location preference:", error);
    return false;
  }
}

export async function setBackgroundLocationPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BACKGROUND_LOCATION_SETTINGS_KEY, enabled.toString());
}

export async function hasBackgroundLocationTaskStarted(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
  } catch (error) {
    console.warn("Failed to check background location task state:", error);
    return false;
  }
}

export async function startBackgroundLocationTask(): Promise<void> {
  const isStarted = await hasBackgroundLocationTaskStarted();
  if (isStarted) {
    return;
  }

  await Location.startLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK_NAME,
    BACKGROUND_LOCATION_OPTIONS,
  );
}

export async function stopBackgroundLocationTask(): Promise<void> {
  const isStarted = await hasBackgroundLocationTaskStarted();
  if (!isStarted) {
    return;
  }

  await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
}
