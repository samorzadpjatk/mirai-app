import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
import { borderRadius, colors, spacing, typography } from "~/styles";

type ReviewStatus = "APPROVED" | "REJECTED";
type SubmissionStatus = ReviewStatus | "PENDING";

interface SubmissionItem {
  id: string;
  status: SubmissionStatus;
  ranking?: number | null;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  createdAt: string | Date;
  reviewedAt: string | Date | null;
  rejectionReason: string | null;
  reviewedBy?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  group: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface SubmissionReviewCardProps {
  submission: SubmissionItem;
  isReviewing: boolean;
  onApprove: (submission: SubmissionItem) => void;
  onReject: (submission: SubmissionItem) => void;
}

export function getStatusMeta(status: SubmissionStatus) {
  if (status === "APPROVED") {
    return { color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
  }
  if (status === "REJECTED") {
    return { color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
  }
  return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function formatPersonName(
  person:
    | {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
): string {
  if (!person) return "Unknown admin";
  const fullName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  if (fullName.length > 0) return fullName;
  return person.email ?? "Unknown admin";
}

export function SubmissionReviewCard({
  submission,
  isReviewing,
  onApprove,
  onReject,
}: SubmissionReviewCardProps) {
  const hasImage = submission.imageIds.length > 0;
  const textContent = submission.textContent?.trim() ?? "";
  const hasText = textContent.length > 0;
  const statusMeta = getStatusMeta(submission.status);
  const reviewerName = formatPersonName(submission.reviewedBy);
  const { download, status: imageStatus, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!hasImage) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageIds[0] ?? "" }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, hasImage, reset, submission.imageIds]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{submission.group.name}</Text>
          <Text style={styles.metaText}>Submitted: {formatDateTime(submission.createdAt)}</Text>
          {submission.reviewedAt ? (
            <Text style={styles.metaText}>
              Reviewed: {formatDateTime(submission.reviewedAt)} • {reviewerName}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusPill,
            { borderColor: statusMeta.color, backgroundColor: statusMeta.bg },
          ]}
        >
          <Text style={[styles.statusText, { color: statusMeta.color }]}>{submission.status}</Text>
          {typeof submission.ranking === "number" ? (
            <Text style={[styles.statusText, { color: colors.primary }]}>
              #{submission.ranking}
            </Text>
          ) : null}
        </View>
      </View>

      {hasImage ? (
        <View style={styles.mediaWrap}>
          {imageStatus === "loading" ? (
            <View style={styles.mediaFallback}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : file?.uri ? (
            <Image source={{ uri: file.uri }} style={styles.mediaImage} />
          ) : (
            <View style={styles.mediaFallback}>
              <Ionicons name="image-outline" size={20} color={colors.textMuted} />
              <Text style={styles.mediaFallbackText}>Image unavailable</Text>
            </View>
          )}
        </View>
      ) : null}

      {!hasImage && submission.videoId ? (
        <View style={styles.assetFallbackBox}>
          <Ionicons name="videocam-outline" size={24} color={colors.textMuted} />
          <Text style={styles.mediaFallbackText}>Video submission</Text>
        </View>
      ) : null}

      {hasText ? (
        <View style={styles.textBox}>
          <Text style={styles.textBoxLabel}>Submitted text</Text>
          <Text selectable style={styles.textBoxValue}>
            {textContent}
          </Text>
          <Text style={styles.textBoxHint}>Press and hold text to copy</Text>
        </View>
      ) : null}

      {!hasImage && !submission.videoId && !hasText ? (
        <View style={styles.assetFallbackBox}>
          <Ionicons name="document-text-outline" size={22} color={colors.textMuted} />
          <Text style={styles.mediaFallbackText}>No content asset</Text>
        </View>
      ) : null}

      {submission.status === "REJECTED" && submission.rejectionReason ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{submission.rejectionReason}</Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        {submission.status !== "APPROVED" ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => onApprove(submission)}
            disabled={isReviewing}
          >
            <Ionicons name="checkmark" size={16} color={colors.backgroundDark} />
            <Text style={styles.approveButtonText}>Set approved</Text>
          </TouchableOpacity>
        ) : null}

        {submission.status !== "REJECTED" ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onReject(submission)}
            disabled={isReviewing}
          >
            <Ionicons name="close" size={16} color={colors.white} />
            <Text style={styles.rejectButtonText}>Set rejected</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  groupName: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
    marginTop: 2,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    letterSpacing: 0.6,
  },
  mediaWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  mediaFallbackText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  assetFallbackBox: {
    width: "100%",
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  textBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    backgroundColor: "rgba(15,23,42,0.45)",
    padding: spacing.md,
    gap: spacing.xs,
  },
  textBoxLabel: {
    color: "#cbd5e1",
    fontSize: typography.xs,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  textBoxValue: {
    color: colors.white,
    fontSize: typography.sm,
    lineHeight: 20,
  },
  textBoxHint: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  reasonBox: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 2,
  },
  reasonLabel: {
    color: "#fca5a5",
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  reasonText: {
    color: "#fecaca",
    fontSize: typography.sm,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  approveButton: {
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.45)",
    backgroundColor: "rgba(34,197,94,0.9)",
  },
  approveButtonText: {
    color: colors.backgroundDark,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.45)",
    backgroundColor: "rgba(239,68,68,0.85)",
  },
  rejectButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
});

export type { SubmissionItem, SubmissionStatus };
