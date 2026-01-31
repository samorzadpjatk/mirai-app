import { Pressable, StyleSheet, Text, View } from "react-native";

interface MapActionButtonsProps {
  mapTheme: "dark" | "light";
  onToggleTheme: () => void;
  onRecenter: () => void;
}

export function MapActionButtons({
  mapTheme,
  onToggleTheme,
  onRecenter,
}: MapActionButtonsProps) {
  return (
    <View style={styles.rightButtonsGroup}>
      <Pressable style={styles.themeToggleButton} onPress={onToggleTheme}>
        <Text style={styles.themeToggleText}>
          {mapTheme === "dark" ? "☀" : "☾"}
        </Text>
      </Pressable>
      <Pressable style={styles.recenterButton} onPress={onRecenter}>
        <Text style={styles.recenterText}>⊙</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rightButtonsGroup: {
    position: "absolute",
    right: 16,
    top: 64,
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
  themeToggleText: {
    color: "#00ced1",
    fontWeight: "600",
    fontSize: 22,
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
  recenterText: {
    color: "#00ced1",
    fontWeight: "600",
    fontSize: 20,
  },
});
