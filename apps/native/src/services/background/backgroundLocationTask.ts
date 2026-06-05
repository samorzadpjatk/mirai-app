import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationObject } from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import {
  BACKGROUND_LOCATION_SETTINGS_KEY,
  BACKGROUND_LOCATION_TASK_NAME,
  LAST_SENT_LOCATION_KEY,
  LAST_SENT_LOCATION_TIMESTAMP_KEY,
  LAST_SENT_LOCATION_TTL_DAYS,
  LOCATION_SHARING_SETTINGS_KEY,
} from "~/services/location/constants";

import {
  shouldSendLocationUpdate,
  toFiniteNumberOrUndefined,
  toHeadingOrUndefined,
  toNonNegativeOrUndefined,
} from "./backgroundLocationTaskUtils";

export { toFiniteNumberOrUndefined, toNonNegativeOrUndefined, toHeadingOrUndefined };

export interface BackgroundTaskState {
  isSending: boolean;
  lastSentLocation: LocationObject | null;
}

export interface BackgroundTaskDeps {
  shouldSend: () => Promise<boolean>;
  sendUpdate: (location: LocationObject) => Promise<void>;
  getLastSentLocation: () => Promise<LocationObject | null>;
  setLastSentLocation: (location: LocationObject) => Promise<void>;
}

export interface BackgroundTaskFactoryDeps {
  supabaseClient: {
    auth: {
      getSession: () => Promise<{
        data: { session: { access_token: string } | null };
        error: Error | null;
      }>;
    };
  };
  getORPCClient: (
    httpUrl: string,
    wsUrl: string,
    authorizationToken?: string,
  ) => {
    client: {
      location: {
        updateLocation: (input: {
          latitude: number;
          longitude: number;
          accuracy?: number | undefined;
          altitude?: number | undefined;
          altitudeAccuracy?: number | undefined;
          heading?: number | undefined;
          speed?: number | undefined;
        }) => Promise<unknown>;
      };
    };
    cleanup: () => Promise<void>;
  };
  httpUrl: string;
  wsUrl: string;
}

export function createBackgroundTaskDeps(deps: BackgroundTaskFactoryDeps): BackgroundTaskDeps {
  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
      error,
    } = await deps.supabaseClient.auth.getSession();

    if (error) {
      return null;
    }

    return session?.access_token ?? null;
  }

  async function shouldSend(): Promise<boolean> {
    const [sharingEnabled, backgroundEnabled] = await Promise.all([
      AsyncStorage.getItem(LOCATION_SHARING_SETTINGS_KEY),
      AsyncStorage.getItem(BACKGROUND_LOCATION_SETTINGS_KEY),
    ]);

    return sharingEnabled === "true" && backgroundEnabled === "true";
  }

  async function sendUpdate(location: LocationObject): Promise<void> {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return;
    }

    const latitude = toFiniteNumberOrUndefined(location.coords.latitude);
    const longitude = toFiniteNumberOrUndefined(location.coords.longitude);
    if (latitude == null || longitude == null) {
      return;
    }

    const { client, cleanup } = deps.getORPCClient(deps.httpUrl, deps.wsUrl, accessToken);

    try {
      await client.location.updateLocation({
        latitude,
        longitude,
        accuracy: toNonNegativeOrUndefined(location.coords.accuracy),
        altitude: toFiniteNumberOrUndefined(location.coords.altitude),
        altitudeAccuracy: toNonNegativeOrUndefined(location.coords.altitudeAccuracy),
        heading: toHeadingOrUndefined(location.coords.heading),
        speed: toNonNegativeOrUndefined(location.coords.speed),
      });
    } finally {
      await cleanup();
    }
  }

  async function getLastSentLocation(): Promise<LocationObject | null> {
    try {
      const raw = await SecureStore.getItemAsync(LAST_SENT_LOCATION_KEY);
      if (!raw) return null;

      const timestampRaw = await SecureStore.getItemAsync(LAST_SENT_LOCATION_TIMESTAMP_KEY);
      if (timestampRaw) {
        const timestamp = Number(timestampRaw);
        const now = Date.now();
        const ttlMs = LAST_SENT_LOCATION_TTL_DAYS * 24 * 60 * 60 * 1000;
        if (now - timestamp > ttlMs) {
          return null;
        }
      }

      return JSON.parse(raw) as LocationObject;
    } catch {
      return null;
    }
  }

  async function setLastSentLocation(location: LocationObject): Promise<void> {
    try {
      await SecureStore.setItemAsync(LAST_SENT_LOCATION_KEY, JSON.stringify(location), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      await SecureStore.setItemAsync(LAST_SENT_LOCATION_TIMESTAMP_KEY, String(Date.now()), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      // Fire-and-forget: if SecureStore fails, we still have in-memory state
    }
  }

  return {
    shouldSend,
    sendUpdate,
    getLastSentLocation,
    setLastSentLocation,
  };
}

export async function handleBackgroundLocationTask(
  data: { locations?: LocationObject[] } | undefined,
  error: Error | null,
  state: BackgroundTaskState,
  deps: BackgroundTaskDeps,
): Promise<void> {
  if (error) {
    return;
  }

  if (state.isSending) {
    return;
  }

  state.isSending = true;
  try {
    if (!(await deps.shouldSend())) {
      return;
    }

    const latestLocation = data?.locations?.at(-1);
    if (!latestLocation) {
      return;
    }

    const lastSent = state.lastSentLocation ?? (await deps.getLastSentLocation());

    if (!shouldSendLocationUpdate(latestLocation, lastSent)) {
      return;
    }

    await deps.sendUpdate(latestLocation);
    state.lastSentLocation = latestLocation;
    void deps.setLastSentLocation(latestLocation); // Fire-and-forget
  } catch {
    /* no-op */
  } finally {
    state.isSending = false;
  }
}

export function initBackgroundLocationTask(deps: BackgroundTaskDeps): void {
  const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };

  try {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
      await handleBackgroundLocationTask(
        data as { locations?: LocationObject[] } | undefined,
        error as Error | null,
        state,
        deps,
      );
    });
  } catch (error) {
    // Hot reload can try to re-register the same task name in development.
    if (!(error instanceof Error) || !error.message.includes("has already been defined")) {
      /* no-op */
    }
  }
}
