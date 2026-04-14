import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  MapView,
  Camera,
  MarkerView,
  RasterSource,
  RasterLayer,
} from "@maplibre/maplibre-react-native";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { clientLogger } from "@mirai-app/shared";

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

interface Props {
  visible: boolean;
  initialLocation?: LocationCoordinate | null;
  onLocationSelected: (location: LocationCoordinate) => void;
  onClose: () => void;
  /** Current map theme: 'dark' | 'light' */
  mapTheme?: "dark" | "light";
}

// Map style configuration (same as UserMap)
interface MapStyleConfig {
  style: string | object;
  rasterOverlays?: MapRasterOverlay[];
}

interface MapRasterOverlay {
  id: string;
  tileUrlTemplates: string[];
  tileSize?: number;
  attribution?: string;
  layerId?: string;
  layerStyle?: object;
}

const MAP_STYLES: Record<"dark" | "light", MapStyleConfig> = {
  dark: {
    style: "https://tiles.openfreemap.org/styles/fiord",
    rasterOverlays: [
      {
        id: "opensnowmap-pistes",
        tileUrlTemplates: [
          "https://tiles.opensnowmap.org/tiles-pistes-high-dpi/{z}/{x}/{y}.png",
        ],
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
        tileUrlTemplates: [
          "https://tiles.opensnowmap.org/tiles-pistes-high-dpi/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "© OpenSnowMap.org",
        layerId: "opensnowmap-overlay",
        layerStyle: { rasterOpacity: 0.9 },
      },
    ],
  },
};

export const LocationPicker: React.FC<Props> = ({
  visible,
  initialLocation,
  onLocationSelected,
  onClose,
  mapTheme = "dark",
}) => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationCoordinate | null>(null);
  // markerCoordinate always holds a valid coordinate so the MarkerView is never unmounted.
  // This avoids the MLRNMapView insertReactSubview crash.
  const defaultCoord: LocationCoordinate = initialLocation ?? {
    latitude: 52.23,
    longitude: 21.01,
  };
  const [markerCoordinate, setMarkerCoordinate] =
    useState<LocationCoordinate>(defaultCoord);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Set initial location when modal opens
  useEffect(() => {
    if (visible) {
      // Use setTimeout to avoid synchronous setState warning
      setTimeout(() => {
        setSelectedLocation(initialLocation ?? null);
        if (initialLocation) {
          setMarkerCoordinate(initialLocation);
        }
        setIsMapReady(false);
      }, 0);
    }
  }, [visible, initialLocation]);

  // Center camera on initial location when map is ready
  useEffect(() => {
    if (isMapReady && initialLocation && cameraRef.current) {
      cameraRef.current?.setCamera?.({
        centerCoordinate: [initialLocation.longitude, initialLocation.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  }, [isMapReady, initialLocation]);

  const handleMapPress = (feature: GeoJSON.Feature) => {
    if (feature.geometry.type !== "Point") return;
    const [longitude, latitude] = feature.geometry.coordinates as [
      number,
      number,
    ];
    const loc: LocationCoordinate = { latitude, longitude };
    setMarkerCoordinate(loc);
    setSelectedLocation(loc);
  };

  const handleMapLoadComplete = () => {
    setIsMapReady(true);
  };

  const handleMapLoadError = () => {
    clientLogger.error("Map failed to load");
    setIsMapReady(true); // Still set to true to hide loading indicator
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation);
    }
  };

  const handleCurrentLocation = async () => {
    setIsLoadingLocation(true);

    try {
      // Check if location services are enabled
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current location.",
          [{ text: "OK" }],
        );
        setIsLoadingLocation(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLocation: LocationCoordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setMarkerCoordinate(currentLocation);
      setSelectedLocation(currentLocation);

      // Center camera on current location
      if (cameraRef.current) {
        cameraRef.current?.setCamera?.({
          centerCoordinate: [
            currentLocation.longitude,
            currentLocation.latitude,
          ],
          zoomLevel: 15,
          animationDuration: 1000,
        });
      }
    } catch (error) {
      clientLogger.error("Error getting location:", { error });
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const selectedMapConfig = MAP_STYLES[mapTheme];
  const currentMapStyle = selectedMapConfig.style;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top + spacing.sm, spacing.xl) },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.headerButton,
              styles.headerButtonConfirm,
              !selectedLocation && styles.headerButtonDisabled,
            ]}
            disabled={!selectedLocation}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text
              style={[
                styles.headerButtonText,
                styles.headerButtonTextConfirm,
                !selectedLocation && styles.headerButtonTextDisabled,
              ]}
            >
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            mapStyle={currentMapStyle}
            logoEnabled={false}
            compassEnabled
            rotateEnabled
            pitchEnabled
            scrollEnabled
            zoomEnabled
            onPress={handleMapPress}
            onDidFinishLoadingMap={handleMapLoadComplete}
            onDidFailLoadingMap={handleMapLoadError}
          >
            <Camera
              ref={cameraRef}
              defaultSettings={
                initialLocation
                  ? {
                      centerCoordinate: [
                        initialLocation.longitude,
                        initialLocation.latitude,
                      ],
                      zoomLevel: 15,
                    }
                  : undefined
              }
            />

            {/* Selected location marker – always mounted to avoid native crash */}
            <MarkerView
              coordinate={[
                markerCoordinate.longitude,
                markerCoordinate.latitude,
              ]}
            >
              <View style={{ opacity: selectedLocation ? 1 : 0 }}>
                <View style={styles.markerContainer}>
                  <View style={styles.marker}>
                    <View style={styles.markerInner} />
                  </View>
                </View>
              </View>
            </MarkerView>

            {/* Raster overlays (same as UserMap) */}
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
          </MapView>

          {/* Loading indicator */}
          {!isMapReady && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}

          {/* Map controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              onPress={handleCurrentLocation}
              style={styles.mapControlButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={colors.white}
                  style={styles.mapControlButtonIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedLocation
              ? `Selected: ${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
              : "Tap on the map to select a location"}
          </Text>
          {selectedLocation && (
            <TouchableOpacity
              onPress={() => {
                setSelectedLocation(null);
              }}
              style={styles.clearButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  headerButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  headerButtonConfirm: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  headerButtonDisabled: {
    backgroundColor: colors.borderDark,
    opacity: 0.5,
  },
  headerButtonText: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  headerButtonTextConfirm: {
    color: colors.white,
  },
  headerButtonTextDisabled: {
    color: colors.textTertiary,
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundDark,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.base,
    marginTop: spacing.sm,
  },
  mapControls: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.lg,
  },
  mapControlButton: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderDark,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mapControlButtonIcon: {
    fontSize: 20,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  footer: {
    backgroundColor: colors.cardDark,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    flex: 1,
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
