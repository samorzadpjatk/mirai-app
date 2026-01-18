import React, { useMemo, useState, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { YStack } from "tamagui";
import * as Crypto from "expo-crypto";
import { UserMap, type UserLocation } from "~/components/map/UserMap";
import { UserAvatar } from "~/components/map/UserAvatar";
import BottomMenu from "~/components/BottomMenu";
import { useTRPC, useSubscription } from "@integral-2025-app/trpc/client";
import { useAuth } from "@integral-2025-app/auth/client";
import { formatRelativeTime } from "~/utils/format";
import { useRouter } from "expo-router";

type FriendLocationEvent =
  | { id: string; type: "upsert"; location: LocationWithUser }
  | { id: string; type: "delete"; userId: string };

interface LocationWithUser {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
  isSharingLocation: boolean;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  ) {
    const parsed = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (
    value &&
    typeof value === "object" &&
    "toString" in value &&
    typeof (value as { toString?: unknown }).toString === "function"
  ) {
    const parsed = Number((value as { toString: () => string }).toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export default function MapScreen() {
  const trpc = useTRPC();
  const router = useRouter();
  const { session } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const [currentCoordinate, setCurrentCoordinate] = useState<[number, number] | null>(null);
  const [focusCoordinate, setFocusCoordinate] = useState<[number, number] | null>(null);
  const [followMode, setFollowMode] = useState<"user" | null>(null);
  const [locationsByUserId, setLocationsByUserId] = useState<
    Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>
  >({});
  const lastSentRef = useRef(0);


  const [usersData, setUsersData] = useState<Record<string, {
    name?: string;
    email?: string;
    image?: string;
    houseNumber?: string;
  }>>({});

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
        enabled: !!session?.access_token,
        onData: (event: FriendLocationEvent) => {
          console.log("[Map] Received WebSocket event:", event.type, event);
          if (event.type === "upsert") {
            const { location } = event;
            const userId = location.user?.id ?? "";
            console.log(`[Map] Updating location for user ${userId}:`, location.coords);
            setLocationsByUserId((prev) => ({
              ...prev,
              [userId]: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                updatedAt: location.timestamp,
              },
            }));
            if (location.user) {
              setUsersData((prev) => ({
                ...prev,
                [userId]: {
                  name: `${location.user.firstName ?? ""} ${location.user.lastName ?? ""}`.trim(),
                  image: location.user.image ?? undefined,
                },
              }));
            }
          } else if (event.type === "delete") {
            setLocationsByUserId((prev) => {
              const next = { ...prev };
              delete next[event.userId];
              return next;
            });
            setUsersData((prev) => {
              const next = { ...prev };
              delete next[event.userId];
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

  const sendLocation = useMutation({
    mutationFn: (input: { latitude: number; longitude: number }) => {
      if (!session?.access_token) {
        return Promise.resolve(null);
      }
      return trpc.location.updateLocation.mutate({
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      });
    },
  });

  const users: UserLocation[] = useMemo(() => {
    const next: UserLocation[] = [];
    const currentUserId = session?.user?.id;

    if (currentCoordinate) {
      next.push({
        id: currentUserId ?? "me",
        name: session?.user?.email ?? "You",
        email: session?.user?.email ?? undefined,
        address: "Your location",
        coordinate: currentCoordinate,
        avatarUrl: null,
        lastActiveAt: Date.now(),
      });
    }

    Object.entries(locationsByUserId).forEach(([userId, location]) => {
      if (userId === currentUserId) return;
      const userData = usersData[userId];
      next.push({
        id: userId,
        name: userData?.name ?? "Unknown",
        email: userData?.email,
        address: userData?.houseNumber ? `House ${userData.houseNumber}` : undefined,
        coordinate: [location.longitude, location.latitude],
        avatarUrl: userData?.image ?? null,
        lastActiveAt:
          location.updatedAt instanceof Date
            ? location.updatedAt.getTime()
            : location.updatedAt,
      });
    });
    return next;
  }, [locationsByUserId, usersData, session?.user?.id, session?.user?.email, currentCoordinate]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  useEffect(() => {
    if (!selectedUser) return;
    if (followMode !== "user") return;
    setFocusCoordinate(selectedUser.coordinate);
  }, [selectedUser, followMode]);

  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: selectedUser ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [panelAnim, selectedUser]);

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 0],
  });

  if (!session?.access_token) {
    return null;
  }

  return (
    <YStack flex={1}>
      <UserMap
        users={users}
        initialZoomLevel={14}
        onUserPress={(user) => {
          setSelectedUserId(user.id);
          setFollowMode("user");
          // Create new array reference to ensure useEffect triggers
          setFocusCoordinate([...user.coordinate]);
        }}
        onLocationUpdate={({ latitude, longitude }) => {
          setCurrentCoordinate([longitude, latitude]);
          const now = Date.now();
          if (now - lastSentRef.current < 5000) return;
          lastSentRef.current = now;
          sendLocation.mutate({ latitude, longitude });
        }}
        focusedCoordinate={focusCoordinate}
        overlay={
          <>
            <Animated.View
              pointerEvents={selectedUser ? "auto" : "none"}
              style={[
                styles.detailCard,
                {
                  opacity: panelAnim,
                  transform: [{ translateY: panelTranslateY }],
                },
              ]}
            >
              {selectedUser ? (
                <>
                  <View style={styles.cardHeader}>
                    <View style={styles.userHeader}>
                      <View style={styles.avatarWrapper}>
                        <UserAvatar
                          imageUrl={selectedUser.avatarUrl}
                          name={selectedUser.name}
                          size={60}
                        />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                          {(selectedUser.name || "Unknown user").split(" ")[0]}
                        </Text>
                        <Text style={styles.userSurname}>
                          {(selectedUser.name || "Unknown user").split(" ").slice(1).join(" ") ||
                            "-"}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setSelectedUserId(null)}>
                      <Text style={styles.closeText}>Close</Text>
                    </Pressable>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Last active</Text>
                    <Text style={styles.sectionValue}>
                      {formatRelativeTime(new Date(selectedUser.lastActiveAt))}
                    </Text>
                  </View>
                </>
              ) : null}
            </Animated.View>
            <Pressable style={styles.backButton} onPress={() => router.replace("/")}>
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <Pressable
              style={styles.recenterButton}
              onPress={() => {
                if (!currentCoordinate) return;
                setSelectedUserId(null);
                setFocusCoordinate(currentCoordinate);
              }}
            >
              <Text style={styles.recenterText}>My location</Text>
            </Pressable>
            <BottomMenu activeTab="trips" />
          </>
        }
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  detailCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(18, 16, 32, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
    shadowColor: "#1B0F33",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "white",
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  userDetails: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  userSurname: {
    fontSize: 14,
    color: "rgba(226,232,240,0.8)",
    marginTop: 2,
  },
  closeText: {
    color: "#EDE9FE",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: "rgba(226,232,240,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    color: "#F1F5F9",
  },
  recenterButton: {
    position: "absolute",
    right: 16,
    top: 64,
    backgroundColor: "rgba(18, 16, 32, 0.9)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
  },
  recenterText: {
    color: "#EDE9FE",
    fontWeight: "600",
    fontSize: 12,
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 64,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "500",
  },
});

