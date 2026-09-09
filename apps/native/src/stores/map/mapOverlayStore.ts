"use no memo";

import React, { createContext, useContext } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { UserLocation } from "~/components/map/UserMap";
import { useMapSelectedUser } from "~/hooks/map";
import { usePanelAnimation, useShareModal } from "~/hooks/ui";
import type { UseMapOverlayGesturesReturn } from "./hooks/useMapOverlayGestures";
import { useMapOverlayGestures } from "./hooks/useMapOverlayGestures";
import {
  type MapTheme,
  type SharingSettings,
  buildFocusStateFromUser,
  getNextMapTheme,
  isValidCoordinate,
  removeUserFromSharingSettings,
  removeUserFromSharingUserIds,
  shouldCollapseList,
} from "./mapOverlayStoreUtils";

export type { MapTheme, SharingSettings };

export {
  getNextMapTheme,
  isValidCoordinate,
  shouldCollapseList,
  buildFocusStateFromUser,
  removeUserFromSharingUserIds,
  removeUserFromSharingSettings,
};

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

/**
 * Store fields owned by the map screen's data sources (queries, stream, session).
 *
 * `mapTheme` is deliberately absent: it is user-controlled through `toggleTheme`
 * and lives entirely in the store. Writing it from the screen's data-sync effect
 * overwrote the user's choice on the next tick of the location stream, which is
 * why the light/dark toggle snapped straight back to dark.
 */
export type MapOverlayDataSlice = Pick<
  MapOverlayState,
  | "users"
  | "currentUserId"
  | "sharingUserIds"
  | "allAvailableUsers"
  | "sharingSettings"
  | "isRemovingUser"
>;

export function buildMapOverlaySyncState(input: MapOverlayDataSlice): MapOverlayDataSlice {
  return {
    users: input.users,
    currentUserId: input.currentUserId,
    sharingUserIds: input.sharingUserIds,
    allAvailableUsers: input.allAvailableUsers,
    sharingSettings: input.sharingSettings,
    isRemovingUser: input.isRemovingUser,
  };
}

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
      mapTheme: getNextMapTheme(state.mapTheme),
    }));
  },

  recenter: (currentCoordinate) => {
    if (!isValidCoordinate(currentCoordinate)) return;
    set({
      followMode: null,
      focusedCoordinate: currentCoordinate,
    });
  },

  handleMapUserPress: (user) => {
    set(buildFocusStateFromUser(user));
  },

  handleMapPress: () => {
    const { isListExpanded } = get();
    if (shouldCollapseList(isListExpanded)) {
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

      const updatedSharingUserIds = removeUserFromSharingUserIds(sharingUserIds, userId);
      setSharingUserIds(updatedSharingUserIds);

      const { sharingSettings } = get();
      const updatedSettings = removeUserFromSharingSettings(sharingSettings, userId);
      if (updatedSettings) {
        set({ sharingSettings: updatedSettings });
      }
    } catch {
      // TODO: Add Sentry crash reporting for production errors
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

export interface MapOverlayHandlerDeps {
  store: MapOverlayStore;
  selectedUserState: {
    selectedUser: UserLocation | null;
    selectUser: (user: UserLocation) => void;
    deselect: () => void;
    stopSharing: () => Promise<void>;
    mapUserPress: (user: UserLocation) => void;
    canStopSharing: boolean;
  };
  externals: {
    removeUser: (userId: string) => Promise<void>;
    currentCoordinate: [number, number] | null;
  };
  shareModal: {
    openModal: () => void;
  };
}

export function buildMapOverlayHandlers(deps: MapOverlayHandlerDeps) {
  const { store, selectedUserState, externals, shareModal } = deps;
  const { selectUser, deselect, stopSharing, mapUserPress } = selectedUserState;
  const { removeUser, currentCoordinate } = externals;

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
    await removeUser(userId);
    store.handleRemoveUser(userId);
  };

  const handleBackToList = () => {
    deselect();
    store.backToList();
  };

  return {
    handleSelectUser,
    handleMapUserPress,
    handleStopSharing,
    handleRecenter,
    handleRemoveUser,
    handleBackToList,
    onAddPress: () => shareModal.openModal(),
    onManagePress: () => store.setShowManageModal(true),
    onToggleExpand: store.toggleListExpansion,
    onMapPress: store.handleMapPress,
  };
}

export type MapOverlayShareModal = ReturnType<typeof useShareModal>;
export type MapOverlayHandlers = ReturnType<typeof buildMapOverlayHandlers>;

/**
 * Everything a map overlay component consumes: the zustand slice plus the
 * React-local state (selection, share modal, panel animations) that only makes
 * sense when it is shared by every overlay component.
 */
export type MapOverlayController = Omit<MapOverlayStore, keyof MapOverlayHandlers> &
  MapOverlayHandlers & {
    selectedUser: UserLocation | null;
    panelStyle: UseMapOverlayGesturesReturn["panelStyle"];
    usersListStyle: UseMapOverlayGesturesReturn["usersListStyle"];
    panGesture: UseMapOverlayGesturesReturn["panGesture"];
    canStopSharing: boolean;
    shareModal: MapOverlayShareModal;
  };

/**
 * Builds the overlay controller. Call this EXACTLY ONCE per map screen and hand
 * the result to every overlay component through `MapOverlayStateProvider`.
 *
 * It is not a plain store subscription: `useShareModal`, `useMapSelectedUser`
 * and `usePanelAnimation` create React-local state. Calling it independently in
 * each component gave every component its own modal flag and its own selection,
 * so the "+" button flipped a flag nobody rendered and selecting a user left the
 * panel blank.
 */
function useMapOverlayController(): MapOverlayController {
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

  const handlers = buildMapOverlayHandlers({
    store,
    selectedUserState: {
      selectedUser,
      selectUser,
      deselect,
      stopSharing,
      mapUserPress,
      canStopSharing,
    },
    externals: { removeUser, currentCoordinate },
    shareModal,
  });

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

  const { panGesture, panelStyle, usersListStyle } = useMapOverlayGestures(
    expandAnim.value,
    panelAnim.value,
    selectedUser,
    store.showUsersList,
    store.isListExpanded,
    store.toggleListExpansion,
    listMaxHeight,
  );

  return {
    ...store,
    selectedUser,
    panelStyle,
    usersListStyle,
    panGesture,
    canStopSharing,
    shareModal,
    ...handlers,
  };
}

const MapOverlayStateContext = createContext<MapOverlayController | null>(null);

/**
 * Creates the single overlay controller and shares it with every overlay
 * component below it. Mount it once, around the map screen.
 */
export function MapOverlayStateProvider({ children }: { children: React.ReactNode }) {
  const controller = useMapOverlayController();

  return React.createElement(MapOverlayStateContext.Provider, { value: controller }, children);
}

/**
 * Reads the shared overlay controller. Throws outside the provider rather than
 * silently handing back a private copy of the modal / selection state.
 */
export function useMapOverlayStore(): MapOverlayController {
  const controller = useContext(MapOverlayStateContext);

  if (!controller) {
    throw new Error(
      "useMapOverlayStore must be used inside <MapOverlayStateProvider>: every map overlay component has to share one controller instance.",
    );
  }

  return controller;
}
