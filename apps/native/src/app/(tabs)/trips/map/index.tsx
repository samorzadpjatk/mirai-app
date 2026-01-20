import { useMemo, useState, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView, Modal, TextInput } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { UserMap, type UserLocation } from "~/components/map/UserMap";
import { UserAvatar } from "~/components/map/UserAvatar";
import { useTRPC, useSubscription } from "@integral-2025-app/trpc/client";
import { useAuth } from "@integral-2025-app/auth/client";
import { formatRelativeTime } from "~/utils/format";

export default function MapScreen() {
  const trpc = useTRPC();
  const { session } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUsersList, setShowUsersList] = useState(true);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const panelAnim = useSharedValue(0);
  const expandAnim = useSharedValue(0);
  const [currentCoordinate, setCurrentCoordinate] = useState<[number, number] | null>(null);
  const [focusCoordinate, setFocusCoordinate] = useState<[number, number] | null>(null);
  const [followMode, setFollowMode] = useState<"user" | null>(null);
  const [locationsByUserId, setLocationsByUserId] = useState<
    Record<string, { latitude: number; longitude: number; updatedAt: string | number | Date }>
  >({});
  const lastSentRef = useRef(0);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');

  // Fetch sharing settings using React Query
  const { data: sharingSettings, refetch: refetchSharing } = useQuery({
    ...trpc.location.getMySharingSettings.queryOptions(),
    enabled: !!session?.access_token,
  });

  const sharingUserIds = useMemo(() => {
    return sharingSettings?.usersToShareWith.map(u => u.id) ?? [];
  }, [sharingSettings]);

  // Fetch all users for the add modal
  const { data: allAvailableUsers } = useQuery({
    ...trpc.location.getAllUsersForSharing.queryOptions(),
    enabled: showAddModal && !!session?.access_token,
  });

  const [usersData, setUsersData] = useState<Record<string, {
    name?: string;
    email?: string;
    image?: string;
    houseNumber?: string;
  }>>({});

  // Current timestamp used for activity calculations — updated in an effect to avoid calling Date.now() during render
  // Initialize `now` lazily and update on interval; avoids calling Date.now() synchronously inside effect
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

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
        onData: (data) => {
          const { data: event } = data;
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
                  name: `${location.user?.firstName ?? ""} ${location.user?.lastName ?? ""}`.trim(),
                  image: location.user?.image ?? undefined,
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

  const updateLocationMutation = useMutation(trpc.location.updateLocation.mutationOptions());
  const sendLocation = (input: { latitude: number; longitude: number }) => updateLocationMutation.mutateAsync({
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  });

  const updateSharingMutation = useMutation(
    trpc.location.updateSharingSettings.mutationOptions({
      onSuccess: () => {
        console.log("[Map] Sharing settings updated");
        void refetchSharing();
      },
      onError: (error) => {
        console.error("[Map] Failed to update sharing:", error);
      },
    }),

  );

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
        avatarUrl: session?.user?.image ?? null,
        lastActiveAt: now,
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
  }, [locationsByUserId, usersData, session?.user?.id, session?.user?.email, session?.user?.image, currentCoordinate, now]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const selectedUserDisplayName = selectedUser ? (selectedUser.name && selectedUser.name.trim() !== "" ? selectedUser.name : "Unknown user") : "Unknown user";
  const selectedUserDisplaySurname = (() => {
    const s = selectedUserDisplayName.split(" ").slice(1).join(" ");
    return s !== "" ? s : "-";
  })();

  useEffect(() => {
    if (!selectedUser) return;
    if (followMode !== "user") return;
    // Defer focus state update to avoid synchronous setState in effect
    const id = setTimeout(() => setFocusCoordinate(selectedUser.coordinate), 0);
    return () => clearTimeout(id);
  }, [selectedUser, followMode]);

  useEffect(() => {
    panelAnim.value = withTiming(selectedUser || showUsersList ? 1 : 0, { duration: 240 });
  }, [panelAnim, selectedUser, showUsersList]);

  useEffect(() => {
    expandAnim.value = withTiming(isListExpanded ? 1 : 0, { duration: 300 });
  }, [expandAnim, isListExpanded]);

  const panelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(panelAnim.value, [0, 1], [220, 0]);
    return {
      opacity: panelAnim.value,
      transform: [{ translateY }],
    };
  });

  const usersListStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(expandAnim.value, [0, 1], [0, 300]);
    return { maxHeight };
  });

  if (!session?.access_token) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
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
          void sendLocation({ latitude, longitude });
        }}
        onMapPress={() => {
          if (isListExpanded) {
            setIsListExpanded(false);
          }
        }}
        focusedCoordinate={focusCoordinate}
        mapTheme={mapTheme}
        overlay={
          <>
            <Animated.View
              pointerEvents={selectedUser || showUsersList ? "auto" : "none"}
              style={[styles.detailCard, panelStyle]}
            >
              {selectedUser ? (
                <>
                  <View style={styles.cardHeader}>
                    <Pressable
                      onPress={() => {
                        setSelectedUserId(null);
                        setShowUsersList(true);
                      }}
                      style={styles.backToListButton}
                    >
                      <Text style={styles.backToListText}>←</Text>
                    </Pressable>
                    <View style={styles.userHeader}>
                      <View style={styles.avatarWrapper}>
                        <UserAvatar
                          imageUrl={selectedUser.avatarUrl}
                          name={selectedUserDisplayName}
                          size={60}
                        />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                          {selectedUserDisplayName.split(" ")[0]}
                        </Text>
                        <Text style={styles.userSurname}>
                          {selectedUserDisplaySurname}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Last active</Text>
                    <Text style={styles.sectionValue}>
                      {formatRelativeTime(new Date(selectedUser.lastActiveAt))}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Location Sharing</Text>
                    <Text style={styles.sectionValue}>
                      {sharingUserIds.includes(selectedUser.id)
                        ? "You share your location with this person"
                        : "This person shares their location with you"}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Group</Text>
                    <Text style={styles.sectionValue}>-</Text>
                  </View>

                  {selectedUser.id !== session?.user?.id && sharingUserIds.includes(selectedUser.id) && (
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => {
                        const newIds = sharingUserIds.filter(id => id !== selectedUser.id);
                        updateSharingMutation.mutate({
                          isSharingLocation: true,
                          userIdsToShareWith: newIds,
                        });
                        setSelectedUserId(null);
                        setShowUsersList(true);
                      }}
                    >
                      <Text style={styles.removeButtonText}>Stop Sharing My Location</Text>
                    </Pressable>
                  )}
                </>
              ) : showUsersList ? (
                <>
                  <View style={styles.handleBar} />
                  <Pressable
                    style={styles.listHeader}
                    onPress={() => setIsListExpanded(!isListExpanded)}
                  >
                    <Text style={styles.listTitle}>People</Text>
                    <View style={styles.headerButtons}>
                      <Pressable
                        style={styles.addButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setShowAddModal(true);
                        }}
                      >
                        <Text style={styles.addButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                  <Animated.View style={[styles.usersList, usersListStyle]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {users.map((user) => {
                        const isMe = user.id === session?.user?.id;
                        return (
                          <Pressable
                            key={user.id}
                            style={styles.userListItem}
                            onPress={() => {
                              if (isMe) return;
                              setSelectedUserId(user.id);
                              setShowUsersList(false);
                              setIsListExpanded(false);
                              setFollowMode("user");
                              setFocusCoordinate([...user.coordinate]);
                            }}
                          >
                            <View style={[
                              styles.avatarWrapperSmall,
                              isMe && styles.avatarWrapperMe
                            ]}>
                              <UserAvatar
                                imageUrl={user.avatarUrl}
                                name={user.name}
                                size={48}
                              />
                            </View>
                            <View style={styles.userListDetails}>
                              <View style={styles.userListRow}>
                                <Text style={styles.userListName}>
                                  {isMe ? "Me" : user.name}
                                </Text>
                                <Text style={styles.userListTime}>
                                  {isMe ? "My Location" : formatRelativeTime(new Date(user.lastActiveAt))}
                                </Text>
                              </View>
                              <Text style={styles.userListAddress}>
                                {user.address ?? "-"}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </Animated.View>
                </>
              ) : null}
            </Animated.View>
            <View style={styles.rightButtonsGroup}>
              <Pressable
                style={styles.themeToggleButton}
                onPress={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')}
              >
                <Text style={styles.themeToggleText}>{mapTheme === 'dark' ? '☀' : '☾'}</Text>
              </Pressable>
              <Pressable
                style={styles.recenterButton}
                onPress={() => {
                  if (!currentCoordinate) return;
                  setSelectedUserId(null);
                  setShowUsersList(false);
                  setFocusCoordinate(currentCoordinate);
                }}
              >
                <Text style={styles.recenterText}>⊙</Text>
              </Pressable>
            </View>

            <Modal
              visible={showAddModal}
              transparent
              animationType="fade"
              onRequestClose={() => {
                setShowAddModal(false);
                setSearchQuery("");
                setSelectedUsers(new Set());
              }}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setSelectedUsers(new Set());
                }}
              >
                <Pressable
                  style={styles.modalContent}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Share Location With</Text>
                    <Pressable
                      onPress={() => {
                        setShowAddModal(false);
                        setSearchQuery("");
                        setSelectedUsers(new Set());
                      }}
                    >
                      <Text style={styles.modalClose}>✕</Text>
                    </Pressable>
                  </View>

                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search people..."
                      placeholderTextColor="rgba(226,232,240,0.4)"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {selectedUsers.size > 0 && (
                    <View style={styles.selectedContainer}>
                      <Text style={styles.selectedLabel}>
                        {selectedUsers.size} selected
                      </Text>
                      <Pressable
                        style={styles.clearButton}
                        onPress={() => setSelectedUsers(new Set())}
                      >
                        <Text style={styles.clearButtonText}>Clear</Text>
                      </Pressable>
                    </View>
                  )}

                  <ScrollView style={styles.modalUsersList}>
                    {allAvailableUsers
                      ?.filter(u => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
                        return fullName.includes(query);
                      })
                      .map((user) => {
                        const isAlreadySharing = sharingUserIds.includes(user.id);
                        const isSelected = selectedUsers.has(user.id);
                        const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
                        return (
                          <Pressable
                            key={user.id}
                            style={[
                              styles.modalUserItem,
                              (isAlreadySharing || isSelected) && styles.modalUserItemSelected,
                            ]}
                            onPress={() => {
                              if (isAlreadySharing) return; // Can't select already shared
                              const newSelected = new Set(selectedUsers);
                              if (isSelected) {
                                newSelected.delete(user.id);
                              } else {
                                newSelected.add(user.id);
                              }
                              setSelectedUsers(newSelected);
                            }}
                          >
                            <View style={styles.modalUserInfo}>
                              <View style={styles.avatarWrapperSmall}>
                                <UserAvatar
                                  imageUrl={user.image}
                                  name={fullName}
                                  size={48}
                                />
                              </View>
                              <View>
                                <Text style={styles.modalUserName}>
                                  {fullName !== "" ? fullName : "Unknown"}
                                </Text>
                                {isAlreadySharing && (
                                  <Text style={styles.alreadySharingText}>
                                    Already sharing
                                  </Text>
                                )}
                              </View>
                            </View>
                            {(isAlreadySharing || isSelected) && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </Pressable>
                        );
                      })}
                  </ScrollView>

                  {selectedUsers.size > 0 && (
                    <View style={styles.modalFooter}>
                      <Pressable
                        style={styles.confirmButton}
                        onPress={() => {
                          const newIds = [...new Set([...sharingUserIds, ...Array.from(selectedUsers)])];
                          updateSharingMutation.mutate({
                            isSharingLocation: true,
                            userIdsToShareWith: newIds,
                          });
                          setShowAddModal(false);
                          setSearchQuery("");
                          setSelectedUsers(new Set());
                        }}
                      >
                        <Text style={styles.confirmButtonText}>
                          Add {selectedUsers.size} {selectedUsers.size === 1 ? "person" : "people"}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              </Pressable>
            </Modal>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  detailCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "rgba(23, 24, 28, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.25)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
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
  rightButtonsGroup: {
    position: "absolute",
    right: 16,
    top: 64,
    gap: 12,
  },
  themeToggleButton: {
    backgroundColor: "rgba(23, 24, 28, 0.9)",
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.35)",
  },
  themeToggleText: {
    color: "#00ced1",
    fontWeight: "600",
    fontSize: 22,
  },
  recenterButton: {
    backgroundColor: "rgba(23, 24, 28, 0.9)",
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.35)",
  },
  recenterText: {
    color: "#00ced1",
    fontWeight: "600",
    fontSize: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expandIcon: {
    color: "#EDE9FE",
    fontSize: 14,
    fontWeight: "600",
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 206, 209, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#00ced1",
    fontSize: 18,
    fontWeight: "700",
  },
  usersList: {
    overflow: "hidden",
  },
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  avatarWrapperSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(0, 206, 209, 0.4)",
    overflow: "hidden",
    backgroundColor: "rgba(23, 24, 28, 0.8)",
    padding: 2,
  },
  avatarWrapperMe: {
    borderWidth: 0,
  },
  userListDetails: {
    flex: 1,
  },
  userListRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userListName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  userListTime: {
    fontSize: 11,
    color: "rgba(226,232,240,0.5)",
  },
  userListAddress: {
    fontSize: 13,
    color: "rgba(226,232,240,0.7)",
    marginTop: 2,
  },
  backToListButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backToListText: {
    color: "#EDE9FE",
    fontSize: 20,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#ff6b6b",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(0, 206, 209, 0.4)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(23, 24, 28, 0.95)",
    borderRadius: 24,
    width: "85%",
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.35)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  modalClose: {
    fontSize: 24,
    color: "#EDE9FE",
    fontWeight: "600",
  },
  searchContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.2)",
  },
  selectedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 206, 209, 0.15)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.25)",
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EDE9FE",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(226,232,240,0.6)",
  },
  modalUsersList: {
    padding: 16,
    paddingTop: 8,
  },
  modalUserItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  modalUserItemSelected: {
    backgroundColor: "rgba(0, 206, 209, 0.2)",
    borderColor: "rgba(0, 206, 209, 0.4)",
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  checkmark: {
    fontSize: 20,
    color: "#22c55e",
    fontWeight: "700",
  },
  alreadySharingText: {
    fontSize: 12,
    color: "rgba(34, 197, 94, 0.7)",
    marginTop: 2,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  confirmButton: {
    backgroundColor: "rgba(0, 206, 209, 0.8)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 1)",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17181c",
    letterSpacing: -0.3,
  },
});

