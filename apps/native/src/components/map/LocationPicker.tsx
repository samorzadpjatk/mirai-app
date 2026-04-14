import React, { useState, useRef, useEffect } from "react";
import { Modal, TouchableOpacity, Alert } from "react-native";
import {
  MapView,
  Camera,
  MarkerView,
  RasterSource,
  RasterLayer,
} from "@maplibre/maplibre-react-native";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Spinner } from "@mirai-app/ui";
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
      clientLogger.error("Error getting location: " + String(error));
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
      <YStack flex={1} backgroundColor="$backgroundDark">
        {/* Header */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$lg"
          paddingBottom="$md"
          backgroundColor="$cardDark"
          borderBottomWidth={1}
          borderBottomColor="$borderDark"
          paddingTop={Math.max(insets.top + 12, 24)}
        >
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text color="$primary" fontSize="$base" fontWeight={600}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text color="$white" fontSize="$lg" fontWeight={700}>
            Select Location
          </Text>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!selectedLocation}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <YStack
              backgroundColor={selectedLocation ? "$primary" : "$borderDark"}
              opacity={selectedLocation ? 1 : 0.5}
              borderRadius="$md"
              paddingVertical="$sm"
              paddingHorizontal="$md"
            >
              <Text
                color={selectedLocation ? "$white" : "$textTertiary"}
                fontSize="$base"
                fontWeight={600}
              >
                Confirm
              </Text>
            </YStack>
          </TouchableOpacity>
        </XStack>

        {/* Map */}
        <YStack flex={1} position="relative">
          <MapView
            style={{ flex: 1 }}
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
              <YStack
                opacity={selectedLocation ? 1 : 0}
                alignItems="center"
                justifyContent="center"
              >
                <YStack
                  width={40}
                  height={40}
                  borderRadius={20}
                  backgroundColor="$primary"
                  borderWidth={3}
                  borderColor="$white"
                  alignItems="center"
                  justifyContent="center"
                  shadowColor="#000"
                  shadowOpacity={0.3}
                  shadowRadius={4}
                  shadowOffset={{ width: 0, height: 2 }}
                >
                  <YStack
                    width={12}
                    height={12}
                    borderRadius={6}
                    backgroundColor="$white"
                  />
                </YStack>
              </YStack>
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
            <YStack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              justifyContent="center"
              alignItems="center"
              backgroundColor="$backgroundDark"
            >
              <Spinner size="large" color="$primary" />
              <Text color="$textSecondary" fontSize="$base" marginTop="$sm">
                Loading map...
              </Text>
            </YStack>
          )}

          {/* Map controls */}
          <YStack position="absolute" bottom="$xl" right="$lg">
            <TouchableOpacity
              onPress={handleCurrentLocation}
              disabled={isLoadingLocation}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <YStack
                backgroundColor="$cardDark"
                borderRadius="$lg"
                width={48}
                height={48}
                justifyContent="center"
                alignItems="center"
                borderWidth={1}
                borderColor="$borderDark"
                shadowColor="#000"
                shadowOpacity={0.3}
                shadowRadius={4}
                shadowOffset={{ width: 0, height: 2 }}
              >
                {isLoadingLocation ? (
                  <Spinner size="small" color="$white" />
                ) : (
                  <Ionicons name="location-sharp" size={20} color="#ffffff" />
                )}
              </YStack>
            </TouchableOpacity>
          </YStack>
        </YStack>

        {/* Footer */}
        <XStack
          backgroundColor="$cardDark"
          borderTopWidth={1}
          borderTopColor="$borderDark"
          paddingHorizontal="$lg"
          paddingVertical="$md"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text color="$textSecondary" fontSize="$sm" flex={1}>
            {selectedLocation
              ? `Selected: ${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
              : "Tap on the map to select a location"}
          </Text>
          {selectedLocation && (
            <TouchableOpacity
              onPress={() => {
                setSelectedLocation(null);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <YStack
                paddingVertical="$sm"
                paddingHorizontal="$md"
                borderRadius="$md"
                borderWidth={1}
                borderColor="$borderDark"
              >
                <Text color="$textSecondary" fontSize="$sm" fontWeight={600}>
                  Clear
                </Text>
              </YStack>
            </TouchableOpacity>
          )}
        </XStack>
      </YStack>
    </Modal>
  );
};
