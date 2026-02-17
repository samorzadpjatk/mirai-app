import { useState, useEffect } from "react";
import { View } from "react-native";
import { UserMap } from "~/components/map/UserMap";
import { useMapUsers } from "~/hooks/map";
import {
  MapOverlayProvider,
  useMapOverlayContext,
} from "~/contexts/map/MapOverlayContext";
import { MapScreenOverlay } from "~/components/map/overlays/MapScreenOverlay";
import { useAuth } from "@integral-2025-app/auth/client";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useMapLocationStream } from "~/hooks/map";
import { useMapSharing } from "~/hooks/map";
import { useMapActions } from "~/hooks/map";
import { useFileDownload } from "~/hooks/files";
import { useLocationContext } from "~/contexts/location";

function MapScreenContent({
  onLocationUpdate,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
}: {
  onLocationUpdate: (coords: { longitude: number; latitude: number }) => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatarUrl?: string | null;
}) {
  const {
    users,
    onMapUserPress,
    onMapPress,
    mapTheme,
    focusedCoordinate,
  } = useMapOverlayContext();

  return (
    <View style={{ flex: 1 }}>
      <UserMap
        users={users}
        initialZoomLevel={14}
        onUserPress={onMapUserPress}
        onLocationUpdate={onLocationUpdate}
        onMapPress={onMapPress}
        focusedCoordinate={focusedCoordinate}
        mapTheme={mapTheme}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatarUrl={currentUserAvatarUrl}
        overlay={<MapScreenOverlay />}
      />
    </View>
  );
}

export default function MapScreen() {
  const { session } = useAuth();
  const trpc = useTRPC();
  const userMyQueryOptions = trpc.user.getMy.queryOptions();
  const { data: currentUser } = useQuery(userMyQueryOptions);
  const [mapTheme, setMapTheme] = useState<"dark" | "light">("dark");
  const [currentCoordinate, setCurrentCoordinate] = useState<
    [number, number] | null
  >(null);
  const { canShareOwnLocation, canViewOthersLocations, isLoading: isLocationLoading } = useLocationContext();

  // Map hooks
  const { locationsByUserId, usersData } = useMapLocationStream(
    !!session?.access_token && canShareOwnLocation && canViewOthersLocations && !isLocationLoading,
  );
  const {
    sharingUserIds,
    sharingSettings,
    allAvailableUsers,
    updateSharing,
    removeUser,
    isRemovingUser,
  } = useMapSharing(true);
  const { sendLocation } = useMapActions();
  const {
    download: downloadAvatar,
    file: avatarFile,
    reset: resetAvatar,
    abort: abortAvatar,
  } = useFileDownload();
  const avatarStoragePath = currentUser?.id
    ? `avatar/${currentUser.id}.jpg`
    : null;
  const currentUserName = `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim();

  useEffect(() => {
    if (!currentUser?.hasAvatar || !avatarStoragePath) {
      resetAvatar();
      return;
    }

    resetAvatar();
    void downloadAvatar({ storagePath: avatarStoragePath, skipCache: true });

    return () => {
      abortAvatar();
    };
  }, [
    abortAvatar,
    avatarStoragePath,
    currentUser?.hasAvatar,
    currentUser?.updatedAt,
    downloadAvatar,
    resetAvatar,
  ]);

  // Build users array with only other users (current user handled by UserMap directly)
  const users = useMapUsers({
    locationsByUserId,
    usersData,
    session,
    currentUserName: null, // Don't include current user here
    currentUserAvatarUrl: null,
    currentCoordinate: null,
  });

  if (!session?.access_token) {
    return null;
  }

  return (
    <MapOverlayProvider
      users={users}
      session={session}
      sharingUserIds={sharingUserIds}
      updateSharing={updateSharing}
      allAvailableUsers={allAvailableUsers}
      sharingSettings={sharingSettings}
      removeUser={removeUser}
      isRemovingUser={isRemovingUser}
      currentCoordinate={currentCoordinate}
      mapTheme={mapTheme}
      onToggleTheme={() =>
        setMapTheme(mapTheme === "dark" ? "light" : "dark")
      }
    >
      <MapScreenContent
        onLocationUpdate={({ latitude, longitude }) => {
          setCurrentCoordinate([longitude, latitude]);
          // Only send location if sharing is enabled
          if (canShareOwnLocation) {
            void sendLocation({ latitude, longitude });
          }
        }}
        currentUserId={currentUser?.id}
        currentUserName={currentUserName.length > 0 ? currentUserName : undefined}
        currentUserAvatarUrl={avatarFile?.uri ?? null}
      />
    </MapOverlayProvider>
  );
}
