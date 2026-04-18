import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import { print } from "graphql";
import {
  UpdateLocationDocument,
  type UpdateLocationInput,
} from "@mirai-app/frameworks";
import { urqlClient } from "~/lib/urql-client";
import {
  BACKGROUND_LOCATION_SETTINGS_KEY,
  BACKGROUND_LOCATION_TASK_NAME,
  LOCATION_SHARING_SETTINGS_KEY,
} from "~/services/location/constants";

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

/**
 * Execute GraphQL mutation to update location using urql
 * Uses generated UpdateLocationDocument from @mirai-app/frameworks
 */
async function executeLocationUpdate(params: {
  latitude: number;
  longitude: number;
  accuracy?: number;
}): Promise<void> {
  const { latitude, longitude, accuracy } = params;

  const input: UpdateLocationInput = {
    latitude,
    longitude,
    accuracy,
  };

  // Convert DocumentNode to GraphQL string using print()
  const mutationString = print(UpdateLocationDocument);

  const result = await urqlClient
    .mutation(mutationString, { input })
    .toPromise();

  if (result.error) {
    throw result.error;
  }
}

async function sendLocationUpdate(location: LocationObject): Promise<void> {
  const latitude = toFiniteNumberOrNull(location.coords.latitude);
  const longitude = toFiniteNumberOrNull(location.coords.longitude);
  if (latitude == null || longitude == null) {
    return;
  }

  await executeLocationUpdate({
    latitude,
    longitude,
    accuracy: toNonNegativeOrNull(location.coords.accuracy) ?? undefined,
  });
}

try {
  TaskManager.defineTask(
    BACKGROUND_LOCATION_TASK_NAME,
    async ({ data, error }) => {
      if (error) {
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
      } catch {
        // Silently ignore task errors
      } finally {
        isSending = false;
      }
    },
  );
} catch {
  // Hot reload can try to re-register the same task name in development.
}
