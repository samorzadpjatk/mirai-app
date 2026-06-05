import type { Location as DbLocation } from "@mirai-app/db";

/**
 * Expo-compliant location object type
 * Based on https://docs.expo.dev/versions/latest/sdk/location/#locationobject
 */
export interface ExpoLocationObject {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

/**
 * Convert database location to Expo-compliant format
 */
export function toExpoLocation(dbLocation: DbLocation): ExpoLocationObject {
  return {
    coords: {
      latitude: dbLocation.latitude,
      longitude: dbLocation.longitude,
      altitude: dbLocation.altitude ?? null,
      accuracy: dbLocation.accuracy ?? null,
      altitudeAccuracy: dbLocation.altitudeAccuracy ?? null,
      heading: dbLocation.heading ?? null,
      speed: dbLocation.speed ?? null,
    },
    timestamp: dbLocation.timestamp.getTime(),
  };
}
