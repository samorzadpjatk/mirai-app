import { calculateDistance } from "@mirai-app/shared/utils";

export function toFiniteNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

export function toNonNegativeOrUndefined(value: unknown): number | undefined {
  const normalized = toFiniteNumberOrUndefined(value);
  if (normalized == null || normalized < 0) {
    return undefined;
  }
  return normalized;
}

export function toHeadingOrUndefined(value: unknown): number | undefined {
  const normalized = toFiniteNumberOrUndefined(value);
  if (normalized == null || normalized < 0 || normalized > 360) {
    return undefined;
  }
  return normalized;
}

export const MINIMUM_DELTA_METERS = 15;
export const ACCURACY_MULTIPLIER = 2;

export function shouldSendLocationUpdate(
  newLocation: {
    coords: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
    };
  },
  lastSentLocation: {
    coords: {
      latitude: number;
      longitude: number;
    };
  } | null,
  minimumDelta: number = MINIMUM_DELTA_METERS,
  accuracyMultiplier: number = ACCURACY_MULTIPLIER,
): boolean {
  if (!lastSentLocation) return true;

  const accuracy = newLocation.coords.accuracy;
  const threshold =
    accuracy != null ? Math.max(accuracy * accuracyMultiplier, minimumDelta) : minimumDelta;

  const delta = calculateDistance(
    lastSentLocation.coords.latitude,
    lastSentLocation.coords.longitude,
    newLocation.coords.latitude,
    newLocation.coords.longitude,
    "m",
  );

  return delta > threshold;
}
