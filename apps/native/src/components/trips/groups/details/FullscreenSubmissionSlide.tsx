import React, { useEffect } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
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
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!submission.imageStoragePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageStoragePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, reset, submission.imageStoragePath]);

  return (
    <View testID="fullscreen-slide" style={[styles.fullscreenSlide, { width, minHeight: height - (topInset + 92) }]}>
      <View style={styles.fullscreenImageWrap}>
        {status === "loading" ? (
          <View testID="loading-indicator" style={styles.fullscreenFallback}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : file?.uri ? (
          <Image testID="fullscreen-image" source={{ uri: file.uri }} style={styles.fullscreenImage} contentFit="contain" />
        ) : (
          <View testID="image-fallback" style={styles.fullscreenFallback}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
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

const styles = {
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
};
