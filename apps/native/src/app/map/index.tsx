import React, { useMemo } from "react";
import { YStack } from "tamagui";
import { UserMap, type UserLocation } from "~/components/map/UserMap";
import { MapOverlay } from "~/components/map/MapOverlay";

export default function MapScreen() {
  // TODO: Podłącz prawdziwe dane użytkowników (np. z tRPC / Supabase)
  const users: UserLocation[] = [];

  const { active, faded } = useMemo(() => {
    const now = Date.now();
    let activeCount = 0;
    let fadedCount = 0;
    users.forEach((u) => {
      const last =
        typeof u.lastActiveAt === "number"
          ? u.lastActiveAt
          : new Date(u.lastActiveAt).getTime();
      const diffMin = (now - last) / 60000;
      if (diffMin <= 30) {
        activeCount += 1;
      } else {
        fadedCount += 1;
      }
    });
    return { active: activeCount, faded: fadedCount };
  }, [users]);

  return (
    <YStack flex={1}>
      <UserMap
        users={users}
        initialZoomLevel={14}
        onUserPress={(user) => {
          console.log("Selected user on map:", user.id);
        }}
        overlay={
          <MapOverlay
            activeCount={active}
            fadedCount={faded}
            onRecenter={undefined}
            title="Live presence"
            subtitle="Tap avatar to open user"
          />
        }
      />
    </YStack>
  );
}

