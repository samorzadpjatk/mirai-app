"use no memo";

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import React, { createContext, useContext } from "react";
import {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import type { UserLocation } from "~/components/map/UserMap";
import { usePanelAnimation, useShareModal } from "~/hooks/ui";
import { useMapSelectedUser } from "~/hooks/map";

export type MapTheme = "dark" | "light";

export interface ShareableUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

export interface SharingUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

export interface SharingSettings {
  usersToShareWith?: SharingUser[];
}

export interface MapOverlayState {
  users: UserLocation[];
  currentUserId?: string;
  showUsersList: boolean;
  isListExpanded: boolean;
  showManageModal: boolean;
  followMode: "user" | null;
  focusedCoordinate: [number, number] | null;
  mapTheme: MapTheme;
  sharingUserIds: string[];
  allAvailableUsers?: ShareableUser[];
  sharingSettings?: SharingSettings | null;
  isRemovingUser: boolean;
}

export interface MapOverlayActions {
  selectUser: (user: UserLocation) => void;
  deselectUser: () => void;
  backToList: () => void;
  toggleListExpansion: () => void;
  collapseList: () => void;
  setShowManageModal: (open: boolean) => void;
  setFollowMode: (mode: "user" | null) => void;
  setFocusedCoordinate: (coordinate: [number, number] | null) => void;
  toggleTheme: () => void;
  recenter: (currentCoordinate: [number, number] | null) => void;
  handleMapUserPress: (user: UserLocation) => void;
  handleMapPress: () => void;
  setUsers: (users: UserLocation[]) => void;
  setCurrentUserId: (userId?: string) => void;
  setSharingUserIds: (ids: string[]) => void;
  setAllAvailableUsers: (users?: ShareableUser[]) => void;
  setSharingSettings: (settings?: SharingSettings | null) => void;
  setIsRemovingUser: (isRemoving: boolean) => void;
  handleRemoveUser: (userId: string) => void;
}

export type MapOverlayStore = MapOverlayState & MapOverlayActions;

// Zustand store for state management
export const mapOverlayStore = createStore<MapOverlayStore>()((set, get) => ({
  // State
  users: [],
  currentUserId: undefined,
  showUsersList: true,
  isListExpanded: false,
  showManageModal: false,
  followMode: null,
  focusedCoordinate: null,
  mapTheme: "dark",
  sharingUserIds: [],
  allAvailableUsers: undefined,
  sharingSettings: undefined,
  isRemovingUser: false,

  // Actions
  selectUser: (user) => {
    set({
      showUsersList: false,
      isListExpanded: false,
      followMode: "user",
      focusedCoordinate: [...user.coordinate],
    });
  },

  deselectUser: () => {
    set({ followMode: null });
  },

  backToList: () => {
    set({
      showUsersList: true,
      followMode: null,
    });
  },

  toggleListExpansion: () => {
    set((state) => ({ isListExpanded: !state.isListExpanded }));
  },

  collapseList: () => {
    set({ isListExpanded: false });
  },

  setShowManageModal: (open) => {
    set({ showManageModal: open });
  },

  setFollowMode: (mode) => {
    set({ followMode: mode });
  },

  setFocusedCoordinate: (coordinate) => {
    set({ focusedCoordinate: coordinate });
  },

  toggleTheme: () => {
    set((state) => ({
      mapTheme: state.mapTheme === "dark" ? "light" : "dark",
    }));
  },

  recenter: (currentCoordinate) => {
    if (!currentCoordinate) return;
    set({
      followMode: null,
      focusedCoordinate: currentCoordinate,
    });
  },

  handleMapUserPress: (user) => {
    set({
      followMode: "user",
      focusedCoordinate: [...user.coordinate],
    });
  },

  handleMapPress: () => {
    const { isListExpanded } = get();
    if (isListExpanded) {
      set({ isListExpanded: false });
    }
  },

  setUsers: (users) => {
    set({ users });
  },

  setCurrentUserId: (userId) => {
    set({ currentUserId: userId });
  },

  setSharingUserIds: (ids) => {
    set({ sharingUserIds: ids });
  },

  setAllAvailableUsers: (users) => {
    set({ allAvailableUsers: users });
  },

  setSharingSettings: (settings) => {
    set({ sharingSettings: settings });
  },

  setIsRemovingUser: (isRemoving) => {
    set({ isRemovingUser: isRemoving });
  },

  handleRemoveUser: (userId) => {
    const { setIsRemovingUser, sharingUserIds, setSharingUserIds } = get();

    try {
      setIsRemovingUser(true);

      // Note: removeUser functionality should be called from the hook, not the store
      // This action will be handled at the hook level

      // Update sharingUserIds to remove the user
      const updatedSharingUserIds = sharingUserIds.filter((id) => id !== userId);
      setSharingUserIds(updatedSharingUserIds);

      // Update sharingSettings to remove the user from usersToShareWith
      const { sharingSettings } = get();
      if (sharingSettings?.usersToShareWith) {
        const updatedUsersToShareWith = sharingSettings.usersToShareWith.filter(
          (user) => user.id !== userId,
        );
        set({
          sharingSettings: {
            ...sharingSettings,
            usersToShareWith: updatedUsersToShareWith,
          },
        });
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
    } finally {
      setIsRemovingUser(false);
    }
  },
}));

// React Context for external data injection
interface MapOverlayExternals {
  session?: { user?: { id?: string } } | null;
  updateSharing: (ids: string[]) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  currentCoordinate: [number, number] | null;
}

const MapOverlayContext = createContext<MapOverlayExternals | null>(null);

// Global store for externals that can be set outside of React context
let externals: MapOverlayExternals = {
  updateSharing: async () => {
    // Default implementation - will be overridden by setMapOverlayExternals
  },
  removeUser: async () => {
    // Default implementation - will be overridden by setMapOverlayExternals
  },
  currentCoordinate: null,
};

export function setMapOverlayExternals(newExternals: Partial<MapOverlayExternals>) {
  externals = { ...externals, ...newExternals };
}

export function MapOverlayProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MapOverlayExternals;
}) {
  // Update global externals when provider value changes
  externals = value;

  return React.createElement(MapOverlayContext.Provider, { value }, children);
}

