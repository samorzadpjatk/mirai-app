import { orpc } from "@mirai-app/orpc/client";
import { formatDisplayName } from "@mirai-app/shared";
import * as Crypto from "expo-crypto";
import { useEffect, useMemo, useState } from "react";
import { useLocationContext } from "~/stores/location";

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
