import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useMapOverlayContext } from "~/contexts/map/MapOverlayContext";

export function MapActionButtons() {
  const { mapTheme, onToggleTheme, onRecenter } = useMapOverlayContext();

  return (
    <View style={styles.rightButtonsGroup}>
      <Pressable style={styles.themeToggleButton} onPress={onToggleTheme}>
        <Ionicons
          name={mapTheme === "dark" ? "sunny" : "moon"}
          size={22}
          color="#00ced1"
        />
      </Pressable>
      <Pressable style={styles.recenterButton} onPress={onRecenter}>
        <Ionicons name="locate" size={20} color="#00ced1" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rightButtonsGroup: {
    position: "absolute",
    right: 16,
    top: 16,
    gap: 12,
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
});
