import React from "react";
import { YStack } from "tamagui";
import { UserMap, type UserLocation } from "~/components/map/UserMap";

export default function MapScreen() {
  // TODO: Podłącz prawdziwe dane użytkowników (np. z tRPC / Supabase)
  const users: UserLocation[] = [];

  return (
    <YStack flex={1}>
      <UserMap
        users={users}
        initialZoomLevel={14}
        onUserPress={(user) => {
          console.log("Selected user on map:", user.id);
        }}
      />
    </YStack>
  );
}


