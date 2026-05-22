import React, { useMemo, useRef, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { UserAvatar } from "./ui/UserAvatar";
import {
  MapView,
  Camera,
  UserLocation as MapLibreUserLocation,
  PointAnnotation,
  VectorSource,
  RasterSource,
  RasterLayer,
} from "@maplibre/maplibre-react-native";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import { useLocationContext } from "~/stores/location";

export interface UserLocation {
  id: string;
  name: string;
  coordinate: [number, number]; // [longitude, latitude]
  email?: string;
  address?: string;
  /** Optional avatar image URL */
  avatarUrl?: string | null;
  /** ISO string or millis since epoch */
  lastActiveAt: string | number;
}

export interface UserMapProps {
  users: UserLocation[];
  /**
   * Called when user marker is pressed.
   */
  onUserPress?: (user: UserLocation) => void;
  /**
   * Called when the map itself is pressed (not a marker).
   */
  onMapPress?: () => void;
  /**
   * Initial zoom level when centering on the user.
   */
  initialZoomLevel?: number;
  /**
   * Optional overlay (e.g., Slopes-like UI) rendered above the map.
   */
  overlay?: React.ReactNode;
  /**
   * Optional map style URL (overrides internal MAP_STYLE).
   */
  mapStyleURL?: string;
  /**
   * Coordinate to focus when a user is selected.
   */
  focusedCoordinate?: [number, number] | null;
  /**
   * Optional hook for current device location updates.
   */
  onLocationUpdate?: (coords: { longitude: number; latitude: number }) => void;
  /**
   * Optional vector tile source URL (e.g. OpenSkiMap vector tiles).
   * If provided, ShapeSource will use `url` instead of a local GeoJSON `shape`.
   */
  vectorSourceUrl?: string;
  /**
   * Optional source layer name inside the vector tiles (if required).
   */
  vectorSourceLayer?: string;
  /**
   * Current map theme: 'dark' | 'light'.
   */
  mapTheme?: "dark" | "light";
  /**
   * Called when user toggles the map theme.
   */
  onToggleMapTheme?: () => void;
  /**
   * ID of the currently logged-in user. When provided, their location is
   * managed directly from MapLibreUserLocation instead of from users array.
   */
  currentUserId?: string;
  /**
   * Current logged-in user's name (used when displaying their avatar).
   */
  currentUserName?: string;
  /**
   * Current logged-in user's avatar URL.
   */
  currentUserAvatarUrl?: string | null;
}

// Map style configuration (base style + optional raster overlays)
interface MapRasterOverlay {
  id: string;
  tileUrlTemplates: string[];
  tileSize?: number;
  attribution?: string;
  layerId?: string;
  layerStyle?: object;
}

interface MapStyleConfig {
  style: string | object;
  rasterOverlays?: MapRasterOverlay[];
}

const MAP_STYLES: Record<"dark" | "light", MapStyleConfig> = {
  dark: {
    style: "https://tiles.openfreemap.org/styles/fiord",
    rasterOverlays: [
      {
        id: "opensnowmap-pistes",
        tileUrlTemplates: ["https://tiles.opensnowmap.org/tiles-pistes-high-dpi/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenSnowMap.org",
        layerId: "opensnowmap-overlay",
        layerStyle: {
          rasterOpacity: 0.9,
          rasterSaturation: 0.5,
          rasterBrightnessMin: 0,
          rasterBrightnessMax: 1,
        },
      },
    ],
  },
  light: {
    style: "https://tiles.openfreemap.org/styles/liberty",
    rasterOverlays: [
      {
        id: "opensnowmap-pistes",
        tileUrlTemplates: ["https://tiles.opensnowmap.org/tiles-pistes-high-dpi/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenSnowMap.org",
        layerId: "opensnowmap-overlay",
        layerStyle: { rasterOpacity: 0.9 },
      },
    ],
  },
};
/**
 * Compute opacity (0–1) based on last activity timestamp.
 * 0 minutes ago  -> 1.0
 * 24+ hours      -> 0.0 (invisible)
 */
export function getActivityOpacity(
  lastActiveAt: string | number,
  now: number = Date.now(),
): number {
  const last = typeof lastActiveAt === "number" ? lastActiveAt : new Date(lastActiveAt).getTime();

  if (!Number.isFinite(last)) return 0;

  const diffMs = Math.max(0, now - last);
  const diffHours = diffMs / 3600000; // milliseconds to hours

  if (diffHours >= 24) return 0;
  // Linear fade from 0–24 hours
  const ratio = 1 - diffHours / 24;
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, ratio));
}

export function processUserLocationUpdate(
  loc: {
    coords?: { longitude?: number | null; latitude?: number | null };
  },
  currentUserId: string | undefined,
  canShareOwnLocation: boolean,
  hasCentered: boolean,
): {
  shouldUpdateLocation: boolean;
  coordinate: [number, number] | null;
  shouldCenter: boolean;
  shouldNotify: boolean;
} {
  if (!loc.coords) {
    return { shouldUpdateLocation: false, coordinate: null, shouldCenter: false, shouldNotify: false };
  }

  const { longitude, latitude } = loc.coords;
  if (longitude == null || latitude == null) {
    return { shouldUpdateLocation: false, coordinate: null, shouldCenter: false, shouldNotify: false };
  }

  const shouldUpdateLocation = Boolean(currentUserId && canShareOwnLocation);
  const shouldCenter = !hasCentered;
  const shouldNotify = true;

  return {
    shouldUpdateLocation,
    coordinate: [longitude, latitude],
    shouldCenter,
    shouldNotify,
  };
}

export function buildMapStyleConfig(
  mapStyleURL: string | undefined,
  mapTheme: "dark" | "light",
): MapStyleConfig {
  if (mapStyleURL) {
    return { style: mapStyleURL };
  }
  return MAP_STYLES[mapTheme];
}

export function buildFilteredUsers(
  users: UserLocation[],
  now: number,
  currentUserId: string | undefined,
  currentUserLocation: [number, number] | null,
  currentUserName: string | undefined,
  currentUserAvatarUrl: string | null | undefined,
  canViewOthersLocations: boolean,
  canShareOwnLocation: boolean,
): UserLocation[] {
  if (!canViewOthersLocations) {
    return [];
  }

  let displayUsers = users.filter(
    (user) => user.id !== currentUserId && getActivityOpacity(user.lastActiveAt, now) > 0,
  );

  if (currentUserId && currentUserLocation && currentUserName && canShareOwnLocation) {
    const currentUser: UserLocation = {
      id: currentUserId,
      name: currentUserName,
      coordinate: currentUserLocation,
      avatarUrl: currentUserAvatarUrl ?? null,
      lastActiveAt: now,
    };
    displayUsers = [currentUser, ...displayUsers];
  }

  return displayUsers;
}

export const UserMap: React.FC<UserMapProps> = ({
  users,
  onUserPress,
  onMapPress,
  initialZoomLevel = 14,
  overlay,
  vectorSourceUrl,
  mapStyleURL,
  onLocationUpdate,
  focusedCoordinate,
  mapTheme = "dark",
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
}) => {
  // All hooks must be called before any early returns
  const cameraRef = useRef<CameraRef>(null);
  const hasCenteredRef = useRef(false);
  const { canShareOwnLocation, canViewOthersLocations } = useLocationContext();

  // Keep a periodic `now` in state to avoid calling Date.now() during render
  // Initialize `now` lazily and update on interval; avoids calling Date.now() synchronously inside effect
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  // Track current user's location directly from MapLibreUserLocation
  const [currentUserLocation, setCurrentUserLocation] = useState<[number, number] | null>(null);

  const filteredUsers = useMemo(
    () =>
      buildFilteredUsers(
        users,
        now,
        currentUserId,
        currentUserLocation,
        currentUserName,
        currentUserAvatarUrl,
        canViewOthersLocations,
        canShareOwnLocation,
      ),
    [
      users,
      now,
      currentUserId,
      currentUserLocation,
      currentUserName,
      currentUserAvatarUrl,
      canViewOthersLocations,
      canShareOwnLocation,
    ],
  );

  useEffect(() => {
    if (!focusedCoordinate) return;
    cameraRef.current?.setCamera?.({
      centerCoordinate: focusedCoordinate,
      zoomLevel: initialZoomLevel,
      animationDuration: 1200,
      padding: { paddingBottom: 220, paddingTop: 40, paddingLeft: 40, paddingRight: 40 },
    });
  }, [focusedCoordinate, initialZoomLevel]);

  const handleUserLocationUpdate = (loc: {
    coords?: { longitude?: number | null; latitude?: number | null };
  }) => {
    const result = processUserLocationUpdate(loc, currentUserId, canShareOwnLocation, hasCenteredRef.current);

    if (!result.coordinate) return;

    const [longitude, latitude] = result.coordinate;

    if (result.shouldUpdateLocation) {
      setCurrentUserLocation([longitude, latitude]);
    }

    if (result.shouldCenter) {
      cameraRef.current?.setCamera?.({
        centerCoordinate: [longitude, latitude],
        zoomLevel: initialZoomLevel,
        animationDuration: 1600,
      });
      hasCenteredRef.current = true;
    }

    if (result.shouldNotify) {
      onLocationUpdate?.({ longitude, latitude });
    }
  };

  const selectedMapConfig = buildMapStyleConfig(mapStyleURL, mapTheme);
  const currentMapStyle = selectedMapConfig.style;

  return (
    <View style={styles.container}>
      <MapView
        mapStyle={currentMapStyle}
        style={styles.map}
        logoEnabled={false}
        compassEnabled
        rotateEnabled
        pitchEnabled
        scrollEnabled
        zoomEnabled
        onPress={onMapPress}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={
            filteredUsers[0]
              ? { centerCoordinate: filteredUsers[0].coordinate, zoomLevel: initialZoomLevel }
              : undefined
          }
        />
        {canShareOwnLocation && MapLibreUserLocation && (
          <MapLibreUserLocation
            visible={false}
            showsUserHeadingIndicator={false}
            androidRenderMode="compass"
            onUpdate={handleUserLocationUpdate}
          />
        )}

        {(selectedMapConfig.rasterOverlays ?? []).map((overlay) => (
          <RasterSource
            key={overlay.id}
            id={overlay.id}
            tileUrlTemplates={overlay.tileUrlTemplates}
            tileSize={overlay.tileSize}
            attribution={overlay.attribution}
          >
            <RasterLayer
              id={overlay.layerId ?? `${overlay.id}-layer`}
              sourceID={overlay.id}
              style={overlay.layerStyle}
            />
          </RasterSource>
        ))}

        {vectorSourceUrl && VectorSource ? <VectorSource url={vectorSourceUrl} id="map" /> : null}

        {filteredUsers.map((user) => (
          <PointAnnotation
            key={user.id}
            id={`user-${user.id}`}
            coordinate={user.coordinate}
            onSelected={() => onUserPress?.(user)}
          >
            <View style={styles.avatarShadow}>
              <View style={styles.avatarBorder}>
                <UserAvatar name={user.name} size={34} imageUrl={user.avatarUrl} />
              </View>
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {/* Overlay container for UI elements */}
      <View style={styles.overlayContainer}>{overlay}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },

  avatarShadow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatarBorder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#0F172A",
  },
});
