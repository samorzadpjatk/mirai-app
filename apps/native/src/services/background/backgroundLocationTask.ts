import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import type { SupabaseClient } from "@mirai-app/supabase";
import { getORPCClient } from "@mirai-app/orpc/client";
import {
  BACKGROUND_LOCATION_SETTINGS_KEY,
  BACKGROUND_LOCATION_TASK_NAME,
  LOCATION_SHARING_SETTINGS_KEY,
} from "~/services/location/constants";

import {
  toFiniteNumberOrNull,
  toNonNegativeOrNull,
  toHeadingOrNull,
} from "./backgroundLocationTaskUtils";

export { toFiniteNumberOrNull, toNonNegativeOrNull, toHeadingOrNull };

export interface BackgroundTaskState {
  isSending: boolean;
}

export interface BackgroundTaskDeps {
  shouldSend: () => Promise<boolean>;
  sendUpdate: (location: LocationObject) => Promise<void>;
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
          accuracy?: number | null;
          altitude?: number | null;
          altitudeAccuracy?: number | null;
          heading?: number | null;
          speed?: number | null;
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

    const latitude = toFiniteNumberOrNull(location.coords.latitude);
    const longitude = toFiniteNumberOrNull(location.coords.longitude);
    if (latitude == null || longitude == null) {
      return;
    }

    const { client, cleanup } = deps.getORPCClient(deps.httpUrl, deps.wsUrl, accessToken);

    try {
      await client.location.updateLocation({
        latitude,
        longitude,
        accuracy: toNonNegativeOrNull(location.coords.accuracy),
        altitude: toFiniteNumberOrNull(location.coords.altitude),
        altitudeAccuracy: toNonNegativeOrNull(location.coords.altitudeAccuracy),
        heading: toHeadingOrNull(location.coords.heading),
        speed: toNonNegativeOrNull(location.coords.speed),
      });
    } finally {
      await cleanup();
    }
  }

  return {
    shouldSend,
    sendUpdate,
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

    await deps.sendUpdate(latestLocation);
  } catch {
    /* no-op */
  } finally {
    state.isSending = false;
  }
}

export function initBackgroundLocationTask(deps: BackgroundTaskDeps): void {
  const state: BackgroundTaskState = { isSending: false };

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
