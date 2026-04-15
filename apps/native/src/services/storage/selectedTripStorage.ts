import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TripListItem } from "~/components/trips/list/types";

const SELECTED_TRIP_STORAGE_KEY = "selected_trip_id";
const TRIPS_CACHE_KEY = "trips.cache.v1";
const TRIP_DETAILS_CACHE_KEY = "trip.details.cache.v1";

type TripDetailsCacheMap = Record<string, unknown>;

export async function getSelectedTripIdFromStorage(): Promise<string | null> {
  return SecureStore.getItemAsync(SELECTED_TRIP_STORAGE_KEY);
}

export async function setSelectedTripIdInStorage(
  tripId: string,
): Promise<void> {
  await SecureStore.setItemAsync(SELECTED_TRIP_STORAGE_KEY, tripId);
}

export async function clearSelectedTripIdInStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(SELECTED_TRIP_STORAGE_KEY);
}

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently ignore write errors
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isTripListItem = (value: unknown): value is TripListItem => {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.name === "string";
};

export async function getCachedTrips(): Promise<TripListItem[]> {
  const cached = await readJson<unknown>(TRIPS_CACHE_KEY, []);
  if (!Array.isArray(cached)) return [];
  return cached.filter(isTripListItem);
}

export async function setCachedTrips(trips: TripListItem[]): Promise<void> {
  await writeJson(TRIPS_CACHE_KEY, trips);
}

export async function upsertCachedTripListItem(
  trip: TripListItem,
): Promise<void> {
  const cachedTrips = await getCachedTrips();
  const nextTrips = [...cachedTrips];
  const existingIndex = nextTrips.findIndex((item) => item.id === trip.id);

  if (existingIndex >= 0) {
    nextTrips[existingIndex] = { ...nextTrips[existingIndex], ...trip };
  } else {
    nextTrips.push(trip);
  }

  await setCachedTrips(nextTrips);
}

export async function getCachedTripById<T>(tripId: string): Promise<T | null> {
  const detailsMap = await readJson<TripDetailsCacheMap>(
    TRIP_DETAILS_CACHE_KEY,
    {},
  );
  const details = detailsMap[tripId];
  if (details) {
    return details as T;
  }

  const cachedTrips = await getCachedTrips();
  const fallbackTrip = cachedTrips.find((trip) => trip.id === tripId);
  return fallbackTrip ? (fallbackTrip as T) : null;
}

export async function setCachedTripById<T>(
  tripId: string,
  trip: T,
): Promise<void> {
  const detailsMap = await readJson<TripDetailsCacheMap>(
    TRIP_DETAILS_CACHE_KEY,
    {},
  );
  detailsMap[tripId] = trip as unknown;
  await writeJson(TRIP_DETAILS_CACHE_KEY, detailsMap);
}
