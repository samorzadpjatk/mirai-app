import React, { createContext, useContext, useEffect, useState } from "react";
import {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedStyle,
} from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import type { ViewStyle } from "react-native";
import type { UserLocation } from "~/components/map/UserMap";
import { usePanelAnimation, useShareModal } from "~/hooks/ui";
import { useMapSelectedUser } from "~/hooks/map";

type MapTheme = "dark" | "light";

interface ShareableUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

interface SharingUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

interface SharingSettings {
  usersToShareWith?: SharingUser[];
}

interface MapOverlayProviderProps {
  children: React.ReactNode;
  users: UserLocation[];
  session?: { user?: { id?: string } } | null;
  sharingUserIds: string[];
  updateSharing: (ids: string[]) => Promise<void>;
  allAvailableUsers?: ShareableUser[];
  sharingSettings?: SharingSettings | null;
  removeUser: (userId: string) => Promise<void>;
  isRemovingUser: boolean;
  currentCoordinate: [number, number] | null;
  mapTheme: MapTheme;
  onToggleTheme: () => void;
}

interface MapOverlayContextValue {
  users: UserLocation[];
  currentUserId?: string;
  selectedUser: UserLocation | null;
  showUsersList: boolean;
  panelStyle: AnimatedStyle<ViewStyle>;
  usersListStyle: AnimatedStyle<ViewStyle>;
  panGesture: ReturnType<typeof Gesture.Pan>;
  onToggleExpand: () => void;
  onAddPress: () => void;
  onManagePress: () => void;
  onSelectUser: (user: UserLocation) => void;
  onBackToList: () => void;
  onStopSharing: () => Promise<void>;
  canStopSharing: boolean;
  sharingUserIds: string[];
  shareModal: ReturnType<typeof useShareModal>;
  allAvailableUsers?: ShareableUser[];
  showManageModal: boolean;
  setShowManageModal: (open: boolean) => void;
  sharingSettings?: SharingSettings | null;
  removeUser: (userId: string) => Promise<void>;
  isRemovingUser: boolean;
  mapTheme: MapTheme;
  onToggleTheme: () => void;
  onRecenter: () => void;
  onMapUserPress: (user: UserLocation) => void;
  onMapPress: () => void;
  focusedCoordinate: [number, number] | null;
}

const MapOverlayContext = createContext<MapOverlayContextValue | null>(null);

export function MapOverlayProvider({
  children,
  users,
  session,
  sharingUserIds,
  updateSharing,
  allAvailableUsers,
  sharingSettings,
  removeUser,
  isRemovingUser,
  currentCoordinate,
  mapTheme,
  onToggleTheme,
}: MapOverlayProviderProps) {
  const [showUsersList, setShowUsersList] = useState(true);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [followMode, setFollowMode] = useState<"user" | null>(null);
  const [focusedCoordinate, setFocusedCoordinate] = useState<
    [number, number] | null
  >(null);
  const listMaxHeight = 300;

  const panelAnim = usePanelAnimation(false, 240);
  const expandAnim = usePanelAnimation(false, 300);

  const shareModal = useShareModal({ sharingUserIds, updateSharing });
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

  const handleSelectUser = (user: UserLocation) => {
    selectUser(user);
    setShowUsersList(false);
    setIsListExpanded(false);
    setFollowMode("user");
    setFocusedCoordinate([...user.coordinate]);
  };

  const handleMapUserPress = (user: UserLocation) => {
    mapUserPress(user);
    setFollowMode("user");
    setFocusedCoordinate([...user.coordinate]);
  };

  const handleStopSharing = async () => {
    await stopSharing();
    deselect();
    setShowUsersList(true);
  };

  const handleRecenter = () => {
    if (!currentCoordinate) return;
    deselect();
    setFocusedCoordinate(currentCoordinate);
  };

  useEffect(() => {
    if (!selectedUser) return;
    if (followMode !== "user") return;
    // Defer focus state update to avoid synchronous setState in effect
    const id = setTimeout(
      () => setFocusedCoordinate(selectedUser.coordinate),
      0,
    );
    return () => clearTimeout(id);
  }, [selectedUser, followMode]);

  useEffect(() => {
    panelAnim.setOpen(!!selectedUser || showUsersList);
  }, [panelAnim, selectedUser, showUsersList]);

  useEffect(() => {
    expandAnim.setOpen(isListExpanded);
  }, [expandAnim, isListExpanded]);

  const listDragStart = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      listDragStart.value = expandAnim.value.value;
    })
    .onUpdate((event) => {
      if (selectedUser || !showUsersList) return;
      const dragProgress =
        listDragStart.value + -event.translationY / listMaxHeight;
      expandAnim.value.value = Math.max(0, Math.min(1, dragProgress));
    })
    .onEnd((event) => {
      if (selectedUser || !showUsersList) return;
      const shouldExpand =
        expandAnim.value.value > 0.5 || event.velocityY < -500;
      expandAnim.value.value = withSpring(shouldExpand ? 1 : 0);
      scheduleOnRN(setIsListExpanded, shouldExpand);
    });

  const panelStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(panelAnim.value.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(panelAnim.value.value, [0, 1], [220, 0]),
        },
      ],
    };
  });

  const usersListStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(
      expandAnim.value.value,
      [0, 1],
      [0, listMaxHeight],
    );
    return { maxHeight };
  });

  const value: MapOverlayContextValue = {
    users,
    currentUserId: session?.user?.id,
    selectedUser,
    showUsersList,
    panelStyle,
    usersListStyle,
    panGesture,
    onToggleExpand: () => setIsListExpanded((prev) => !prev),
    onAddPress: () => shareModal.openModal(),
    onManagePress: () => setShowManageModal(true),
    onSelectUser: handleSelectUser,
    onBackToList: () => {
      deselect();
      setShowUsersList(true);
    },
    onStopSharing: handleStopSharing,
    canStopSharing,
    sharingUserIds,
    shareModal,
    allAvailableUsers,
    showManageModal,
    setShowManageModal,
    sharingSettings,
    removeUser,
    isRemovingUser,
    mapTheme,
    onToggleTheme,
    onRecenter: handleRecenter,
    onMapUserPress: handleMapUserPress,
    onMapPress: () => {
      if (isListExpanded) {
        setIsListExpanded(false);
      }
    },
    focusedCoordinate,
  };

  return (
    <MapOverlayContext.Provider value={value}>
      {children}
    </MapOverlayContext.Provider>
  );
}

export function useMapOverlayContext() {
  const context = useContext(MapOverlayContext);
  if (!context) {
    throw new Error("useMapOverlayContext must be used within MapOverlayProvider");
  }
  return context;
}
