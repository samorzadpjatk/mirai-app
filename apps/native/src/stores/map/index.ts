// Map store moved to @mirai-app/shared
export { mapStore } from "@mirai-app/shared";
export type {
  MapStore,
  MapState,
  MapActions,
  MapTheme,
  MapUserLocation,
} from "@mirai-app/shared";
export { useMapStore, useMapActions } from "./mapHooks";

// Map overlay store (React Native specific - stays here)
export { mapOverlayStore, useMapOverlayStore, MapOverlayProvider, setMapOverlayExternals } from "./mapOverlayStore";
export type {
  MapOverlayStore,
  MapOverlayState,
  MapOverlayActions,
  ShareableUser,
  SharingUser,
  SharingSettings,
} from "./mapOverlayStore";
