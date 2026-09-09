import { formatDisplayName } from "@mirai-app/common/users";
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useEffect, useMemo, useState } from "react";
import { useLocationContext } from "~/stores/location";

/**
 * The realtime stream can drop (websocket loss, a failed Supabase Realtime join,
 * a server restart). Polling the non-streaming query keeps the map populated
 * instead of leaving the user with an empty map until they reopen the screen.
 */
export const FRIENDS_LOCATIONS_POLL_INTERVAL_MS = 15_000;

export type MapLocationEntry = {
  latitude: number;
  longitude: number;
  updatedAt: string | number | Date;
};

export type MapUserEntry = {
  name?: string;
  email?: string;
  image?: string;
  houseNumber?: string;
};

export interface FriendLocationSnapshot {
  userId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timestamp?: string | number | Date | null;
  isSharingLocation?: boolean | null;
  user?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    image?: string | null;
  } | null;
}

function toMillis(value: string | number | Date | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isUsableSnapshot(friend: FriendLocationSnapshot): boolean {
  return (
    !!friend.userId &&
    friend.isSharingLocation !== false &&
    typeof friend.latitude === "number" &&
    typeof friend.longitude === "number"
  );
}

/**
 * Fold polled friend locations into the stream-driven state. Entries already
 * known from the stream are only replaced by strictly newer polled data, so the
 * fallback never rewinds a live position. Returns `prev` unchanged when nothing
 * moved, to avoid pointless re-renders.
 */
export function mergeFallbackLocations(
  prev: Record<string, MapLocationEntry>,
  friends: FriendLocationSnapshot[] | undefined,
): Record<string, MapLocationEntry> {
  if (!friends?.length) return prev;

  const next = { ...prev };
  let changed = false;

  for (const friend of friends) {
    if (!isUsableSnapshot(friend)) continue;
    const userId = friend.userId as string;
    const updatedAt = friend.timestamp ?? 0;
    const existing = next[userId];
    if (existing && toMillis(existing.updatedAt) >= toMillis(updatedAt)) continue;

    next[userId] = {
      latitude: friend.latitude as number,
      longitude: friend.longitude as number,
      updatedAt,
    };
    changed = true;
  }

  return changed ? next : prev;
}

/**
 * Fill in display data for friends the stream has not described yet. Stream
 * payloads win, because they carry freshly signed avatar URLs.
 */
export function mergeFallbackUsers(
  prev: Record<string, MapUserEntry>,
  friends: FriendLocationSnapshot[] | undefined,
): Record<string, MapUserEntry> {
  if (!friends?.length) return prev;

  const next = { ...prev };
  let changed = false;

  for (const friend of friends) {
    if (!isUsableSnapshot(friend)) continue;
    const userId = friend.userId as string;
    if (next[userId]) continue;

    next[userId] = {
      name: formatDisplayName(friend.user?.firstName, friend.user?.lastName) ?? undefined,
      image: friend.user?.image ?? undefined,
    };
    changed = true;
  }

  return changed ? next : prev;
}

export function buildLocationUpdateData(location: {
  coords: { latitude: number; longitude: number };
  timestamp: string | number | Date;
}) {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    updatedAt: location.timestamp,
  };
}

export function buildUserDataFromLocationUser(user: {
  id?: string | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  image?: string | null | undefined;
}) {
  return {
    name: formatDisplayName(user.firstName, user.lastName) ?? undefined,
    image: user.image ?? undefined,
  };
}

export function removeUserFromLocations(
  prev: Record<string, unknown>,
  userId: string,
): Record<string, unknown> {
  const next = { ...prev };
  delete next[userId];
  return next;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("UNAUTHORIZED");
}

export function isValidLocationEvent(event: {
  type: string;
  location?: unknown;
  userId?: string;
}): boolean {
  return (
    (event.type === "upsert" && !!event.location) || (event.type === "delete" && !!event.userId)
  );
}

export function processLocationStreamEvent(
  event: {
    type: string;
    location?: {
      user?: {
        id?: string;
        firstName?: string | null;
        lastName?: string | null;
        image?: string | null;
      };
      coords?: { latitude: number; longitude: number };
      timestamp?: string | number | Date;
    };
    userId?: string;
  },
  setLocationsByUserId: React.Dispatch<
    React.SetStateAction<
      Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>
    >
  >,
  setUsersData: React.Dispatch<
    React.SetStateAction<
      Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }>
    >
  >,
): void {
  if (event.type === "upsert" && event.location) {
    const { location } = event;
    const userId = location?.user?.id ?? "";
    setLocationsByUserId((prev) => ({
      ...prev,
      [userId]: buildLocationUpdateData(
        location as {
          coords: { latitude: number; longitude: number };
          timestamp: string | number | Date;
        },
      ),
    }));
    if (location?.user) {
      setUsersData((prev) => ({
        ...prev,
        [userId]: buildUserDataFromLocationUser(
          location.user as Parameters<typeof buildUserDataFromLocationUser>[0],
        ),
      }));
    }
  }

  if (event.type === "delete" && event.userId) {
    const userId = event.userId;
    setLocationsByUserId((prev) => removeUserFromLocations(prev, userId) as typeof prev);
    setUsersData((prev) => removeUserFromLocations(prev, userId) as typeof prev);
  }
}

export function useMapLocationStream(enabled: boolean) {
  const { canViewOthersLocations } = useLocationContext();

  const [locationsByUserId, setLocationsByUserId] = useState<
    Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>
  >({});
  const [usersData, setUsersData] = useState<
    Record<string, { name?: string; email?: string; image?: string; houseNumber?: string }>
  >({});

  const connectionId = useMemo(() => Crypto.randomUUID(), []);

  // Fallback: the already-registered non-streaming query keeps the map usable
  // when the realtime stream is unavailable or drops mid-session.
  const { data: friendsSnapshot } = useQuery({
    ...orpc.location.getFriendsLocations.queryOptions({ input: {} }),
    enabled: enabled && canViewOthersLocations,
    refetchInterval: FRIENDS_LOCATIONS_POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (!friendsSnapshot) return;
    const friends = friendsSnapshot as FriendLocationSnapshot[];
    setLocationsByUserId((prev) => mergeFallbackLocations(prev, friends));
    setUsersData((prev) => mergeFallbackUsers(prev, friends));
  }, [friendsSnapshot]);

  useEffect(() => {
    if (!enabled || !canViewOthersLocations) return;

    const controller = new AbortController();

    const run = async () => {
      try {
        const stream = await orpc.location.getFriendsLocationsStream.call({
          connectionId,
          radiusKm: undefined,
          latitude: undefined,
          longitude: undefined,
        });

        for await (const data of stream) {
          if (controller.signal.aborted) break;
          processLocationStreamEvent(data, setLocationsByUserId, setUsersData);
        }
      } catch (error: unknown) {
        if (!isUnauthorizedError(error)) {
          // TODO: Add Sentry crash reporting for production errors
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [enabled, canViewOthersLocations, connectionId]);

  return {
    locationsByUserId,
    usersData,
    setUsersData,
  };
}
