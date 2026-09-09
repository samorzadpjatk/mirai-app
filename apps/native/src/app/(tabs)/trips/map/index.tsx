import { useAuth } from "@mirai-app/auth/client";
import { formatDisplayName } from "@mirai-app/common/users";
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { UserMap } from "~/components/map/UserMap";
import { MapScreenOverlay } from "~/components/map/overlays/MapScreenOverlay";
import { useMapUsers } from "~/hooks/map";
import { useMapLocationStream } from "~/hooks/map";
import { useMapSharing } from "~/hooks/map";
import { useMapActions } from "~/hooks/map";
import { useSelectedTrip } from "~/hooks/trips";
import { useTripDetails } from "~/hooks/trips";
import { useLocationContext } from "~/stores/location";
import {
  MapOverlayProvider,
  MapOverlayStateProvider,
  buildMapOverlaySyncState,
  mapOverlayStore,
  useMapOverlayStore,
} from "~/stores/map";

function MapScreenContent({
  onLocationUpdate,
  currentUserId,
  currentUserName,
  currentUserAvatarStoragePath,
}: {
  onLocationUpdate: (coords: { longitude: number; latitude: number }) => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatarStoragePath?: string | null;
}) {
  const { users, handleMapUserPress, onMapPress, mapTheme, focusedCoordinate } =
    useMapOverlayStore();

  return (
    <View style={{ flex: 1 }}>
      <UserMap
        users={users}
        initialZoomLevel={14}
        onUserPress={handleMapUserPress}
        onLocationUpdate={onLocationUpdate}
        onMapPress={onMapPress}
        focusedCoordinate={focusedCoordinate}
        mapTheme={mapTheme}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatarStoragePath={currentUserAvatarStoragePath}
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
  const avatarStoragePath = currentUser?.id ? `avatar/${currentUser.id}.jpg` : null;
  const currentUserName =
    formatDisplayName(currentUser?.firstName, currentUser?.lastName) ?? undefined;

  // Build users array with only other users (current user handled by UserMap directly)
  const users = useMapUsers({
    locationsByUserId,
    usersData,
    session,
    currentUserName: null, // Don't include current user here
    currentUserAvatarUrl: null,
    currentCoordinate: null,
  });

  // Push screen-owned data into the overlay store. Deliberately excludes
  // `mapTheme`: the store owns it and the user toggles it, so writing it here
  // reset the theme on every tick of the location stream.
  useEffect(() => {
    mapOverlayStore.setState(
      buildMapOverlaySyncState({
        users,
        currentUserId: session?.user?.id,
        sharingUserIds,
        allAvailableUsers,
        sharingSettings,
        isRemovingUser,
      }),
    );
  }, [
    users,
    session?.user?.id,
    sharingUserIds,
    allAvailableUsers,
    sharingSettings,
    isRemovingUser,
  ]);

  // External (non-store) values the overlay needs, handed down through context.
  const overlayExternals = useMemo(
    () => ({ session, updateSharing, removeUser, currentCoordinate }),
    [session, updateSharing, removeUser, currentCoordinate],
  );

  if (!session?.access_token) {
    return null;
  }

  return (
    <MapOverlayProvider value={overlayExternals}>
      <MapOverlayStateProvider>
        <MapScreenContent
          onLocationUpdate={({ latitude, longitude }) => {
            setCurrentCoordinate([longitude, latitude]);
            // Only send location if sharing is enabled and trip is not past
            if (canShareOwnLocation && !isTripPast) {
              void sendLocation({ latitude, longitude });
            }
          }}
          currentUserId={currentUser?.id}
          currentUserName={
            currentUserName && currentUserName.length > 0 ? currentUserName : undefined
          }
          currentUserAvatarStoragePath={currentUser?.hasAvatar ? avatarStoragePath : null}
        />
      </MapOverlayStateProvider>
    </MapOverlayProvider>
  );
}
