import { useState, useEffect, useCallback } from "react";
import { useGetFriendsLocationsQuery } from "@mirai-app/frameworks";
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

  // Use the generated query with network-only policy
  const [{ data, error, fetching }, reexecute] = useGetFriendsLocationsQuery({
    pause: !enabled || !canViewOthersLocations,
    requestPolicy: "network-only",
  });

  // Handle errors
  useEffect(() => {
    if (!error) return;
    // Errors are silently ignored
  }, [error]);

  // Process data when it changes
  useEffect(() => {
    if (!data?.friendsLocations?.locations) return;

    const locations = data.friendsLocations.locations;

    for (const location of locations) {
      const userId = location.userId;
      setLocationsByUserId((prev) => ({
        ...prev,
        [userId]: {
          latitude: location.latitude ?? 0,
          longitude: location.longitude ?? 0,
          updatedAt: location.timestamp,
        },
      }));

      // Note: The generated query does not include user details (firstName, lastName, hasAvatar).
      // The FriendLocation type in the schema only has userId, not a full user object.
      // User data would need to be fetched separately if needed.
    }
  }, [data]);

  // Set up polling every 10 seconds
  useEffect(() => {
    if (!enabled || !canViewOthersLocations) return;

    const interval = setInterval(() => {
      reexecute({ requestPolicy: "network-only" });
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, canViewOthersLocations, reexecute]);

  // Manual refresh function
  const refresh = useCallback(() => {
    reexecute({ requestPolicy: "network-only" });
  }, [reexecute]);

  return {
    locationsByUserId,
    usersData,
    setUsersData,
    fetching,
    refresh,
  };
}
