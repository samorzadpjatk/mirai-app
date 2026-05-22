import { useState, useEffect } from "react";
import { View } from "react-native";
import { UserMap } from "~/components/map/UserMap";
import { useMapUsers } from "~/hooks/map";
import { useMapOverlayStore, mapOverlayStore, setMapOverlayExternals } from "~/stores/map";
import { MapScreenOverlay } from "~/components/map/overlays/MapScreenOverlay";
import { useAuth } from "@mirai-app/auth/client";
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useMapLocationStream } from "~/hooks/map";
import { useMapSharing } from "~/hooks/map";
import { useMapActions } from "~/hooks/map";
import { useFileDownload } from "~/hooks/files";
import { useLocationContext } from "~/stores/location";
import { useSelectedTrip } from "~/hooks/trips";
import { useTripDetails } from "~/hooks/trips";
import { formatDisplayName } from "@mirai-app/shared";

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
  const { users, onMapUserPress, onMapPress, mapTheme, focusedCoordinate } = useMapOverlayStore();

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
  const { selectedTripId } = useSelectedTrip();
  const { isTripPast } = useTripDetails(selectedTripId);
  const userMyQueryOptions = orpc.user.getMy.queryOptions({ input: {} });
  const { data: currentUser } = useQuery(userMyQueryOptions);
  const mapTheme = "dark";
  const [currentCoordinate, setCurrentCoordinate] = useState<[number, number] | null>(null);
  const {
    canShareOwnLocation,
    canViewOthersLocations,
    isLoading: isLocationLoading,
  } = useLocationContext();

  // Map hooks
  const { locationsByUserId, usersData } = useMapLocationStream(
    !!session?.access_token &&
      canShareOwnLocation &&
      canViewOthersLocations &&
      !isLocationLoading &&
      !isTripPast,
  );
  const {
    sharingUserIds,
    sharingSettings,
    allAvailableUsers,
    updateSharing,
    removeUser,
    isRemovingUser,
  } = useMapSharing(true, selectedTripId);
  const { sendLocation } = useMapActions();
  const {
    download: downloadAvatar,
    file: avatarFile,
    reset: resetAvatar,
    abort: abortAvatar,
  } = useFileDownload();
  const avatarStoragePath = currentUser?.id ? `avatar/${currentUser.id}.jpg` : null;
  const currentUserName = formatDisplayName(currentUser?.firstName, currentUser?.lastName) ?? undefined;

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

  // Initialize map overlay store with data and external functions
  useEffect(() => {
    mapOverlayStore.setState({
      users,
      currentUserId: session?.user?.id,
      sharingUserIds,
      allAvailableUsers,
      sharingSettings,
      isRemovingUser,
      mapTheme,
    });

    setMapOverlayExternals({
      updateSharing,
      removeUser,
      currentCoordinate,
    });
  }, [
    users,
    session,
    sharingUserIds,
    allAvailableUsers,
    sharingSettings,
    isRemovingUser,
    mapTheme,
    updateSharing,
    removeUser,
    currentCoordinate,
  ]);

  if (!session?.access_token) {
    return null;
  }

  return (
    <MapScreenContent
      onLocationUpdate={({ latitude, longitude }) => {
        setCurrentCoordinate([longitude, latitude]);
        // Only send location if sharing is enabled and trip is not past
        if (canShareOwnLocation && !isTripPast) {
          void sendLocation({ latitude, longitude });
        }
      }}
      currentUserId={currentUser?.id}
      currentUserName={currentUserName && currentUserName.length > 0 ? currentUserName : undefined}
      currentUserAvatarUrl={avatarFile?.uri ?? null}
    />
  );
}
