import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface LocationPermissionDeniedProps {
  /** Whether to show a compact version or full message */
  compact?: boolean;
}

export function LocationPermissionDenied({ compact = false }: LocationPermissionDeniedProps) {
  const { palette } = useTripTheme();
  const { styles, compactStyles } = useThemedStyles(makeStyles);

  if (compact) {
    return (
      <View testID="location-permission-denied-compact" style={compactStyles.container}>
        <Ionicons name="locate" size={16} color={palette.white} />
        <Text style={compactStyles.text}>Location sharing disabled</Text>
      </View>
    );
  }

  return (
    <View testID="location-permission-denied" style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="locate" size={48} color={palette.textMuted} />
      </View>
      <Text style={styles.title}>Location Sharing Disabled</Text>
      <Text style={styles.message}>
        Location sharing has been turned off. You can still view the map, but other users' locations
        won't be shown.
      </Text>
      <Text style={styles.instruction}>
        To enable location sharing, go to your Profile settings and toggle "Enable Location
        Sharing".
      </Text>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return {
    styles: StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
      },
      iconContainer: {
        marginBottom: spacing.lg,
      },
      title: {
        fontSize: typography.xl,
        fontWeight: typography.bold,
        color: palette.white,
        textAlign: "center",
        marginBottom: spacing.md,
      },
      message: {
        fontSize: typography.base,
        color: palette.textMuted,
        textAlign: "center",
        marginBottom: spacing.lg,
        lineHeight: 22,
      },
      instruction: {
        fontSize: typography.sm,
        color: palette.textMuted,
        textAlign: "center",
        lineHeight: 20,
      },
    }),
    compactStyles: StyleSheet.create({
      container: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.primaryOpacity30,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      },
      text: {
        fontSize: typography.sm,
        color: palette.white,
        marginLeft: spacing.sm,
        fontWeight: typography.medium,
      },
    }),
  };
}
