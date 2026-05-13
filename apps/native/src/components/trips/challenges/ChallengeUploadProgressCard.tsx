import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ChallengeUploadProgressCardProps {
  progress?: number | null;
}

export function ChallengeUploadProgressCard({ progress }: ChallengeUploadProgressCardProps) {
  const resolvedProgress = typeof progress === "number" ? Math.min(Math.max(progress, 0), 1) : null;
  const percentLabel =
    resolvedProgress === null ? "Preparing upload..." : `${Math.round(resolvedProgress * 100)}%`;

  return (
    <View testID="upload-progress-card" style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Uploading submission</Text>
        <ActivityIndicator testID="upload-progress-indicator" size="small" color={colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
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
    color: colors.primary,
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
});
