import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/trpc/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterChip, FilterChipRow, EmptyState, AppModalShell, AppModalFooter, ThemedTextInput } from "~/components/common/ui";
import { SubmissionReviewCard, type SubmissionItem } from "~/components/admin/challenges/SubmissionReviewCard";
import { borderRadius, colors, spacing, typography } from "~/styles";

type ReviewStatus = "APPROVED" | "REJECTED";
type SubmissionStatus = ReviewStatus | "PENDING";
type StatusFilter = "ALL" | SubmissionStatus;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];


export default function ChallengeSubmissionsScreen() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
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
      const approveWithRanking = (ranking?: 1 | 2 | 3) => {
        void reviewMutation.mutateAsync({
          id: submission.id,
          status: "APPROVED",
          ranking,
        });
      };

      Alert.alert(
        "Set approved",
        `Approve submission from ${submission.group.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: () => {
              approveWithRanking();
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

  if (challengeQuery.data?.scoringCategory === "JUDGED_STAFF") {
    return (
      <View style={styles.centeredScreen}>
        <Stack.Screen
          options={{
            title: "Challenge submissions",
          }}
        />
        <View style={styles.blockedCard}>
          <Text style={styles.blockedTitle}>Use staff voting</Text>
          <Text style={styles.blockedText}>
            For judged staff challenges use the dedicated staff voting flow.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() =>
              router.replace({
                pathname: "/admin/challenges/staff-vote",
                params: { tripId, challengeId },
              })
            }
          >
            <Ionicons
              name="git-compare-outline"
              size={16}
              color={colors.backgroundDark}
            />
            <Text style={styles.approveButtonText}>Open staff voting</Text>
          </TouchableOpacity>
        </View>
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
        <FilterChipRow>
          {statusFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={selectedStatusFilter === filter.value}
              onPress={() => setSelectedStatusFilter(filter.value)}
              accessibilityLabel={`Filter submissions by ${filter.label}`}
            />
          ))}
        </FilterChipRow>

        {filteredSubmissions.length === 0 ? (
          <EmptyState
            icon="images-outline"
            iconSize={24}
            title="No submissions in this filter."
          />
        ) : (
          filteredSubmissions.map((submission) => (
            <SubmissionReviewCard
              key={submission.id}
              submission={submission}
              isReviewing={reviewMutation.isPending}
              onApprove={handleApprove}
              onReject={openRejectModal}
            />
          ))
        )}
      </ScrollView>

      <AppModalShell
        visible={isRejectModalVisible}
        title="Set rejected"
        onClose={closeRejectModal}
      >
        <Text style={styles.modalSubtitle}>
          Provide reason for changing the decision.
        </Text>
        <ThemedTextInput
          style={styles.modalInput}
          value={rejectionReason}
          onChangeText={setRejectionReason}
          placeholder="Reason for rejection"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
          editable={!reviewMutation.isPending}
        />
        <AppModalFooter
          primaryLabel="Reject"
          onPrimary={handleRejectConfirm}
          isPrimaryLoading={reviewMutation.isPending}
          isPrimaryDisabled={!rejectionReason.trim()}
          secondaryLabel="Cancel"
          onSecondary={closeRejectModal}
        />
      </AppModalShell>
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
    borderColor: colors.slateOpacity35,
    backgroundColor: colors.backgroundDarkOpacity45,
    padding: spacing.md,
    gap: spacing.xs,
  },
  textBoxLabel: {
    color: colors.slate300,
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
    borderColor: colors.dangerOpacity35,
    backgroundColor: colors.dangerOpacity12,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 2,
  },
  reasonLabel: {
    color: colors.red400,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  reasonText: {
    color: colors.red300,
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
    borderColor: colors.successOpacity45,
    backgroundColor: colors.successOpacity90,
  },
  approveButtonText: {
    color: colors.backgroundDark,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: colors.dangerOpacity45,
    backgroundColor: colors.dangerOpacity85,
  },
  rejectButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  mutedText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  blockedCard: {
    width: "90%",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.skyOpacity35,
    backgroundColor: colors.skyOpacity14,
    padding: spacing.lg,
    gap: spacing.md,
  },
  blockedTitle: {
    color: colors.sky400,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  blockedText: {
    color: colors.white,
    fontSize: typography.sm,
    lineHeight: 20,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    marginBottom: spacing.md,
  },
  modalInput: {
    minHeight: 96,
    textAlignVertical: "top",
    fontSize: typography.base,
    marginBottom: spacing.lg,
  },
});
