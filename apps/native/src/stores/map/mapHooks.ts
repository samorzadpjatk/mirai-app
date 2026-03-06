import { useStore } from "zustand";
import { mapStore } from "./mapStore";
import type { MapStore } from "./mapStore";

/**
 * Hook to access the full map store.
 */
export function useMapStore<T>(selector: (state: MapStore) => T): T {
  return useStore(mapStore, selector);
}

/**
 * Hook to access map actions only (stable references).
 */
export function useMapActions() {
  return useStore(mapStore, (state) => ({
    selectUser: state.selectUser,
    deselectUser: state.deselectUser,
    backToList: state.backToList,
    toggleListExpansion: state.toggleListExpansion,
    collapseList: state.collapseList,
    setShowManageModal: state.setShowManageModal,
    setFollowMode: state.setFollowMode,
    setFocusedCoordinate: state.setFocusedCoordinate,
    toggleTheme: state.toggleTheme,
    recenter: state.recenter,
    handleMapUserPress: state.handleMapUserPress,
    handleMapPress: state.handleMapPress,
  }));
}
