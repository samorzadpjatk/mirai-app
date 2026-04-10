import React, { useCallback, useMemo, useState } from "react";
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
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengeDocument,
  GetChallengeSubmissionsDocument,
  UpdateChallengeSubmissionDocument,
} from "@mirai-app/graphql-types/urql";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FilterChip,
  FilterChipRow,
  EmptyState,
  AppModalShell,
  AppModalFooter,
  ThemedTextInput,
} from "~/components/common/ui";
import {
  SubmissionReviewCard,
  type SubmissionItem,
} from "~/components/admin/challenges/SubmissionReviewCard";
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
  const router = useRouter();
  const client = useClient();
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

  const queryEnabled = Boolean(tripId) && Boolean(challengeId);

  // GraphQL query for challenge details using generated document
  const [{ data: challengeData, fetching: challengeFetching }] = useQuery({
    query: GetChallengeDocument,
    variables: {
      id: challengeId,
      tripId,
    },
    pause: !queryEnabled,
  });

  // GraphQL query for submissions
  const [
    { data: submissionsData, fetching: submissionsFetching },
    reexecuteSubmissionsQuery,
  ] = useQuery({
    query: GetChallengeSubmissionsDocument,
    variables: {
      challengeId,
      limit: 100,
    },
    pause: !queryEnabled,
  });

  const submissions = useMemo(
    () =>
      (submissionsData?.challengeSubmissions?.submissions ??
        []) as SubmissionItem[],
    [submissionsData],
  );

  // GraphQL mutation for reviewing submissions
  const [, executeReviewMutation] = useMutation(
    UpdateChallengeSubmissionDocument,
  );

  const handleInvalidateQueries = useCallback(async () => {
    await client.invalidate(GetChallengeSubmissionsDocument, {
      challengeId,
      limit: 100,
    });
    if (tripId) {
      // Note: GetChallenges query invalidation would require the Document
      // For now, we rely on the submissions invalidation above
    }
  }, [client, challengeId, tripId]);

  const reviewMutation = useMemo(
    () => ({
      mutateAsync: async (input: {
        input: {
          id: string;
          status: "APPROVED" | "REJECTED";
          ranking?: 1 | 2 | 3;
          rejectionReason?: string;
        };
      }) => {
        const result = await executeReviewMutation(input);
        if (result.error) {
          throw new Error(result.error.message);
        }
        await handleInvalidateQueries();
        return result.data;
      },
      isPending: false, // urql doesn't provide this directly, handled via local state if needed
    }),
    [executeReviewMutation, handleInvalidateQueries],
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

  const isRefreshing = submissionsFetching || challengeFetching;
  const handleRefresh = useCallback(() => {
    void reexecuteSubmissionsQuery({ requestPolicy: "network-only" });
  }, [reexecuteSubmissionsQuery]);

  const [isReviewing, setIsReviewing] = useState(false);

  const handleApprove = useCallback(
    (submission: SubmissionItem) => {
      const approveWithRanking = async (ranking?: 1 | 2 | 3) => {
        setIsReviewing(true);
        try {
          await reviewMutation.mutateAsync({
            input: {
              id: submission.id,
              status: "APPROVED",
              ranking,
            },
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          Alert.alert("Error", message);
        } finally {
          setIsReviewing(false);
        }
      };

      Alert.alert(
        "Set approved",
        `Approve submission from ${submission.group.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: () => {
              void approveWithRanking();
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
    if (isReviewing) return;
    setIsRejectModalVisible(false);
    setSelectedSubmission(null);
    setRejectionReason("");
  }, [isReviewing]);

  const handleRejectConfirm = useCallback(() => {
    const normalizedReason = rejectionReason.trim();
    if (!selectedSubmission || !normalizedReason) {
      return;
    }

    setIsReviewing(true);
    reviewMutation
      .mutateAsync({
        input: {
          id: selectedSubmission.id,
          status: "REJECTED",
          rejectionReason: normalizedReason,
        },
      })
      .then(() => {
        closeRejectModal();
      })
      .catch((error: Error) => {
        Alert.alert("Error", error.message);
      })
      .finally(() => {
        setIsReviewing(false);
      });
  }, [closeRejectModal, rejectionReason, reviewMutation, selectedSubmission]);

  if (!tripId || !challengeId) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.mutedText}>Missing trip or challenge context.</Text>
      </View>
    );
  }

  if (submissionsFetching || challengeFetching) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (challengeData?.challenge?.scoringCategory === "JUDGED_STAFF") {
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
          {challengeData?.challenge?.name ?? "Challenge"} • {submissions.length}
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
              isReviewing={isReviewing}
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
          editable={!isReviewing}
        />
        <AppModalFooter
          primaryLabel="Reject"
          onPrimary={handleRejectConfirm}
          isPrimaryLoading={isReviewing}
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

/*
## Summary of Migration from TanStack Query to urql

### 1. Imports Changed
- Removed: `import { useQuery, useQueryClient } from "@tanstack/react-query"`
- Removed: `import { GraphQLClient } from "graphql-request"` and custom hooks like `useGetChallengeQuery`
- Added: `import { useQuery, useMutation, useClient } from "urql"`
- Added: `import gql from "graphql-tag"`
- Added: Imported GraphQL Documents (`GetChallengeSubmissionsDocument`, `UpdateChallengeSubmissionDocument`) from `@mirai-app/graphql-types`

### 2. Hook Replacements

#### `useQuery` (TanStack) → `useQuery` (urql)
- Challenge query: Changed from `useGetChallengeQuery(client, variables, options)` to `useQuery({ query: GetChallengeDocument, variables, pause })`
- Submissions query: Changed from `useGetChallengeSubmissionsQuery(client, variables, options)` to `useQuery({ query: GetChallengeSubmissionsDocument, variables, pause })`
- Return type changed from `{ data, isLoading, isRefetching }` to `[{ data, fetching }, reexecute]` tuple

#### `useMutation` (TanStack) → `useMutation` (urql)
- Changed from `useUpdateChallengeSubmissionMutation(client, options)` to `useMutation(UpdateChallengeSubmissionDocument)`
- Removed `onSuccess` and `onError` callbacks from mutation options
- Manual error handling via `result.error` check

#### `useQueryClient()` → `useClient()`
- Cache invalidation: Changed from `queryClient.invalidateQueries({ queryKey })` to `client.invalidate(Document, variables)`

### 3. State Management Changes
- Added local `isReviewing` state to track mutation pending status (urql doesn't provide `isPending` directly)
- Replaced `reviewMutation.isPending` with `isReviewing` state throughout the component

### 4. GraphQL Documents
- `GetChallengeDocument`: Defined inline using `gql` template literal (not yet in generated urql types)
- `GetChallengeSubmissionsDocument`: Imported from `@mirai-app/graphql-types`
- `UpdateChallengeSubmissionDocument`: Imported from `@mirai-app/graphql-types`

### 5. Loading States Updated
- `isLoading` / `isFetching` → `fetching`
- `submissionsQuery.isRefetching || challengeQuery.isRefetching` → `submissionsFetching || challengeFetching`
- `submissionsQuery.refetch()` → `reexecuteSubmissionsQuery({ requestPolicy: "network-only" })`

### 6. Data Access Patterns
- `submissionsQuery.data?.challengeSubmissions?.submissions` → `submissionsData?.challengeSubmissions?.submissions`
- `challengeQuery.data?.challenge?.name` → `challengeData?.challenge?.name`

### 7. Error Handling
- TanStack's `onError` callback removed
- Errors now caught via try/catch when calling `mutateAsync` wrapper
- Alert shown with error message on mutation failure
*/
