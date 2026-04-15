import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import { NativeGraphQLClient } from "@mirai-app/frameworks/graphql";
import { clientLogger } from "@mirai-app/shared";
import { authStorage } from "~/services/storage/storage";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  GRAPHQL_HTTP_URL,
} from "~/config/runtimeEnv";
import {
  BACKGROUND_LOCATION_SETTINGS_KEY,
  BACKGROUND_LOCATION_TASK_NAME,
  LOCATION_SHARING_SETTINGS_KEY,
} from "~/services/location/constants";

const supabaseClient = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authStorage,
);

let isSending = false;

const toFiniteNumberOrNull = (
  value: number | null | undefined,
): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
};

const toNonNegativeOrNull = (
  value: number | null | undefined,
): number | null => {
  const normalized = toFiniteNumberOrNull(value);
  if (normalized == null || normalized < 0) {
    return null;
  }
  return normalized;
};

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
    clientLogger.warn("[BackgroundLocationTask] Failed to load session:", {
      error,
    });
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
    clientLogger.warn(
      "[BackgroundLocationTask] Skipping update due to invalid coordinates.",
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    );
    return;
  }

  const client = new NativeGraphQLClient({
    endpoint: GRAPHQL_HTTP_URL,
    getAuthToken: () => accessToken,
  });

  try {
    await client.location.update.mutate({
      latitude,
      longitude,
      accuracy: toNonNegativeOrNull(location.coords.accuracy) ?? undefined,
    });
  } finally {
    // No cleanup needed for GraphQL client
  }
}

try {
  TaskManager.defineTask(
    BACKGROUND_LOCATION_TASK_NAME,
    async ({ data, error }) => {
      if (error) {
        clientLogger.error(
          "[BackgroundLocationTask] Task failed:",
          error as unknown as Error,
        );
        return;
      }

      if (isSending) {
        return;
      }

      if (!(await shouldSendBackgroundLocation())) {
        return;
      }

      const taskData = data as
        | {
            locations?: LocationObject[];
          }
        | undefined;

      const latestLocation = taskData?.locations?.at(-1);
      if (!latestLocation) {
        return;
      }

      isSending = true;
      try {
        await sendLocationUpdate(latestLocation);
      } catch (taskError) {
        clientLogger.error(
          "[BackgroundLocationTask] Failed to send location update:",
          taskError as Error,
        );
      } finally {
        isSending = false;
      }
    },
  );
} catch (error) {
  // Hot reload can try to re-register the same task name in development.
  if (
    !(error instanceof Error) ||
    !error.message.includes("has already been defined")
  ) {
    clientLogger.error(
      "[BackgroundLocationTask] Failed to define task:",
      error as Error,
    );
  }
}
