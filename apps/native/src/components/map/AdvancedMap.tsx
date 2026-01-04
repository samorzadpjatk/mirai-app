import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View, Text, Pressable } from "react-native";
import MapboxGL from "@rnmapbox/maps";

export type UserLocation = {
  id: string;
  latitude: number;
  longitude: number;
  avatarUrl: string;
  /** ISO string, millis or Date */
  lastActive: string | number | Date;
};

export type AdvancedMapProps = {
  users: UserLocation[];
  onUserPress?: (user: UserLocation) => void;
};

type MapPressEvent = {
  features?: Array<{
    properties?: {
      id?: string;
      [key: string]: unknown;
    };
  }>;
};

const MAP_STYLE_OUTDOORS = MapboxGL.StyleURL.Outdoors;
const SOURCE_ID = "advanced-users-source";
const LAYER_ID_POINTS = "advanced-users-points";
const LAYER_ID_CLUSTERS = "advanced-users-clusters";
const LAYER_ID_CLUSTER_COUNT = "advanced-users-clusters-count";

const IMAGE_PREFIX = "advanced-user-avatar-";

function toTimestamp(value: string | number | Date): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : 0;
}

/**
 * 0 min -> freshness 1.0
 * 30+ min -> freshness 0.0 (niewidoczny)
 */
export function getFreshness(lastActive: string | number | Date, now = Date.now()): number {
  const ts = toTimestamp(lastActive);
  if (!ts) return 0;
  const diffMinutes = Math.max(0, (now - ts) / 60000);
  if (diffMinutes >= 30) return 0;
  const ratio = 1 - diffMinutes / 30;
  return Math.max(0, Math.min(1, ratio));
}

type SimpleUserFeature = {
  type: "Feature";
  id: string;
  properties: {
    id: string;
    avatarUrl: string;
    freshness: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

type SimpleFeatureCollection = {
  type: "FeatureCollection";
  features: SimpleUserFeature[];
};

export const AdvancedMap: React.FC<AdvancedMapProps> = ({ users, onUserPress }) => {
  const cameraRef = useRef<MapboxGL.Camera | null>(null);
  const [initialCentered, setInitialCentered] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible

  const featureCollection: SimpleFeatureCollection = useMemo(() => {
    const now = Date.now();
    const features = users
      .map((u) => {
        const freshness = getFreshness(u.lastActive, now);
        const feature: SimpleUserFeature = {
          type: "Feature",
          id: u.id,
          properties: {
            id: u.id,
            avatarUrl: u.avatarUrl,
            freshness,
          },
          geometry: {
            type: "Point",
            coordinates: [u.longitude, u.latitude],
          },
        };
        return feature;
      })
      // odfiltruj całkowicie przeterminowanych
      .filter((f) => f.properties.freshness > 0);

    return {
      type: "FeatureCollection",
      features,
    };
  }, [users]);

  const images = useMemo(
    () =>
      featureCollection.features.reduce(
        (acc: Record<string, { uri: string }>, feature: SimpleUserFeature) => {
          const key = `${IMAGE_PREFIX}${feature.id}`;
          acc[key] = { uri: feature.properties.avatarUrl };
          return acc;
        },
        {} as Record<string, { uri: string }>,
      ),
    [featureCollection],
  );

  useEffect(() => {
    Animated.timing(bottomSheetAnim, {
      toValue: selectedUser ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [selectedUser, bottomSheetAnim]);

  const handleUserPress = (event: MapPressEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;

    const userId = feature.properties?.id as string | undefined;
    if (!userId) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setSelectedUser(user);
    if (onUserPress) onUserPress(user);
  };

  const handleUserLocationUpdate = (loc: {
    coords?: { longitude?: number | null; latitude?: number | null };
  }) => {
    if (initialCentered || !loc.coords) return;

    const { longitude, latitude } = loc.coords;
    if (longitude == null || latitude == null) return;

    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 14,
      pitch: 45,
      animationDuration: 2000,
    });
    setInitialCentered(true);
  };

  const bottomSheetTranslateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [180, 0],
  });

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE_OUTDOORS}
        logoEnabled={false}
        compassEnabled
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera ref={cameraRef} />

        <MapboxGL.UserLocation
          visible
          showsUserHeadingIndicator
          androidRenderMode="compass"
          onUpdate={handleUserLocationUpdate}
        />

        {/* Obrazy awatarów ładowane do warstwy GL */}
        <MapboxGL.Images images={images} />

        <MapboxGL.ShapeSource
          id={SOURCE_ID}
          shape={featureCollection}
          cluster
          clusterRadius={40}
          clusterMaxZoom={14}
          onPress={handleUserPress}
        >
          {/* Klastry – minimalistyczne niebieskie bąbelki */}
          <MapboxGL.CircleLayer
            id={LAYER_ID_CLUSTERS}
            filter={["has", "point_count"]}
            style={{
              circleColor: "#2563EB",
              circleRadius: ["step", ["get", "point_count"], 18, 10, 22, 30, 28],
              circleOpacity: 0.9,
            }}
          />

          <MapboxGL.SymbolLayer
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

          {/* Pojedyncze awatary użytkowników */}
          <MapboxGL.SymbolLayer
            id={LAYER_ID_POINTS}
            filter={["!", ["has", "point_count"]]}
            style={{
              // dynamiczny wybór obrazka awatara
              iconImage: ["concat", IMAGE_PREFIX, ["get", "id"]],
              iconSize: 0.9,
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
              // biała obwódka + delikatny cień
              iconHaloColor: "white",
              iconHaloWidth: 3,
              iconHaloBlur: 1.5,
              // opacity w zależności od "freshness"
              iconOpacity: ["interpolate", ["linear"], ["get", "freshness"], 0, 0, 1, 1],
              // przygaszenie/offline – lekkie zszarzenie
              iconColor: [
                "interpolate",
                ["linear"],
                ["get", "freshness"],
                0,
                "#9CA3AF",
                1,
                "#FFFFFF",
              ],
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>

      {/* Minimalistyczny bottom sheet z detalami użytkownika */}
      <Animated.View
        pointerEvents={selectedUser ? "auto" : "none"}
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: bottomSheetTranslateY }],
          },
        ]}
      >
        {selectedUser && (
          <>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetContent}>
              <Text style={styles.userName}>{selectedUser.id}</Text>
              <Text style={styles.userMeta}>
                Ostatnia aktywność:{" "}
                {new Date(toTimestamp(selectedUser.lastActive)).toLocaleTimeString()}
              </Text>
              <Pressable style={styles.closeButton} onPress={() => setSelectedUser(null)}>
                <Text style={styles.closeButtonText}>Zamknij</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const systemFont = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 24 + 16,
  },
  bottomSheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.6)",
    marginBottom: 8,
  },
  bottomSheetContent: {
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userName: {
    fontFamily: systemFont,
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 4,
  },
  userMeta: {
    fontFamily: systemFont,
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  closeButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  closeButtonText: {
    fontFamily: systemFont,
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
});


