import { useState, useMemo, useEffect } from "react";
import * as Crypto from "expo-crypto";
import { clientLogger } from "@mirai-app/shared";
import { useLocationContext } from "~/stores/location";
import { getUrqlClient } from "~/lib/urql-client";

// GraphQL document for friends locations (inline until generated)
const FriendsLocationsDocument = `
  query FriendsLocations(
    $connectionId: String
    $radiusKm: Float
    $latitude: Float
    $longitude: Float
  ) {
    friendsLocations(
      connectionId: $connectionId
      radiusKm: $radiusKm
      latitude: $latitude
      longitude: $longitude
    ) {
      edges {
        node {
          id
          userId
          latitude
          longitude
          accuracy
          altitude
          heading
          speed
          isSharingLocation
          distanceKm
          timestamp
          user {
            id
            firstName
            lastName
            fullName
            hasAvatar
          }
        }
      }
    }
  }
`;

// Type for friend location
type FriendLocation = {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  isSharingLocation: boolean;
  distanceKm?: number;
  timestamp: string | number | Date;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    hasAvatar?: boolean;
  };
};

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

    // Poll for friends locations since subscription might not be available
    const pollLocations = async () => {
      try {
        const urqlClient = getUrqlClient();
        const response = await urqlClient
          .query<{
            friendsLocations: { edges: Array<{ node: FriendLocation }> };
          }>(FriendsLocationsDocument, {
            connectionId,
            radiusKm: undefined,
            latitude: undefined,
            longitude: undefined,
          })
          .toPromise();
        if (response.error) throw response.error;
        const result = response.data;
        if (!result) return;

        // Process friends locations
        const locations =
          result.friendsLocations?.edges?.map(
            (edge: { node: FriendLocation }) => edge.node,
          ) ?? [];

        for (const location of locations) {
          const userId = location.userId;
          setLocationsByUserId((prev) => ({
            ...prev,
            [userId]: {
              latitude: location.latitude,
              longitude: location.longitude,
              updatedAt: location.timestamp,
            },
          }));

          if (
            location.user?.firstName != null ||
            location.user?.lastName != null
          ) {
            setUsersData((prev) => ({
              ...prev,
              [userId]: {
                name: `${location.user?.firstName ?? ""} ${location.user?.lastName ?? ""}`.trim(),
                image: location.user?.hasAvatar
                  ? `avatar-${location.user?.id}`
                  : undefined,
              },
            }));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
          clientLogger.warn(
            "Location fetch unauthorized - user may not be logged in",
          );
        } else {
          clientLogger.error(
            "Location fetch error:",
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    };

    // Poll every 10 seconds
    pollLocations();
    const interval = setInterval(pollLocations, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, canViewOthersLocations, connectionId]);

  return {
    locationsByUserId,
    usersData,
    setUsersData,
  };
}
