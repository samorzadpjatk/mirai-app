import * as SecureStore from "expo-secure-store";

const SELECTED_TRIP_STORAGE_KEY = "selected_trip_id";

export async function getSelectedTripIdFromStorage(): Promise<string | null> {
  return SecureStore.getItemAsync(SELECTED_TRIP_STORAGE_KEY);
}

export async function setSelectedTripIdInStorage(tripId: string): Promise<void> {
  await SecureStore.setItemAsync(SELECTED_TRIP_STORAGE_KEY, tripId);
}

export async function clearSelectedTripIdInStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(SELECTED_TRIP_STORAGE_KEY);
}
