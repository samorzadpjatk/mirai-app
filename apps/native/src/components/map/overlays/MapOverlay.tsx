import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface MapOverlayProps {
  activeCount: number;
  fadedCount: number;
  onRecenter?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Slopes-inspired overlay: subtle gradient top bar with counts and recenter action.
 */
export function MapOverlay({
  activeCount,
  fadedCount,
  onRecenter,
  title = "Live map",
  subtitle = "Tap avatar to inspect user",
}: MapOverlayProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["rgba(15,23,42,0.55)", "rgba(15,23,42,0)"]}
        locations={[0, 1]}
        style={styles.topGradient}
      >
        <View style={styles.row}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.pills}>
            <View style={[styles.pill, styles.pillPrimary]}>
              <Text style={styles.pillLabel}>Active</Text>
              <Text style={styles.pillValue}>{activeCount}</Text>
            </View>
            <View style={[styles.pill, styles.pillMuted]}>
              <Text style={styles.pillLabel}>Faded</Text>
              <Text style={styles.pillValue}>{fadedCount}</Text>
            </View>
            {onRecenter ? (
              <TouchableOpacity onPress={onRecenter} style={[styles.pill, styles.pillOutline]}>
                <Text style={styles.pillLabel}>Center</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// Note: pillPrimary/pillMuted encode Active/Faded presence state (not brand accent)
// and are intentionally left on their fixed status colors, not the per-trip palette.
function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    topGradient: {
      paddingTop: 56,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: palette.white,
      fontSize: 18,
      fontWeight: "700",
    },
    subtitle: {
      color: "rgba(255,255,255,0.75)",
      marginTop: 4,
    },
    pills: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    pillPrimary: {
      backgroundColor: "rgba(59,130,246,0.18)",
      borderWidth: 1,
      borderColor: "rgba(59,130,246,0.6)",
    },
    pillMuted: {
      backgroundColor: "rgba(148,163,184,0.16)",
      borderWidth: 1,
      borderColor: "rgba(148,163,184,0.4)",
    },
    pillOutline: {
      backgroundColor: "rgba(15,23,42,0.2)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    pillLabel: {
      color: palette.white,
      fontSize: 12,
    },
    pillValue: {
      color: palette.white,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 2,
    },
  });
}
