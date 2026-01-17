import React, { useMemo } from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import Constants from "expo-constants";
import {
  MapView,
  Camera,
  UserLocation,
  Images,
  ShapeSource,
  CircleLayer,
  SymbolLayer,
  StyleURL,
  VectorSource,
} from "@maplibre/maplibre-react-native";

export interface UserLocation {
  id: string;
  name: string;
  coordinate: [number, number]; // [longitude, latitude]
  avatarUrl: string;
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
   * Optional vector tile source URL (e.g. OpenSkiMap vector tiles).
   * If provided, ShapeSource will use `url` instead of a local GeoJSON `shape`.
   */
  vectorSourceUrl?: string;
  /**
   * Optional source layer name inside the vector tiles (if required).
   */
  vectorSourceLayer?: string;
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

// Basic MapLibre style & layer IDs
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const SOURCE_ID = "users-source";
const LAYER_ID_POINTS = "users-points";
const LAYER_ID_CLUSTERS = "users-clusters";
const LAYER_ID_CLUSTER_COUNT = "users-clusters-count";
const IMAGE_LAYER_ID = "user-avatar";

interface MapPressEvent {
  features?: {
    properties?: {
      id?: string;
      [key: string]: unknown;
    };
  }[];
}

/**
 * Compute opacity (0–1) based on last activity timestamp.
 * 0 minutes ago  -> 1.0
 * 30+ minutes    -> 0.0 (invisible)
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
  const diffMinutes = diffMs / 60000;

  if (diffMinutes >= 30) return 0;
  // Linear fade from 0–30 minutes
  const ratio = 1 - diffMinutes / 30;
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, ratio));
}

export const UserMap: React.FC<UserMapProps> = ({
  users,
  onUserPress,
  initialZoomLevel = 14,
  overlay,
  vectorSourceUrl,
  vectorSourceLayer,
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

  const featureCollection: UserFeatureCollection = useMemo(() => {
    const now = Date.now();

    return {
      type: "FeatureCollection",
      features: users
        .map<UserFeature>((u) => ({
          type: "Feature",
          id: u.id,
          properties: {
            id: u.id,
            name: u.name,
            avatarUrl: u.avatarUrl,
            opacity: getActivityOpacity(u.lastActiveAt, now),
          },
          geometry: {
            type: "Point",
            coordinates: u.coordinate,
          },
        }))
        // Filter out fully expired users (opacity === 0)
        .filter((f) => f.properties.opacity > 0),
    };
  }, [users]);

  const images = useMemo(
    () =>
      featureCollection.features.reduce<Record<string, { uri: string }>>(
        (acc, feature) => {
          const key = `${IMAGE_LAYER_ID}-${feature.id}`;
          acc[key] = { uri: feature.properties.avatarUrl };
          return acc;
        },
        {},
      ),
    [featureCollection],
  );

  const handleOnPress = (event: MapPressEvent) => {
    if (!onUserPress) return;

    const feature = event.features?.[0];
    if (!feature) return;

    const rawId = feature.properties?.id;
    if (typeof rawId !== "string") return;
    const userId = rawId;

    const user = users.find((u) => u.id === userId);
    if (user) {
      onUserPress(user);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        mapStyle={MAP_STYLE}
        style={styles.map}
        logoEnabled={false}
        compassEnabled
        rotateEnabled
        pitchEnabled
        scrollEnabled
        zoomEnabled
      >
        {/* Follow the user location on map start, fallback to first user coordinate */}
        <Camera
          followUserLocation
          defaultSettings={
            users[0]
              ? { centerCoordinate: users[0].coordinate, zoomLevel: initialZoomLevel }
              : undefined
          }
          followZoomLevel={initialZoomLevel}
        />
        <UserLocation
          visible
          showsUserHeadingIndicator
          androidRenderMode="compass"
        />

        <Images images={images} />
        <VectorSource
          url={vectorSourceUrl} id={"map"} />
        <ShapeSource
          id={SOURCE_ID}
          shape={featureCollection}
          cluster
          clusterRadius={48}
        >
          {/* Cluster circles - subtle blue like Slopes pill */}
          <CircleLayer
            id={LAYER_ID_CLUSTERS}
            filter={["has", "point_count"]}
            style={{
              circleColor: "#2563EB",
              circleRadius: [
                "step",
                ["get", "point_count"],
                16,
                10,
                22,
                30,
                28,
              ],
              circleOpacity: 0.85,
            }}
          />

          {/* Cluster count labels */}
          <SymbolLayer
            id={LAYER_ID_CLUSTER_COUNT}
            filter={["has", "point_count"]}
            style={{
              textField: ["get", "point_count_abbreviated"],
              textColor: "white",
              textSize: 12,
              textFont: ["Open Sans Bold", "Arial Unicode MS Bold"],
              textAllowOverlap: true,
            }}
          />

          {/* Individual user avatars as symbols */}
          <SymbolLayer
            id={LAYER_ID_POINTS}
            filter={["!", ["has", "point_count"]]}
            style={{
              iconImage: ["concat", IMAGE_GL_PREFIX, ["get", "id"]],
              iconSize: [
                "interpolate",
                ["linear"],
                ["get", "opacity"],
                0,
                0.5,
                1,
                1,
              ],
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
              iconOpacity: ["get", "opacity"],
            }}
          />
        </ShapeSource>
      </MapView>

      {overlay}
    </View>
  );
};

const IMAGE_GL_PREFIX = `${IMAGE_LAYER_ID}-`;

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
});


