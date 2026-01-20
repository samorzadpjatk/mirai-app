import React, { useMemo, useRef, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { UserAvatar } from "./UserAvatar";
import { MapView, Camera, UserLocation as MapLibreUserLocation, PointAnnotation, VectorSource } from "@maplibre/maplibre-react-native";
import type { CameraRef } from "@maplibre/maplibre-react-native";

export interface UserLocation {
  id: string;
  name: string;
  coordinate: [number, number]; // [longitude, latitude]
  avatarUrl?: string | null;
  email?: string;
  address?: string;
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
  mapTheme?: 'dark' | 'light';
  /**
   * Called when user toggles the map theme.
   */
  onToggleMapTheme?: () => void;
}

interface UserFeature {
  type: "Feature";
  id: string;
  properties: {
    id: string;
    name: string;
    avatarUrl: string;
    opacity: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface UserFeatureCollection {
  type: "FeatureCollection";
  features: UserFeature[];
}

// Basic MapLibre style - OpenSnowMap for ski resorts with pistes overlay
const MAP_STYLE_DARK = {
  version: 8,
  name: "OpenSnowMap Dark",
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
    "opensnowmap-pistes": {
      type: "raster",
      tiles: ["https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenSnowMap.org",
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm-tiles",
      paint: {
        "raster-saturation": -0.8,
        "raster-brightness-min": 0.1,
        "raster-brightness-max": 0.4,
      },
    },
    {
      id: "opensnowmap-overlay",
      type: "raster",
      source: "opensnowmap-pistes",
      paint: {
        "raster-opacity": 0.9,
      },
    },
  ],
};

const MAP_STYLE_LIGHT = {
  version: 8,
  name: "OpenSnowMap Light",
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
    "opensnowmap-pistes": {
      type: "raster",
      tiles: ["https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenSnowMap.org",
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm-tiles",
    },
    {
      id: "opensnowmap-overlay",
      type: "raster",
      source: "opensnowmap-pistes",
      paint: {
        "raster-opacity": 0.9,
      },
    },
  ],
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
  const last =
    typeof lastActiveAt === "number"
      ? lastActiveAt
      : new Date(lastActiveAt).getTime();

  if (!Number.isFinite(last)) return 0;

  const diffMs = Math.max(0, now - last);
  const diffHours = diffMs / 3600000; // milliseconds to hours

  if (diffHours >= 24) return 0;
  // Linear fade from 0–24 hours
  const ratio = 1 - diffHours / 24;
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, ratio));
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
  mapTheme = 'dark',
}) => {
  // All hooks must be called before any early returns
  const cameraRef = useRef<CameraRef>(null);
  const hasCenteredRef = useRef(false);

  // Keep a periodic `now` in state to avoid calling Date.now() during render
  // Initialize `now` lazily and update on interval; avoids calling Date.now() synchronously inside effect
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => getActivityOpacity(user.lastActiveAt, now) > 0);
  }, [users, now]);

  // No runtime imports — directly set camera when focusedCoordinate changes
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
    if (!loc.coords) return;

    const { longitude, latitude } = loc.coords;
    if (longitude == null || latitude == null) return;

    if (!hasCenteredRef.current) {
      cameraRef.current?.setCamera?.({
        centerCoordinate: [longitude, latitude],
        zoomLevel: initialZoomLevel,
        animationDuration: 1600,
      });
      hasCenteredRef.current = true;
    }

    onLocationUpdate?.({ longitude, latitude });
  };

  const currentMapStyle = mapStyleURL ?? (mapTheme === 'light' ? MAP_STYLE_LIGHT : MAP_STYLE_DARK) as string | object;



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
            users[0]
              ? { centerCoordinate: users[0].coordinate, zoomLevel: initialZoomLevel }
              : undefined
          }
        />
        {MapLibreUserLocation && (
          <MapLibreUserLocation
            visible={false}
            showsUserHeadingIndicator={false}
            androidRenderMode="compass"
            onUpdate={handleUserLocationUpdate}
          />
        )}

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
                <UserAvatar
                  imageUrl={user.avatarUrl}
                  name={user.name}
                  size={34}
                />
              </View>
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {overlay}
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


