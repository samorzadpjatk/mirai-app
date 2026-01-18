import React, { useMemo, useRef, useState, useEffect } from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import Constants from "expo-constants";
import { UserAvatar } from "./UserAvatar";

// Import MapLibre types without importing the module itself
type MapViewType = any;
type CameraType = any;
type MapLibreUserLocationType = any;
type PointAnnotationType = any;
type VectorSourceType = any;
type ShapeSourceType = any;
type LineLayerType = any;
type SymbolLayerType = any;

let MapView: MapViewType;
let Camera: CameraType;
let MapLibreUserLocation: MapLibreUserLocationType;
let PointAnnotation: PointAnnotationType;
let VectorSource: VectorSourceType;
let ShapeSource: ShapeSourceType;
let LineLayer: LineLayerType;
let SymbolLayer: SymbolLayerType;

// Only import on non-Expo Go builds
const appOwnership: string = Constants.appOwnership ?? "unknown";
const isExpoGo = appOwnership === "expo";

if (Platform.OS !== "web" && !isExpoGo) {
  try {
    const MapLibre = require("@maplibre/maplibre-react-native");
    MapView = MapLibre.MapView;
    Camera = MapLibre.Camera;
    MapLibreUserLocation = MapLibre.UserLocation;
    PointAnnotation = MapLibre.PointAnnotation;
    VectorSource = MapLibre.VectorSource;
    ShapeSource = MapLibre.ShapeSource;
    LineLayer = MapLibre.LineLayer;
    SymbolLayer = MapLibre.SymbolLayer;
  } catch (err) {
    console.warn("[UserMap] MapLibre native module not available", err);
  }
}

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
   * GeoJSON data for ski resort (pistes, lifts, etc).
   */
  skiResortGeoJSON?: any;
  /**
   * Current map theme: 'dark' or 'light'.
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

interface CameraRef {
  setCamera?: (options: {
    centerCoordinate: [number, number];
    zoomLevel?: number;
    animationDuration?: number;
    padding?: { paddingTop?: number; paddingRight?: number; paddingBottom?: number; paddingLeft?: number };
  }) => void;
}

// Basic MapLibre style & layer IDs
const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
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
  skiResortGeoJSON,
  mapTheme = 'dark',
}) => {
  // Web support for the native MapLibre wrapper is limited and often requires extra setup.
  // Since głównym celem są smartfony, na webie pokazujemy prosty placeholder,
  // żeby nie wywalać całej aplikacji błędem Reacta.
  if (Platform.OS === "web") {
    return (
      <View style={styles.webPlaceholder}>
        <Text>Mapa jest dostępna tylko w aplikacji mobilnej.</Text>
      </View>
    );
  }

  const appOwnership: string = Constants.appOwnership ?? "unknown";
  const isExpoGo = appOwnership === "expo";
  if (isExpoGo) {
    return (
      <View style={styles.webPlaceholder}>
        <Text>MapLibre wymaga dev build (Expo Go nie zawiera natywnego kodu).</Text>
      </View>
    );
  }

  const cameraRef = useRef<CameraRef | null>(null);
  const hasCenteredRef = useRef(false);

  const filteredUsers = useMemo(() => {
    const now = Date.now();
    return users.filter((user) => getActivityOpacity(user.lastActiveAt, now) > 0);
  }, [users]);

  useEffect(() => {
    if (!focusedCoordinate) return;
    cameraRef.current?.setCamera?.({
      centerCoordinate: focusedCoordinate,
      zoomLevel: initialZoomLevel,
      animationDuration: 1200,
      animationMode: "easeTo",
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

  const currentMapStyle = mapStyleURL ?? (mapTheme === 'light' ? MAP_STYLE_LIGHT : MAP_STYLE_DARK);

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

        {vectorSourceUrl ? <VectorSource url={vectorSourceUrl} id="map" /> : null}

        {skiResortGeoJSON && ShapeSource && LineLayer && SymbolLayer && (
          <ShapeSource id="ski-resort-source" shape={skiResortGeoJSON}>
            <LineLayer
              id="pistes-easy"
              filter={['==', ['get', 'piste:difficulty'], 'easy']}
              style={{
                lineColor: '#4ade80',
                lineWidth: 3,
                lineOpacity: 0.8,
              }}
            />
            <LineLayer
              id="pistes-intermediate"
              filter={['==', ['get', 'piste:difficulty'], 'intermediate']}
              style={{
                lineColor: '#3b82f6',
                lineWidth: 3,
                lineOpacity: 0.8,
              }}
            />
            <LineLayer
              id="pistes-advanced"
              filter={['==', ['get', 'piste:difficulty'], 'advanced']}
              style={{
                lineColor: '#ef4444',
                lineWidth: 3,
                lineOpacity: 0.8,
              }}
            />
            <LineLayer
              id="pistes-expert"
              filter={['==', ['get', 'piste:difficulty'], 'expert']}
              style={{
                lineColor: '#1f2937',
                lineWidth: 3,
                lineOpacity: 0.8,
              }}
            />
            <LineLayer
              id="pistes-other"
              filter={['!', ['has', 'piste:difficulty']]}
              style={{
                lineColor: '#9ca3af',
                lineWidth: 2,
                lineOpacity: 0.6,
              }}
            />
            <SymbolLayer
              id="piste-labels"
              minZoomLevel={13}
              filter={['has', 'piste:name']}
              style={{
                textField: ['get', 'piste:name'],
                textSize: 12,
                textColor: [
                  'match',
                  ['get', 'piste:difficulty'],
                  'easy', '#22c55e',
                  'intermediate', '#3b82f6',
                  'advanced', '#ef4444',
                  'expert', '#1f2937',
                  '#9ca3af'
                ],
                textHaloColor: '#ffffff',
                textHaloWidth: 2,
                symbolPlacement: 'line',
                textMaxAngle: 38,
                textRotationAlignment: 'map',
                textPitchAlignment: 'viewport',
              }}
            />
          </ShapeSource>
        )}

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
  webPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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


