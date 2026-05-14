import { useStore } from "zustand";
import { useMemo } from "react";
import { mapStore } from "./mapStore";
import type { MapStore } from "./mapStore";

/**
 * Hook to access the full map store.
 */
export function useMapStore<T>(selector: (state: MapStore) => T): T {
  return useStore(mapStore, selector);
}

// Stable action selectors - each selector returns a single stable function reference
const selectSelectUser = (state: MapStore) => state.selectUser;
const selectDeselectUser = (state: MapStore) => state.deselectUser;
const selectBackToList = (state: MapStore) => state.backToList;
const selectToggleListExpansion = (state: MapStore) => state.toggleListExpansion;
const selectCollapseList = (state: MapStore) => state.collapseList;
const selectSetShowManageModal = (state: MapStore) => state.setShowManageModal;
const selectSetFollowMode = (state: MapStore) => state.setFollowMode;
const selectSetFocusedCoordinate = (state: MapStore) => state.setFocusedCoordinate;
const selectToggleTheme = (state: MapStore) => state.toggleTheme;
const selectRecenter = (state: MapStore) => state.recenter;
const selectHandleMapUserPress = (state: MapStore) => state.handleMapUserPress;
const selectHandleMapPress = (state: MapStore) => state.handleMapPress;

/**
 * Hook to access map actions only (stable references).
 * Uses individual selectors to prevent unnecessary re-renders,
 * and useMemo to ensure the returned object reference is stable.
 */
export function useMapActions() {
  const selectUser = useStore(mapStore, selectSelectUser);
  const deselectUser = useStore(mapStore, selectDeselectUser);
  const backToList = useStore(mapStore, selectBackToList);
  const toggleListExpansion = useStore(mapStore, selectToggleListExpansion);
  const collapseList = useStore(mapStore, selectCollapseList);
  const setShowManageModal = useStore(mapStore, selectSetShowManageModal);
  const setFollowMode = useStore(mapStore, selectSetFollowMode);
  const setFocusedCoordinate = useStore(mapStore, selectSetFocusedCoordinate);
  const toggleTheme = useStore(mapStore, selectToggleTheme);
  const recenter = useStore(mapStore, selectRecenter);
  const handleMapUserPress = useStore(mapStore, selectHandleMapUserPress);
  const handleMapPress = useStore(mapStore, selectHandleMapPress);

  return useMemo(
    () => ({
      selectUser,
      deselectUser,
      backToList,
      toggleListExpansion,
      collapseList,
      setShowManageModal,
      setFollowMode,
      setFocusedCoordinate,
      toggleTheme,
      recenter,
      handleMapUserPress,
      handleMapPress,
    }),
    [
      selectUser,
      deselectUser,
      backToList,
      toggleListExpansion,
      collapseList,
      setShowManageModal,
      setFollowMode,
      setFocusedCoordinate,
      toggleTheme,
      recenter,
      handleMapUserPress,
      handleMapPress,
    ],
  );
}
