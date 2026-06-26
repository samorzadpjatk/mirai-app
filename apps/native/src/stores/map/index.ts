// Map store moved to @mirai-app/common

export type {
  MapActions,
  MapState,
  MapStore,
  MapTheme,
  MapUserLocation,
} from "@mirai-app/common/stores";
export { mapStore } from "@mirai-app/common/stores";
export { useMapActions, useMapStore } from "./mapHooks";
export type {
  MapOverlayActions,
  MapOverlayState,
  MapOverlayStore,
  ShareableUser,
  SharingSettings,
  SharingUser,
} from "./mapOverlayStore";
// Map overlay store (React Native specific - stays here)
export {
  MapOverlayProvider,
  mapOverlayStore,
  setMapOverlayExternals,
  useMapOverlayStore,
} from "./mapOverlayStore";
