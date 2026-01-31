import { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { usePanelAnimation } from "~/hooks/ui";
import { UserMap, type UserLocation } from "~/components/map/UserMap";
import { useMapUsers } from "~/hooks/map";
import { MapActionButtons } from "~/components/map/MapActionButtons";
import { SelectedUserCard } from "~/components/map/SelectedUserCard";
import { ShareLocationModal } from "~/components/map/ShareLocationModal";
import { UsersListPanel } from "~/components/map/UsersListPanel";
import { useAuth } from "@integral-2025-app/auth/client";
import { useMapLocationStream } from "~/hooks/map";
import { useMapSharing } from "~/hooks/map";
import { useMapActions } from "~/hooks/map";
import { useMapSelectedUser } from "~/hooks/map";
import { useShareModal } from "~/hooks/ui";

export default function MapScreen() {
  const { session } = useAuth();
  const [showUsersList, setShowUsersList] = useState(true);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const panelAnim = usePanelAnimation(false, 240);
  const expandAnim = usePanelAnimation(false, 300);
  const [currentCoordinate, setCurrentCoordinate] = useState<
    [number, number] | null
  >(null);
  const [focusCoordinate, setFocusCoordinate] = useState<
    [number, number] | null
  >(null);
  const [followMode, setFollowMode] = useState<"user" | null>(null);
  const [mapTheme, setMapTheme] = useState<"dark" | "light">("dark");

  // Map hooks
  const { locationsByUserId, usersData } = useMapLocationStream(
    !!session?.access_token,
  );
  const { sharingUserIds, allAvailableUsers, updateSharing } =
    useMapSharing(false);
  const { sendLocation } = useMapActions();

  // Selection & share modal state (extracted)
  const shareModal = useShareModal({ sharingUserIds, updateSharing });

  // Current timestamp used for activity calculations — updated in an effect to avoid calling Date.now() during render
  // Initialize `now` lazily and update on interval; avoids calling Date.now() synchronously inside effect
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const users = useMapUsers({
    locationsByUserId,
    usersData,
    session,
    currentCoordinate,
    now,
  });

  const selectedUserState = useMapSelectedUser({
    session,
    users,
    sharingUserIds,
    updateSharing,
  });
  const {
    selectedUser,
    selectUser,
    deselect,
    stopSharing,
    mapUserPress,
    canStopSharing,
  } = selectedUserState;

  const selectedUserDisplayName = selectedUser
    ? selectedUser.name && selectedUser.name.trim() !== ""
      ? selectedUser.name
      : "Unknown user"
    : "Unknown user";
  const selectedUserDisplaySurname = (() => {
    const s = selectedUserDisplayName.split(" ").slice(1).join(" ");
    return s !== "" ? s : "-";
  })();

  const handleSelectUser = (user: UserLocation) => {
    selectUser(user);
    setShowUsersList(false);
    setIsListExpanded(false);
    setFollowMode("user");
    setFocusCoordinate([...user.coordinate]);
  };

  const handleMapUserPress = (user: UserLocation) => {
    mapUserPress(user);
    setFollowMode("user");
    setFocusCoordinate([...user.coordinate]);
  };

  const handleStopSharing = async () => {
    await stopSharing();
    deselect();
    setShowUsersList(true);
  };

  const handleRecenter = () => {
    if (!currentCoordinate) return;
    deselect();
    setShowUsersList(false);
    setFocusCoordinate(currentCoordinate);
  };

  useEffect(() => {
    if (!selectedUser) return;
    if (followMode !== "user") return;
    // Defer focus state update to avoid synchronous setState in effect
    const id = setTimeout(() => setFocusCoordinate(selectedUser.coordinate), 0);
    return () => clearTimeout(id);
  }, [selectedUser, followMode]);

  useEffect(() => {
    panelAnim.setOpen(!!selectedUser || showUsersList);
  }, [panelAnim, selectedUser, showUsersList]);

  useEffect(() => {
    expandAnim.setOpen(isListExpanded);
  }, [expandAnim, isListExpanded]);

  const panelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(panelAnim.value.value, [0, 1], [220, 0]);
    return {
      opacity: panelAnim.value.value,
      transform: [{ translateY }],
    };
  });

  const usersListStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(expandAnim.value.value, [0, 1], [0, 300]);
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
        onUserPress={handleMapUserPress}
        onLocationUpdate={({ latitude, longitude }) => {
          setCurrentCoordinate([longitude, latitude]);
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
                <SelectedUserCard
                  selectedUser={selectedUser}
                  displayName={selectedUserDisplayName}
                  displaySurname={selectedUserDisplaySurname}
                  isSharingWithSelected={sharingUserIds.includes(
                    selectedUser.id,
                  )}
                  canStopSharing={canStopSharing}
                  onBackToList={() => {
                    deselect();
                    setShowUsersList(true);
                  }}
                  onStopSharing={handleStopSharing}
                />
              ) : showUsersList ? (
                <UsersListPanel
                  users={users}
                  currentUserId={session?.user?.id}
                  usersListStyle={usersListStyle}
                  onToggleExpand={() => setIsListExpanded(!isListExpanded)}
                  onAddPress={() => shareModal.openModal()}
                  onSelectUser={handleSelectUser}
                />
              ) : null}
            </Animated.View>
            <MapActionButtons
              mapTheme={mapTheme}
              onToggleTheme={() =>
                setMapTheme(mapTheme === "dark" ? "light" : "dark")
              }
              onRecenter={handleRecenter}
            />
            <ShareLocationModal
              visible={shareModal.open}
              users={allAvailableUsers}
              sharingUserIds={sharingUserIds}
              searchQuery={shareModal.searchQuery}
              selectedUsers={shareModal.selectedUsers}
              onChangeSearchQuery={shareModal.setSearchQuery}
              onToggleUser={shareModal.toggleSelectedUser}
              onClearSelected={shareModal.reset}
              onClose={shareModal.closeModal}
              onConfirmAdd={shareModal.confirm}
            />
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
});
