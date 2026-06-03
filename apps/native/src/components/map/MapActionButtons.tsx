import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { useLocationContext } from "~/stores/location";
import { useMapOverlayStore } from "~/stores/map";
import { colors, spacing, typography } from "~/styles";
import {
  calculateBackgroundDisplayState,
  buildBackgroundStatusLabel,
  calculateBackgroundControlDisabled,
  getBackgroundIconName,
  getLocationIconName,
  getThemeIconName,
  getBackgroundIconColor,
} from "./mapActionButtonsUtils";

export function MapActionButtons() {
  const {
    isLocationSharingEnabled,
    isLoading,
    isUpdatingSharing,
    toggleLocationSharing,
    isBackgroundLocationEnabled,
    isUpdatingBackgroundLocation,
    toggleBackgroundLocationUpdates,
  } = useLocationContext();
  const { mapTheme, handleRecenter, toggleTheme } = useMapOverlayStore();

  const isBackgroundDisplayedOn = calculateBackgroundDisplayState(
    isLocationSharingEnabled,
    isBackgroundLocationEnabled,
  );
  const backgroundStatusLabel = buildBackgroundStatusLabel(isBackgroundDisplayedOn);
  const isBackgroundControlDisabled = calculateBackgroundControlDisabled(
    isLocationSharingEnabled,
    isLoading,
    isUpdatingBackgroundLocation,
  );

  return (
    <>
      <View style={styles.leftButtonsGroup}>
        <TouchableOpacity
          testID="background-toggle-button"
          style={[
            styles.backgroundToggle,
            isBackgroundDisplayedOn && styles.backgroundToggleActive,
            isBackgroundControlDisabled && styles.backgroundToggleDisabled,
          ]}
          onPress={() => {
            void toggleBackgroundLocationUpdates();
          }}
          disabled={isBackgroundControlDisabled}
        >
          {isUpdatingBackgroundLocation ? (
            <ActivityIndicator
              testID="background-loading-indicator"
              size="small"
              color={colors.primary}
            />
          ) : (
            <>
              <Text
                style={[
                  styles.backgroundToggleLabel,
                  isBackgroundControlDisabled && styles.backgroundTextDisabled,
                ]}
              >
                Background
              </Text>
              <Text
                style={[
                  styles.backgroundToggleStatus,
                  isBackgroundControlDisabled && styles.backgroundTextDisabled,
                ]}
              >
                {backgroundStatusLabel}
              </Text>
              <Ionicons
                name={getBackgroundIconName(isBackgroundDisplayedOn)}
                size={18}
                color={getBackgroundIconColor(isBackgroundControlDisabled, isBackgroundDisplayedOn)}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.rightButtonsGroup}>
        <TouchableOpacity
          testID="location-toggle-button"
          style={[styles.locationToggle, isLocationSharingEnabled && styles.locationToggleActive]}
          onPress={() => {
            void toggleLocationSharing();
          }}
          disabled={isLoading || isUpdatingSharing}
        >
          {isUpdatingSharing ? (
            <ActivityIndicator
              testID="location-loading-indicator"
              size="small"
              color={colors.primary}
            />
          ) : (
            <>
              <Text style={styles.locationToggleText}>
                {isLocationSharingEnabled ? "On" : "Off"}
              </Text>
              <Ionicons
                name={getLocationIconName(isLocationSharingEnabled)}
                size={20}
                color={isLocationSharingEnabled ? colors.primary : colors.white}
              />
            </>
          )}
        </TouchableOpacity>
        <Pressable
          testID="theme-toggle-button"
          style={styles.themeToggleButton}
          onPress={toggleTheme}
        >
          <Ionicons name={getThemeIconName(mapTheme)} size={22} color="#00ced1" />
        </Pressable>
        {isLocationSharingEnabled && (
          <Pressable
            testID="recenter-button"
            style={styles.recenterButton}
            onPress={handleRecenter}
          >
            <Ionicons name="locate" size={20} color="#00ced1" />
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  leftButtonsGroup: {
    position: "absolute",
    left: 16,
    top: 16,
    width: 170,
    gap: 10,
  },
  rightButtonsGroup: {
    position: "absolute",
    right: 16,
    top: 16,
    gap: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  themeToggleButton: {
    backgroundColor: "rgba(23, 24, 28, 0.9)",
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.35)",
  },
  recenterButton: {
    backgroundColor: "rgba(23, 24, 28, 0.9)",
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.35)",
  },
  locationToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  locationToggleActive: {
    borderColor: "rgba(0, 206, 209, 0.3)",
  },
  locationToggleText: {
    fontSize: typography.sm,
    color: colors.white,
    marginRight: spacing.xs,
    fontWeight: typography.medium,
  },
  backgroundToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  backgroundToggleActive: {
    borderColor: "rgba(0, 206, 209, 0.35)",
  },
  backgroundToggleDisabled: {
    opacity: 0.55,
  },
  backgroundToggleLabel: {
    fontSize: typography.sm,
    color: colors.white,
    fontWeight: typography.medium,
  },
  backgroundToggleStatus: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginLeft: "auto",
    marginRight: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  backgroundTextDisabled: {
    color: colors.textMuted,
  },
});
