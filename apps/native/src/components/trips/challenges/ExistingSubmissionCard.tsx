import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface ExistingSubmission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string | Date;
  imageIds: string[];
  rejectionReason?: string | null;
}

interface ExistingSubmissionCardProps {
  submission: ExistingSubmission;
  isWithdrawing: boolean;
  localPreviewUri?: string | null;
  onWithdraw: (submissionId: string) => Promise<void>;
}

const getStatusColor = (status: ExistingSubmission["status"]) => {
  if (status === "APPROVED") return "#22c55e";
  if (status === "REJECTED") return "#ef4444";
  return "#f59e0b";
};

const getStatusLabel = (status: ExistingSubmission["status"]) => {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return "Pending Review";
};

const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

export function ExistingSubmissionCard({
  submission,
  isWithdrawing,
  localPreviewUri,
  onWithdraw,
}: ExistingSubmissionCardProps) {
  const hasImage = submission.imageIds.length > 0;
  const canWithdraw = submission.status !== "APPROVED";
  const { download, status: imageStatus, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!hasImage) {
      reset();
      return;
    }

    reset();
    void download({
      storagePath: submission.imageIds[0] ?? "",
    }).catch(() => {
      // Object might not be available yet right after submission creation.
      // Keep the card visible and show the fallback state instead of throwing.
    });

    return () => {
      abort();
    };
  }, [abort, download, hasImage, reset, submission.imageIds]);

  const handleWithdrawPress = () => {
    Alert.alert("Withdraw submission", "Are you sure you want to withdraw this submission?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw",
        style: "destructive",
        onPress: () => {
          void onWithdraw(submission.id);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Submission sent</Text>
        <View style={[styles.statusPill, { borderColor: getStatusColor(submission.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(submission.status) }]}>
            {getStatusLabel(submission.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.meta}>Submitted: {formatDateTime(submission.createdAt)}</Text>

      {hasImage && (
        <View style={styles.imageWrapper}>
          {imageStatus === "loading" ? (
            <View style={styles.imageLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : file?.uri ? (
            <Image
              source={{ uri: file.uri }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Submission preview"
            />
          ) : localPreviewUri ? (
            <Image
              source={{ uri: localPreviewUri }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Submission preview"
            />
          ) : (
            <View style={styles.imageLoading}>
              <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.imageFallback}>Image unavailable</Text>
            </View>
          )}
        </View>
      )}

      {!hasImage && (
        <View style={styles.noImageRow}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.noImageText}>Submission has no image asset.</Text>
        </View>
      )}

      {submission.status === "REJECTED" && submission.rejectionReason && (
        <Text style={styles.rejectionText}>Rejection reason: {submission.rejectionReason}</Text>
      )}

      {canWithdraw ? (
        <TouchableOpacity
          onPress={handleWithdrawPress}
          disabled={isWithdrawing}
          style={[styles.withdrawButton, isWithdrawing && styles.withdrawButtonDisabled]}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={styles.withdrawButtonText}>
            {isWithdrawing ? "Withdrawing..." : "Withdraw submission"}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.lockedText}>Approved submissions cannot be withdrawn.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  meta: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceDark,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  imageFallback: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  noImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  noImageText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  rejectionText: {
    color: "#fca5a5",
    fontSize: typography.sm,
  },
  withdrawButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  withdrawButtonDisabled: {
    opacity: 0.6,
  },
  withdrawButtonText: {
    color: "#ef4444",
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  lockedText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.xs,
  },
});
