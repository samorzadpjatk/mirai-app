export function toFiniteNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function toNonNegativeOrNull(value: unknown): number | null {
  const normalized = toFiniteNumberOrNull(value);
  if (normalized == null || normalized < 0) {
    return null;
  }
  return normalized;
}

export function toHeadingOrNull(value: unknown): number | null {
  const normalized = toFiniteNumberOrNull(value);
  if (normalized == null || normalized < 0 || normalized > 360) {
    return null;
  }
  return normalized;
}

export const MINIMUM_DELTA_METERS = 15;
export const ACCURACY_MULTIPLIER = 2;

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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
    accuracy != null
      ? Math.max(accuracy * accuracyMultiplier, minimumDelta)
      : minimumDelta;

  const delta = calculateDistance(
    lastSentLocation.coords.latitude,
    lastSentLocation.coords.longitude,
    newLocation.coords.latitude,
    newLocation.coords.longitude,
  );

  return delta > threshold;
}
