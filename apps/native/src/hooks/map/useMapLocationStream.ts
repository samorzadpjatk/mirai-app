import { useState, useMemo } from "react";
import { useTRPC, useSubscription } from "@integral-2025-app/trpc/client";
import * as Crypto from "expo-crypto";

export function useMapLocationStream(enabled: boolean) {
  const trpc = useTRPC();

  const [locationsByUserId, setLocationsByUserId] = useState<
    Record<
      string,
      { latitude: number; longitude: number; updatedAt: string | number | Date }
    >
  >({});
  const [usersData, setUsersData] = useState<
    Record<
      string,
      { name?: string; email?: string; image?: string; houseNumber?: string }
    >
  >({});

  const connectionId = useMemo(() => Crypto.randomUUID(), []);

  useSubscription(
    trpc.location.getFriendsLocationsStream.subscriptionOptions(
      {
        connectionId,
        radiusKm: undefined,
        latitude: undefined,
        longitude: undefined,
      },
      {
        enabled,
        onData: (data) => {
          const { data: event } = data;
          if (event.type === "upsert" && event.location) {
            const { location } = event;
            const userId = location?.user?.id ?? "";
            setLocationsByUserId((prev) => ({
              ...prev,
              [userId]: {
                latitude: location?.coords.latitude,
                longitude: location?.coords.longitude,
                updatedAt: location?.timestamp,
              },
            }));
            if (location?.user) {
              setUsersData((prev) => ({
                ...prev,
                [userId]: {
                  name: `${location.user?.firstName ?? ""} ${location.user?.lastName ?? ""}`.trim(),
                  image: location.user?.image ?? undefined,
                },
              }));
            }
          }

          if (event.type === "delete" && "userId" in event && event.userId) {
            const userId = event.userId;
            setLocationsByUserId((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
            setUsersData((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
          }
        },
        onError: (error: unknown) => {
          console.error("Location subscription error:", error);
        },
      },
    ),
  );

  return {
    locationsByUserId,
    usersData,
    setUsersData,
  };
}
