import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useFileDownload } from "~/hooks/files";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { borderRadius, colors, spacing, typography } from "~/styles";

type ReviewStatus = "APPROVED" | "REJECTED";
type SubmissionStatus = ReviewStatus | "PENDING";
type StatusFilter = "ALL" | SubmissionStatus;

interface SubmissionItem {
  id: string;
  status: SubmissionStatus;
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

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const getStatusMeta = (status: SubmissionStatus) => {
  if (status === "APPROVED") {
    return { color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
  }
  if (status === "REJECTED") {
    return { color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
  }
  return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
};

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatPersonName = (person: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null | undefined) => {
  if (!person) return "Unknown admin";
  const fullName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  if (fullName.length > 0) return fullName;
  return person.email ?? "Unknown admin";
};

const SubmissionCard = ({
  submission,
  isReviewing,
  onApprove,
  onReject,
}: {
  submission: SubmissionItem;
  isReviewing: boolean;
  onApprove: (submission: SubmissionItem) => void;
  onReject: (submission: SubmissionItem) => void;
}) => {
  const hasImage = submission.imageIds.length > 0;
  const statusMeta = getStatusMeta(submission.status);
  const reviewerName = formatPersonName(submission.reviewedBy);
  const {
    download,
    status: imageStatus,
    file,
    reset,
    abort,
  } = useFileDownload();

  useEffect(() => {
    if (!hasImage) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageIds[0] ?? "" }).catch(
      () => undefined,
    );

    return () => {
      abort();
    };
  }, [abort, download, hasImage, reset, submission.imageIds]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{submission.group.name}</Text>
          <Text style={styles.metaText}>
            Submitted: {formatDateTime(submission.createdAt)}
          </Text>
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
          <Text style={[styles.statusText, { color: statusMeta.color }]}>
            {submission.status}
          </Text>
        </View>
      </View>

      <View style={styles.mediaWrap}>
        {hasImage ? (
          imageStatus === "loading" ? (
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
          )
        ) : submission.videoId ? (
          <View style={styles.mediaFallback}>
            <Ionicons name="videocam-outline" size={24} color={colors.textMuted} />
            <Text style={styles.mediaFallbackText}>Video submission</Text>
          </View>
        ) : (
          <View style={styles.mediaFallback}>
            <Ionicons
              name="document-text-outline"
              size={22}
              color={colors.textMuted}
            />
            <Text style={styles.mediaFallbackText}>No image asset</Text>
          </View>
        )}
      </View>

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
};

export default function ChallengeSubmissionsScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const insets = useAppSafeAreaInsets();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");
  const challengeId =
    typeof params.challengeId === "string"
      ? params.challengeId
      : (params.challengeId?.[0] ?? "");

  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("ALL");
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionItem | null>(null);

  const challengeQueryOptions = trpc.challenge.getById.queryOptions({
    id: challengeId,
    tripId,
  });
  const challengeQuery = useQuery({
    ...challengeQueryOptions,
    enabled: Boolean(tripId) && Boolean(challengeId),
  });

  const submissionsQueryOptions = trpc.challengeSubmission.getByChallenge.queryOptions(
    {
      tripId,
      challengeId,
    },
  );
  const submissionsQuery = useQuery({
    ...submissionsQueryOptions,
    enabled: Boolean(tripId) && Boolean(challengeId),
  });

  const submissions = useMemo(
    () => (submissionsQuery.data ?? []) as SubmissionItem[],
    [submissionsQuery.data],
  );

  const reviewMutation = useMutation(
    trpc.challengeSubmission.review.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: submissionsQueryOptions.queryKey,
        });
        if (tripId) {
          await queryClient.invalidateQueries({
            queryKey: trpc.challenge.getAllByTrip.queryOptions({ tripId }).queryKey,
          });
        }
      },
      onError: (error) => {
        Alert.alert("Error", error.message);
      },
    }),
  );

  const filteredSubmissions = useMemo(() => {
    const byStatus =
      selectedStatusFilter === "ALL"
        ? submissions
        : submissions.filter(
            (submission) => submission.status === selectedStatusFilter,
          );

    return [...byStatus].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [selectedStatusFilter, submissions]);

  const isRefreshing =
    submissionsQuery.isRefetching || challengeQuery.isRefetching;

  const handleRefresh = useCallback(() => {
    void Promise.all([submissionsQuery.refetch(), challengeQuery.refetch()]);
  }, [challengeQuery, submissionsQuery]);

  const handleApprove = useCallback(
    (submission: SubmissionItem) => {
      Alert.alert(
        "Set approved",
        `Approve submission from ${submission.group.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: () => {
              void reviewMutation.mutateAsync({
                id: submission.id,
                status: "APPROVED",
              });
            },
          },
        ],
      );
    },
    [reviewMutation],
  );

  const openRejectModal = useCallback((submission: SubmissionItem) => {
    setSelectedSubmission(submission);
    setRejectionReason(submission.rejectionReason ?? "");
    setIsRejectModalVisible(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    if (reviewMutation.isPending) return;
    setIsRejectModalVisible(false);
    setSelectedSubmission(null);
    setRejectionReason("");
  }, [reviewMutation.isPending]);

  const handleRejectConfirm = useCallback(() => {
    const normalizedReason = rejectionReason.trim();
    if (!selectedSubmission || !normalizedReason) {
      return;
    }

    void reviewMutation
      .mutateAsync({
        id: selectedSubmission.id,
        status: "REJECTED",
        rejectionReason: normalizedReason,
      })
      .then(() => {
        closeRejectModal();
      });
  }, [closeRejectModal, rejectionReason, reviewMutation, selectedSubmission]);

  if (!tripId || !challengeId) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.mutedText}>Missing trip or challenge context.</Text>
      </View>
    );
  }

  if (submissionsQuery.isLoading || challengeQuery.isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: "Challenge submissions",
        }}
      />

      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {challengeQuery.data?.name ?? "Challenge"} • {submissions.length}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {statusFilters.map((filter) => {
            const selected = selectedStatusFilter === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => setSelectedStatusFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredSubmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="images-outline"
              size={24}
              color={colors.textSecondary}
            />
            <Text style={styles.mutedText}>No submissions in this filter.</Text>
          </View>
        ) : (
          filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              isReviewing={reviewMutation.isPending}
              onApprove={handleApprove}
              onReject={openRejectModal}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={isRejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRejectModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeRejectModal}>
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Set rejected</Text>
            <Text style={styles.modalSubtitle}>
              Provide reason for changing the decision.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Reason for rejection"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              editable={!reviewMutation.isPending}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeRejectModal}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalRejectButton,
                  (!rejectionReason.trim() || reviewMutation.isPending) &&
                    styles.modalRejectButtonDisabled,
                ]}
                disabled={!rejectionReason.trim() || reviewMutation.isPending}
                onPress={handleRejectConfirm}
              >
                <Text style={styles.modalRejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  filtersRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,206,209,0.2)",
  },
  filterChipText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
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
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardDark,
  },
  mutedText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backgroundDarkOpacity80,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  modalInput: {
    backgroundColor: colors.surfaceDark,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    color: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 96,
    textAlignVertical: "top",
    fontSize: typography.base,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  modalButton: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  modalCancelButton: {
    borderColor: colors.borderDark,
    backgroundColor: colors.surfaceDark,
  },
  modalCancelText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  modalRejectButton: {
    borderColor: "rgba(239,68,68,0.45)",
    backgroundColor: "#ef4444",
  },
  modalRejectButtonDisabled: {
    opacity: 0.5,
  },
  modalRejectText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
});
