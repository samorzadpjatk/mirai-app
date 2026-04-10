import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useLocationContext } from "~/stores/location";
import { graphqlClient } from "~/lib/graphql-client";

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

// WebSocket subscription helper for GraphQL
function createGraphQLSubscription<T>(
  wsUrl: string,
  query: string,
  variables: Record<string, unknown>,
  onData: (data: T) => void,
  onError?: (error: unknown) => void,
): () => void {
  let ws: WebSocket | null = null;
  let subscriptionId: string | null = null;

  const connect = async () => {
    try {
      // Get auth token for WebSocket connection
      const token = await graphqlClient.requestConfig
        .headers?.()
        .then((h) => h?.Authorization?.replace("Bearer ", ""))
        .catch(() => null);

      const url = new URL(wsUrl);
      if (token) {
        url.searchParams.set("token", token);
      }

      ws = new WebSocket(url.toString());

      ws.onopen = () => {
        // Send connection init
        ws?.send(JSON.stringify({ type: "connection_init" }));

        // Start subscription
        subscriptionId = Crypto.randomUUID();
        ws?.send(
          JSON.stringify({
            id: subscriptionId,
            type: "subscribe",
            payload: {
              query,
              variables,
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "data" && message.id === subscriptionId) {
          onData(message.payload.data);
        } else if (message.type === "error") {
          onError?.(
            new Error(message.payload?.message || "Subscription error"),
          );
        }
      };

      ws.onerror = (error) => {
        onError?.(error);
      };

      ws.onclose = () => {
        // Auto-reconnect after delay
        setTimeout(connect, 3000);
      };
    } catch (error) {
      onError?.(error);
    }
  };

  connect();

  // Return unsubscribe function
  return () => {
    if (ws?.readyState === WebSocket.OPEN && subscriptionId) {
      ws.send(
        JSON.stringify({
          id: subscriptionId,
          type: "complete",
        }),
      );
    }
    ws?.close();
    ws = null;
  };
}

export function useMapLocationStream(enabled: boolean) {
  const { canViewOthersLocations } = useLocationContext();
  const queryClient = useQueryClient();

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
  const wsUrl = useMemo(() => {
    const httpUrl =
      process.env.EXPO_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
    return httpUrl.replace(/^http/, "ws").replace("/graphql", "/subscriptions");
  }, []);

  useEffect(() => {
    if (!enabled || !canViewOthersLocations) return;

    // Poll for friends locations since subscription might not be available
    const pollLocations = async () => {
      try {
        const result = await graphqlClient.request(FriendsLocationsDocument, {
          connectionId,
          radiusKm: undefined,
          latitude: undefined,
          longitude: undefined,
        });

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

          if (location.user) {
            setUsersData((prev) => ({
              ...prev,
              [userId]: {
                name: `${location.user.firstName ?? ""} ${location.user.lastName ?? ""}`.trim(),
                image: location.user.hasAvatar
                  ? `avatar-${location.user.id}`
                  : undefined,
              },
            }));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
          console.warn(
            "Location fetch unauthorized - user may not be logged in",
          );
        } else {
          console.error("Location fetch error:", error);
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
