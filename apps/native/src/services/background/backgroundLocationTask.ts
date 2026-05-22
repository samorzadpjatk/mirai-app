import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import { createSupabaseClient } from "@mirai-app/supabase";
import { getORPCClient } from "@mirai-app/orpc/client";
import { authStorage } from "~/services/storage/storage";
import { SUPABASE_ANON_KEY, SUPABASE_URL, TRPC_HTTP_URL, TRPC_WS_URL } from "~/config/runtimeEnv";
import {
  BACKGROUND_LOCATION_SETTINGS_KEY,
  BACKGROUND_LOCATION_TASK_NAME,
  LOCATION_SHARING_SETTINGS_KEY,
} from "~/services/location/constants";

const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, authStorage);

import {
  toFiniteNumberOrNull,
  toNonNegativeOrNull,
  toHeadingOrNull,
} from "./backgroundLocationTaskUtils";

export { toFiniteNumberOrNull, toNonNegativeOrNull, toHeadingOrNull };

const isSending = false;

async function shouldSendBackgroundLocation(): Promise<boolean> {
  const [sharingEnabled, backgroundEnabled] = await Promise.all([
    AsyncStorage.getItem(LOCATION_SHARING_SETTINGS_KEY),
    AsyncStorage.getItem(BACKGROUND_LOCATION_SETTINGS_KEY),
  ]);

  return sharingEnabled === "true" && backgroundEnabled === "true";
}

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error) {
    return null;
  }

  return session?.access_token ?? null;
}

async function sendLocationUpdate(location: LocationObject): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return;
  }

  const latitude = toFiniteNumberOrNull(location.coords.latitude);
  const longitude = toFiniteNumberOrNull(location.coords.longitude);
  if (latitude == null || longitude == null) {
    return;
  }

  const { client, cleanup } = getORPCClient(TRPC_HTTP_URL, TRPC_WS_URL, accessToken);

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

export interface BackgroundTaskState {
  isSending: boolean;
}

export interface BackgroundTaskDeps {
  shouldSend: () => Promise<boolean>;
  sendUpdate: (location: LocationObject) => Promise<void>;
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

export function initBackgroundLocationTask(): void {
  const state: BackgroundTaskState = { isSending: false };

  try {
    TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
      await handleBackgroundLocationTask(
        data as { locations?: LocationObject[] } | undefined,
        error,
        state,
        {
          shouldSend: shouldSendBackgroundLocation,
          sendUpdate: sendLocationUpdate,
        },
      );
    });
  } catch (error) {
    // Hot reload can try to re-register the same task name in development.
    if (!(error instanceof Error) || !error.message.includes("has already been defined")) {
      /* no-op */
    }
  }
}