function useMapOverlayExternals(): MapOverlayExternals {
  const context = useContext(MapOverlayContext);
  // Return context if available, otherwise return global externals
  return context ?? externals;
}

// Hook that combines store with animations and external data
export function useMapOverlayStore() {
  const store = useStore(mapOverlayStore);

  // Animation values
  const listMaxHeight = 300;
  const panelAnim = usePanelAnimation(false, 240);
  const expandAnim = usePanelAnimation(false, 300);

  // External data from context
  const { session, updateSharing, removeUser, currentCoordinate } = useMapOverlayExternals();

  // Share modal
  const shareModal = useShareModal({
    sharingUserIds: store.sharingUserIds,
    updateSharing,
  });

  // Selected user state
  const selectedUserState = useMapSelectedUser({
    session,
    users: store.users,
    sharingUserIds: store.sharingUserIds,
    updateSharing,
  });

  const { selectedUser, selectUser, deselect, stopSharing, mapUserPress, canStopSharing } =
    selectedUserState;

  // Update store when selected user changes
  const handleSelectUser = (user: UserLocation) => {
    selectUser(user);
    store.selectUser(user);
  };

  const handleMapUserPress = (user: UserLocation) => {
    mapUserPress(user);
    store.handleMapUserPress(user);
  };

  const handleStopSharing = async () => {
    await stopSharing();
    deselect();
    store.backToList();
  };

  const handleRecenter = () => {
    if (!currentCoordinate) return;
    deselect();
    store.recenter(currentCoordinate);
  };

  const handleRemoveUser = async (userId: string) => {
    // Call the external removeUser function first
    await removeUser(userId);
    // Then update the store state
    store.handleRemoveUser(userId);
  };

  const handleBackToList = () => {
    deselect();
    store.backToList();
  };

  // Effects
  React.useEffect(() => {
    if (!selectedUser) return;
    if (store.followMode !== "user") return;
    const id = setTimeout(() => store.setFocusedCoordinate(selectedUser.coordinate), 0);
    return () => clearTimeout(id);
  }, [selectedUser, store.followMode, store]);

  React.useEffect(() => {
    panelAnim.setOpen(!!selectedUser || store.showUsersList);
  }, [panelAnim, selectedUser, store.showUsersList]);

  React.useEffect(() => {
    expandAnim.setOpen(store.isListExpanded);
  }, [expandAnim, store.isListExpanded]);

  const listDragStart = useSharedValue(0);
  const expandValue = expandAnim.value;
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      listDragStart.value = expandValue.value;
    })
    .onUpdate((event) => {
      if (selectedUser || !store.showUsersList) return;
      const dragProgress = listDragStart.value + -event.translationY / listMaxHeight;
      expandValue.value = Math.max(0, Math.min(1, dragProgress));
    })
    .onEnd((event) => {
      if (selectedUser || !store.showUsersList) return;
      const shouldExpand = expandValue.value > 0.5 || event.velocityY < -500;
      expandValue.value = withSpring(shouldExpand ? 1 : 0);
      if (shouldExpand !== store.isListExpanded) {
        runOnJS(store.toggleListExpansion)();
      }
    });

  // Animated styles
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
    const maxHeight = interpolate(expandAnim.value.value, [0, 1], [0, listMaxHeight]);
    return { maxHeight };
  });

  return {
    ...store,
    selectedUser,
    panelStyle,
    usersListStyle,
    panGesture,
    onToggleExpand: store.toggleListExpansion,
    onAddPress: () => shareModal.openModal(),
    onManagePress: () => store.setShowManageModal(true),
    onSelectUser: handleSelectUser,
    onBackToList: handleBackToList,
    onStopSharing: handleStopSharing,
    canStopSharing,
    shareModal,
    onRecenter: handleRecenter,
    onMapUserPress: handleMapUserPress,
    onMapPress: store.handleMapPress,
    handleRemoveUser,
  };
}
