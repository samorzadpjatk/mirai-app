import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WoodTexture } from "~/components/common/WoodTexture";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface ChallengeUploadProgressCardProps {
  progress?: number | null;
}

export function ChallengeUploadProgressCard({ progress }: ChallengeUploadProgressCardProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const resolvedProgress = typeof progress === "number" ? Math.min(Math.max(progress, 0), 1) : null;
  const percentLabel =
    resolvedProgress === null ? "Preparing upload..." : `${Math.round(resolvedProgress * 100)}%`;

  return (
    <View testID="upload-progress-card" style={styles.container}>
      <WoodTexture radius={borderRadius.xl} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Uploading submission</Text>
        <ActivityIndicator
          testID="upload-progress-indicator"
          size="small"
          color={palette.primary}
        />
      </View>
      <Text style={styles.progressText}>{percentLabel}</Text>
      <View testID="progress-track" style={styles.progressTrack}>
        <View
          testID="progress-fill"
          style={[styles.progressFill, { flex: resolvedProgress ?? 0, minWidth: 0 }]}
        />
      </View>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: palette.primaryOpacity30,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    title: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: palette.primary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    progressText: {
      fontSize: typography.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.borderWhite10,
      borderRadius: borderRadius.md,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: palette.primary,
      borderRadius: borderRadius.md,
    },
  });
