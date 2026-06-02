export const AVATAR_FILE_EXTENSION = "jpg";
export const AVATAR_SIGNED_URL_SECONDS = 60 * 60 * 24;

/**
 * Expo-compliant location object type
 * Based on https://docs.expo.dev/versions/latest/sdk/location/#locationobject
 */
interface ExpoLocationObject {
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
 * Extended location object with user and sharing info
 */
export interface LocationWithUser extends ExpoLocationObject {
  isSharingLocation: boolean;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
}

export interface FriendLocationEvent {
  id: string;
  type: "upsert" | "delete";
  location?: LocationWithUser;
  userId?: string;
}

/**
 * @public
 * Part of the location router's public type surface. Must remain exported for
 * TypeScript inference in AppRouter (TS4023).
 */
export interface SharingUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
}


