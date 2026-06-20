// Map store moved to @mirai-app/common
export { mapStore } from "@mirai-app/common/stores";
export type {
  MapStore,
  MapState,
  MapActions,
  MapTheme,
  MapUserLocation,
} from "@mirai-app/common/stores";
export { useMapStore, useMapActions } from "./mapHooks";

// Map overlay store (React Native specific - stays here)
export {
  mapOverlayStore,
  useMapOverlayStore,
  MapOverlayProvider,
  setMapOverlayExternals,
} from "./mapOverlayStore";
export type {
  MapOverlayStore,
  MapOverlayState,
  MapOverlayActions,
  ShareableUser,
  SharingUser,
  SharingSettings,
} from "./mapOverlayStore";
