// Map store moved to @integral-2025-app/shared
export { mapStore } from "@integral-2025-app/shared";
export type {
  MapStore,
  MapState,
  MapActions,
  MapTheme,
  MapUserLocation,
} from "@integral-2025-app/shared";
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
