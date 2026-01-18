import React, { useMemo, useState, useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import SuperJSON from "superjson";
import { YStack } from "tamagui";
import { UserMap, type UserLocation } from "~/components/map/UserMap";
import { useTRPC } from "@integral-2025-app/trpc/client";
import type { AppRouter } from "@integral-2025-app/trpc";
import { useAuth } from "@integral-2025-app/auth/client";
import { formatRelativeTime } from "~/utils/format";
import { useRouter } from "expo-router";

const TRPC_HTTP_URL: string =
  process.env.EXPO_PUBLIC_TRPC_API_URL ?? "http://localhost:2022/api/trpc";
const TRPC_WS_URL: string = TRPC_HTTP_URL.replace(/^http/, "ws");

type LocationPayload = {
  userId: string;
  latitude: number;
  longitude: number;
  updatedAt: string | number | Date;
};

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

  const fallbackAvatar = useMemo(
    () => Image.resolveAssetSource(require("../../../assets/mirai_logo.png")).uri,
    [],
  );

  const { data: mapUsers } = useQuery({
    ...trpc.user.getMapUsers.queryOptions(),
    enabled: Boolean(session?.access_token),
  });

  useEffect(() => {
    if (!mapUsers) return;
    setLocationsByUserId((prev) => {
      const next = { ...prev };
      mapUsers.forEach((user) => {
        const location = user.location;
        const latitude = toNumber(location?.latitude);
        const longitude = toNumber(location?.longitude);
        if (latitude == null || longitude == null) return;
        next[user.id] = {
          latitude,
          longitude,
          updatedAt: location?.timestamp ?? new Date(),
        };
      });
      return next;
    });
  }, [mapUsers]);

  const wsClient = useMemo(
    () =>
      createWSClient({
        url: TRPC_WS_URL,
        connectionParams: session?.access_token
          ? { authToken: session.access_token }
          : undefined,
        lazy: { enabled: true, closeMs: 60_000 },
      }),
    [session?.access_token],
  );

  const wsTrpcClient = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          wsLink({
            client: wsClient,
            transformer: SuperJSON,
          }),
        ],
      }),
    [wsClient],
  );

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    const subscription = wsTrpcClient.location.subscribe.subscribe(undefined, {
      onData: (payload: LocationPayload) => {
        setLocationsByUserId((prev) => ({
          ...prev,
          [payload.userId]: {
            latitude: payload.latitude,
            longitude: payload.longitude,
            updatedAt: payload.updatedAt,
          },
        }));
      },
      onError: (error: unknown) => {
        console.error("Location subscription error:", error);
      },
    });

    return () => subscription.unsubscribe();
  }, [wsTrpcClient, session?.access_token]);

  const sendLocation = useMutation({
    mutationFn: (input: { latitude: number; longitude: number }) => {
      if (!session?.access_token) {
        return Promise.resolve(null);
      }
      return wsTrpcClient.location.updateMy.mutate({
        ...input,
        updatedAt: new Date(),
      });
    },
  });

  const users: UserLocation[] = useMemo(() => {
    const next: UserLocation[] = [];
    const currentUserId = session?.user?.id;
    const currentUserData = mapUsers?.find((user) => user.id === currentUserId);
    if (currentCoordinate) {
      next.push({
        id: currentUserId ?? "me",
        name: currentUserData?.name ?? session?.user?.email ?? "You",
        email: currentUserData?.email ?? session?.user?.email ?? undefined,
        address: currentUserData?.houseNumber
          ? `House ${currentUserData.houseNumber}`
          : "Your location",
        coordinate: currentCoordinate,
        avatarUrl: currentUserData?.image || fallbackAvatar,
        lastActiveAt: Date.now(),
      });
    }

    mapUsers?.forEach((user) => {
      if (user.id === currentUserId) return;
      const location = locationsByUserId[user.id];
      if (!location) return;
      next.push({
        id: user.id,
        name: user.name ?? user.email ?? "Unknown",
        email: user.email ?? undefined,
        address: user.houseNumber ? `House ${user.houseNumber}` : undefined,
        coordinate: [location.longitude, location.latitude],
        avatarUrl: user.image || fallbackAvatar,
        lastActiveAt:
          location.updatedAt instanceof Date
            ? location.updatedAt.getTime()
            : location.updatedAt,
      });
    });
    return next;
  }, [mapUsers, locationsByUserId, fallbackAvatar, session?.user?.id, session?.user?.email, currentCoordinate]);

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

  return (
    <YStack flex={1}>
      <UserMap
        users={users}
        initialZoomLevel={14}
        onUserPress={(user) => {
          setSelectedUserId(user.id);
          setFollowMode("user");
          setFocusCoordinate(user.coordinate);
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
                        <Image source={{ uri: selectedUser.avatarUrl }} style={styles.avatar} />
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
            <Pressable style={styles.menuButton} onPress={() => router.replace("/")}>
              <Text style={styles.menuButtonText}>←</Text>
            </Pressable>
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
  avatar: {
    width: "100%",
    height: "100%",
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
  menuButton: {
    position: "absolute",
    left: 16,
    top: 64,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "500",
  },
});

