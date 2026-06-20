import { createStore } from "zustand/vanilla";

export type MapTheme = "dark" | "light";

export interface MapUserLocation {
  id: string;
  coordinate: [number, number];
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

export interface MapState {
  selectedUserId: string | null;
  showUsersList: boolean;
  isListExpanded: boolean;
  showManageModal: boolean;
  followMode: "user" | null;
  focusedCoordinate: [number, number] | null;
  mapTheme: MapTheme;
}

export interface MapActions {
  selectUser: (userId: string, coordinate: [number, number]) => void;
  deselectUser: () => void;
  backToList: () => void;
  toggleListExpansion: () => void;
  collapseList: () => void;
  setShowManageModal: (open: boolean) => void;
  setFollowMode: (mode: "user" | null) => void;
  setFocusedCoordinate: (coordinate: [number, number] | null) => void;
  toggleTheme: () => void;
  recenter: (currentCoordinate: [number, number] | null) => void;
  handleMapUserPress: (userId: string, coordinate: [number, number]) => void;
  handleMapPress: () => void;
}

export type MapStore = MapState & MapActions;

export const mapStore = createStore<MapStore>()((set, get) => ({
  // State
  selectedUserId: null,
  showUsersList: true,
  isListExpanded: false,
  showManageModal: false,
  followMode: null,
  focusedCoordinate: null,
  mapTheme: "dark",

  // Actions
  selectUser: (userId, coordinate) => {
    set({
      selectedUserId: userId,
      showUsersList: false,
      isListExpanded: false,
      followMode: "user",
      focusedCoordinate: [...coordinate],
    });
  },

  deselectUser: () => {
    set({ selectedUserId: null });
  },

  backToList: () => {
    set({
      selectedUserId: null,
      showUsersList: true,
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
      selectedUserId: null,
      focusedCoordinate: currentCoordinate,
    });
  },

  handleMapUserPress: (userId, coordinate) => {
    set({
      selectedUserId: userId,
      followMode: "user",
      focusedCoordinate: [...coordinate],
    });
  },

  handleMapPress: () => {
    const { isListExpanded } = get();
    if (isListExpanded) {
      set({ isListExpanded: false });
    }
  },
}));
