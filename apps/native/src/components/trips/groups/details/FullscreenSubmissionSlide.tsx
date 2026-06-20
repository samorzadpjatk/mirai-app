import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { colors, spacing, typography } from "~/styles";
import type { ApprovedSubmissionItem } from "./GroupApprovedChallenges";

interface Props {
  submission: ApprovedSubmissionItem;
  width: number;
  height: number;
  topInset: number;
}

export function formatDateTime(approvedAt: string | Date): string {
  const date = typeof approvedAt === "string" ? new Date(approvedAt) : approvedAt;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FullscreenSubmissionSlide({ submission, width, height, topInset }: Props) {
  return (
    <View
      testID="fullscreen-slide"
      style={[styles.fullscreenSlide, { width, minHeight: height - (topInset + 92) }]}
    >
      <View style={styles.fullscreenImageWrap}>
        {submission.imageStoragePath ? (
          <CachedImage
            testID="fullscreen-image"
            storagePath={submission.imageStoragePath}
            style={styles.fullscreenImage}
            contentFit="contain"
            fallback={
              <View testID="image-fallback" style={styles.fullscreenFallback}>
                <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
              </View>
            }
          />
        ) : (
          <View testID="image-fallback" style={styles.fullscreenFallback}>
            <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.fullscreenMeta}>
        <Text style={styles.fullscreenChallengeTitle} numberOfLines={1}>
          {submission.challengeTitle}
        </Text>
        <Text style={styles.fullscreenDate}>{formatDateTime(submission.approvedAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenSlide: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: "center",
  },
  fullscreenImageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    backgroundColor: colors.surfaceDark,
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  fullscreenFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenMeta: {
    marginTop: spacing.sm,
    gap: 2,
  },
  fullscreenChallengeTitle: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  fullscreenDate: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
});
