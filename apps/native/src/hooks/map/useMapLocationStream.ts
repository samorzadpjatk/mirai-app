import { useState, useMemo, useEffect } from "react";
import { orpc } from "@mirai-app/orpc/client";
import * as Crypto from "expo-crypto";
import { useLocationContext } from "~/stores/location";

export function useMapLocationStream(enabled: boolean) {
  const { canViewOthersLocations } = useLocationContext();

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
          const event = data;
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
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
          console.warn("Location subscription unauthorized - user may not be logged in");
        } else {
          console.error("Location subscription error:", error);
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
