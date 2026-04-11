import React, { useEffect, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengeDocument,
  GetChallengeSubmissionsDocument,
  GetMyVotesDocument,
  GetJudgedStaffVotingProgressDocument,
  SubmitVotesDocument,
  ForceEndVotingDocument,
  type GetChallengeSubmissionsQuery,
} from "@mirai-app/graphql-client/urql";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { ChallengeLoadingState } from "~/components/trips/challenges/ChallengeLoadingState";
import { ChallengeNotFoundState } from "~/components/trips/challenges/ChallengeNotFoundState";
import {
  useStaffVoting,
  type VotingSubmission,
} from "~/hooks/admin/useStaffVoting";
import { SubmissionImageCard } from "~/components/admin/challenges/SubmissionImageCard";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseChallenge = (value: unknown) => {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string")
    return null;

  return {
    id: value.id,
    name: value.name,
    scoringCategory:
      typeof value.scoringCategory === "string" ? value.scoringCategory : "",
    endTime:
      typeof value.endTime === "string" || value.endTime instanceof Date
        ? value.endTime
        : null,
    status: typeof value.status === "string" ? value.status : "HIDDEN",
  };
};

const parseVotingSubmissions = (
  data: GetChallengeSubmissionsQuery | undefined,
): VotingSubmission[] => {
  if (!data?.challengeSubmissions?.submissions) return [];

  return data.challengeSubmissions.submissions
    .map((item) => {
      if (!item?.id || !item.group?.id || !item.group.name) {
        return null;
      }

      const firstImage = item.imageIds?.find(
        (image): image is string => typeof image === "string",
      );

      if (!firstImage || item.status === "REJECTED") {
        return null;
      }

      return {
        id: item.id,
        groupId: item.group.id,
        groupName: item.group.name,
        imagePath: firstImage,
        createdAt: item.createdAt ?? new Date().toISOString(),
      };
    })
    .filter((item): item is VotingSubmission => item !== null);
};

export default function AdminChallengeStaffVotingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const client = useClient();
  const insets = useSafeAreaInsets();

  const challengeId =
    typeof params.challengeId === "string"
      ? params.challengeId
      : params.challengeId?.[0];
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  const challengeEnabled = Boolean(challengeId) && Boolean(tripId);

  // Challenge query using urql
  const [{ data: challengeData, fetching: challengeFetching }] = useQuery({
    query: GetChallengeDocument,
    variables: {
      id: challengeId ?? "",
      tripId: tripId ?? "",
    },
    pause: !challengeEnabled,
  });

  const challenge = useMemo(
    () => parseChallenge(challengeData?.challenge),
    [challengeData],
  );

  // Submissions query using generated urql document
  const [{ data: submissionsData, fetching: submissionsFetching }] = useQuery({
    query: GetChallengeSubmissionsDocument,
    variables: {
      challengeId: challengeId ?? "",
      limit: 100,
      offset: 0,
    },
    pause: !challengeEnabled,
  });

  // My votes query using generated urql document
  const [{ data: myVotesData, error: myVotesError }] = useQuery({
    query: GetMyVotesDocument,
    variables: {
      challengeId: challengeId ?? "",
      tripId: tripId ?? "",
    },
    pause: !challengeEnabled,
  });

  // Judged staff progress query using generated urql document
  const isJudgedStaff = challenge?.scoringCategory === "JUDGED_STAFF";
  const [{ data: judgedStaffProgressData, error: judgedStaffProgressError }] =
    useQuery({
      query: GetJudgedStaffVotingProgressDocument,
      variables: {
        challengeId: challengeId ?? "",
        tripId: tripId ?? "",
        adminParticipantIds: [],
        eligibleSubmissionsCount: 0,
        requiredPositions: 3,
      },
      pause: !challengeEnabled || !isJudgedStaff,
    });

  // Submit votes mutation using generated urql document
  const [, submitVote] = useMutation(SubmitVotesDocument);

  // Force end voting mutation using generated urql document
  const [, forceEndVoting, forceEndVotingState] = useMutation(
    ForceEndVotingDocument,
  );

  const navigateBackToChallenges = () => {
    router.replace({
      pathname: "/admin/challenges",
      params: { tripId: tripId ?? "" },
    });
  };

  const votingSubmissions: VotingSubmission[] = useMemo(() => {
    return parseVotingSubmissions(submissionsData);
  }, [submissionsData]);

  const judgedStaffProgress =
    judgedStaffProgressData?.judgedStaffVotingProgress;

  const requiredVotePositions = Math.max(
    judgedStaffProgress?.requiredPositions ?? 0,
    0,
  );

  const myVotePositions = useMemo(
    () =>
      new Set(
        (myVotesData?.myVotes?.votes ?? [])
          .filter((vote) => vote?.votePosition !== undefined)
          .map((vote) => vote.votePosition!),
      ),
    [myVotesData?.myVotes?.votes],
  );

  const hasMyCompleteVote =
    requiredVotePositions > 0 &&
    Array.from(
      { length: requiredVotePositions },
      (_, index) => index + 1,
    ).every((position) => myVotePositions.has(position));

  const voting = useStaffVoting({
    votingSubmissions,
    hasMyCompleteVote,
    requiredVotePositions,
    judgedStaffProgress,
    myVotesError,
    judgedStaffProgressError,
    challenge,
  });

  const submissionEndTimestamp = challenge?.endTime
    ? new Date(challenge.endTime).getTime()
    : null;
  const isSubmissionPhaseEnded =
    submissionEndTimestamp !== null &&
    Number.isFinite(submissionEndTimestamp) &&
    submissionEndTimestamp <= new Date().getTime();
  const canForceEnd =
    challenge?.status !== "COMPLETED" &&
    challenge?.status !== "CANCELLED" &&
    isSubmissionPhaseEnded;

  useEffect(() => {
    if (!challengeId || !tripId) return;
    if (challengeFetching || submissionsFetching) {
      return;
    }
    if (!challenge) return;
    if (
      isJudgedStaff &&
      !judgedStaffProgressData &&
      !judgedStaffProgressError
    ) {
      return;
    }

    voting.bootstrapVoting();
  }, [
    challenge,
    challengeId,
    challengeFetching,
    submissionsFetching,
    tripId,
    voting,
    isJudgedStaff,
    judgedStaffProgressData,
    judgedStaffProgressError,
  ]);

  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      client.invalidate(GetMyVotesDocument, {
        challengeId: challengeId ?? "",
        tripId: tripId ?? "",
      }),
      client.invalidate(GetChallengeSubmissionsDocument, {
        challengeId: challengeId ?? "",
        limit: 100,
        offset: 0,
      }),
      client.invalidate(GetJudgedStaffVotingProgressDocument, {
        challengeId: challengeId ?? "",
        tripId: tripId ?? "",
        adminParticipantIds: [],
        eligibleSubmissionsCount: 0,
        requiredPositions: 3,
      }),
      client.invalidate(GetChallengeDocument, {
        id: challengeId ?? "",
        tripId: tripId ?? "",
      }),
    ]);
  }, [client, challengeId, tripId]);

  const handleSubmitPodium = async () => {
    if (
      !tripId ||
      !challengeId ||
      voting.finalTopThree.length < voting.MIN_SUBMISSIONS_TO_VOTE
    ) {
      return;
    }

    const votesPayload = [
      {
        submissionId: voting.finalTopThree[0]?.id ?? "",
        votePosition: 1,
        votePoints: 3,
      },
      {
        submissionId: voting.finalTopThree[1]?.id ?? "",
        votePosition: 2,
        votePoints: 2,
      },
      {
        submissionId: voting.finalTopThree[2]?.id ?? "",
        votePosition: 3,
        votePoints: 1,
      },
    ].filter((vote) => Boolean(vote.submissionId));

    try {
      const result = await submitVote({
        input: {
          tripId,
          challengeId,
          votes: votesPayload,
        },
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate queries on success
      await invalidateQueries();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit votes";
      const normalized = message.toLowerCase();
      const alreadyVoted =
        normalized.includes("oddales juz glos") ||
        normalized.includes("mozna wyslac tylko raz") ||
        normalized.includes("already voted");

      if (alreadyVoted) {
        await invalidateQueries();
        return;
      }

      Alert.alert("Vote submission failed", message);
    }
  };

  const handleForceEndVoting = useCallback(() => {
    if (!tripId || !challengeId) return;

    Alert.alert(
      "Force end voting",
      "This will close judged staff voting now and finalize results from current votes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Force End",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await forceEndVoting({
                challengeId,
                tripId,
              });

              if (result.error) {
                throw result.error;
              }

              // Invalidate queries on success
              await invalidateQueries();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Failed to force end voting";
              Alert.alert("Force end failed", message);
            }
          },
        },
      ],
    );
  }, [challengeId, tripId, forceEndVoting, invalidateQueries]);

  const progress = voting.progress;

  if (!challengeId || !tripId || challengeFetching) {
    return <ChallengeLoadingState />;
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <ChallengeNotFoundState onGoBack={() => router.back()} />
      </View>
    );
  }

  if (!voting.bootstrapped) {
    return <ChallengeLoadingState />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxxl + 96 },
        ]}
      >
        <Text style={styles.title}>{challenge.name}</Text>
        <Text style={styles.subtitle}>Staff collaborative voting</Text>
        <View style={styles.staffProgressCard}>
          <Text style={styles.staffProgressTitle}>
            Admin votes: {judgedStaffProgress?.votedAdmins ?? 0}/
            {judgedStaffProgress?.totalAdmins ?? 0}
          </Text>
          <Text style={styles.staffProgressText}>
            {judgedStaffProgress?.pendingAdmins
              ? `Waiting for ${judgedStaffProgress.pendingAdmins} admin(s).`
              : "All admin votes are in."}
          </Text>
          {canForceEnd ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.forceButton]}
              onPress={handleForceEndVoting}
              disabled={forceEndVotingState.fetching}
            >
              <Text style={styles.forceButtonText}>
                {forceEndVotingState.fetching
                  ? "Finalizing..."
                  : "Force End Voting"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {voting.phase === "comparing" ? (
          <>
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {voting.comparisonCount}/{voting.hardCap} comparisons
              </Text>
            </View>

            {voting.currentLeft && voting.currentRight ? (
              <View style={styles.pairsWrap}>
                <SubmissionImageCard
                  submission={voting.currentLeft}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() =>
                    voting.handlePickWinner(voting.currentLeft!.id)
                  }
                />
                <SubmissionImageCard
                  submission={voting.currentRight}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() =>
                    voting.handlePickWinner(voting.currentRight!.id)
                  }
                />
              </View>
            ) : (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            {voting.stableTop3Count > 0 ? (
              <Text style={styles.hintText}>
                Top 3 stable streak: {voting.stableTop3Count}/
                {voting.TOP3_STABILITY_REQUIRED}
              </Text>
            ) : null}
          </>
        ) : null}

        {voting.phase === "confirming" ? (
          <>
            <Text style={styles.sectionTitle}>Confirm your podium</Text>
            {voting.comparisonCount < voting.hardCap ? (
              <Text style={styles.successHint}>Mamy Twoje TOP 3!</Text>
            ) : null}
            <View style={styles.confirmList}>
              {voting.finalTopThree.map((submission, index) => (
                <SubmissionImageCard
                  key={`${submission.id}-${index + 1}`}
                  submission={submission}
                  title={`#${index + 1}`}
                  subtitle={
                    index === 0
                      ? "3 points"
                      : index === 1
                        ? "2 points"
                        : "1 point"
                  }
                />
              ))}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionGhost]}
                onPress={voting.startComparing}
              >
                <Text style={styles.actionGhostText}>Vote Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionPrimary]}
                onPress={() => void handleSubmitPodium()}
                disabled={false}
              >
                <Text style={styles.actionPrimaryText}>Confirm Podium</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {voting.phase === "done" ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneTitle}>
              {challenge.status === "COMPLETED"
                ? "Voting completed"
                : "Vote submitted"}
            </Text>
            <Text style={styles.doneText}>
              {challenge.status === "COMPLETED"
                ? "Staff voting is closed and results were finalized."
                : `Your vote was saved. Waiting for ${
                    judgedStaffProgress?.pendingAdmins ?? "remaining"
                  } admin(s).`}
            </Text>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionPrimary,
                styles.doneButton,
              ]}
              onPress={navigateBackToChallenges}
            >
              <Text style={styles.actionPrimaryText}>Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {voting.phase === "blocked" ? (
          <View style={styles.blockedCard}>
            <Text style={styles.blockedTitle}>Voting unavailable</Text>
            <Text style={styles.blockedText}>
              {voting.blockedReason ?? "Voting is not available right now."}
            </Text>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionPrimary,
                styles.doneButton,
              ]}
              onPress={navigateBackToChallenges}
            >
              <Text style={styles.actionPrimaryText}>Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
  },
  subtitle: {
    marginTop: -spacing.sm,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: typography.xs,
  },
  staffProgressCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.skyOpacity35,
    backgroundColor: colors.skyOpacity10,
    padding: spacing.md,
    gap: spacing.xs,
  },
  staffProgressTitle: {
    color: colors.sky400,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  staffProgressText: {
    color: colors.white,
    fontSize: typography.sm,
  },
  progressWrap: {
    gap: spacing.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.whiteOpacity10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pairsWrap: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  successHint: {
    color: colors.emerald500,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: typography.bold,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  confirmList: {
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionGhost: {
    borderWidth: 1,
    borderColor: colors.whiteOpacity20,
    backgroundColor: colors.whiteOpacity4,
  },
  actionPrimaryText: {
    color: colors.backgroundDark,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  actionGhostText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  forceButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.danger,
  },
  forceButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  doneCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.successOpacity35,
    backgroundColor: colors.successOpacity12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  doneTitle: {
    color: colors.emerald500,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  doneText: {
    color: colors.white,
    fontSize: typography.sm,
  },
  doneButton: {
    marginTop: spacing.sm,
  },
  blockedCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dangerOpacity35,
    backgroundColor: colors.dangerOpacity12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  blockedTitle: {
    color: colors.danger,
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
  centerState: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});

/*
## Summary of Migration from TanStack Query to urql

### Changes Made:

1. **Removed manual GraphQL client setup:**
   - Removed: `graphql-request` GraphQLClient creation
   - Removed: `createGraphQLClient` function and manual token handling
   - Removed: `SecureStore` imports (no longer needed)
   - Rationale: urql client is provided via context by the app's root provider

2. **Updated imports:**
   - Removed: `import { useQuery, useQueryClient } from "@tanstack/react-query"`
   - Removed: `import { GraphQLClient } from "graphql-request"`
   - Removed: `import * as SecureStore from "expo-secure-store"`
   - Added: `import { useQuery, useMutation, useClient, gql } from "urql"`
   - Changed generated hooks to use urql Documents:
     - `useGetChallengeSubmissionsQuery` → `GetChallengeSubmissionsDocument`
     - `useGetMyVotesQuery` → `GetMyVotesDocument`
     - `useGetJudgedStaffVotingProgressQuery` → `GetJudgedStaffVotingProgressDocument`
     - `useSubmitVotesMutation` → `SubmitVotesDocument`
     - `useForceEndVotingMutation` → `ForceEndVotingDocument`

3. **Updated query patterns:**
   - Challenge query: Changed from TanStack Query's `useQuery({ queryKey, queryFn, enabled })`
     to urql's `useQuery({ query, variables, pause })`
   - Submissions query: Changed from generated hook `useGetChallengeSubmissionsQuery(client, vars, opts)`
     to `useQuery({ query: GetChallengeSubmissionsDocument, variables, pause })`
   - My votes query: Same pattern as above
   - Judged staff progress query: Same pattern with conditional `pause` based on `isJudgedStaff`

4. **Updated mutation patterns:**
   - Changed from `useMutation(client, { onSuccess, onError })` to `useMutation(Document)`
   - Manual success/error handling instead of callback-based
   - Error thrown from result and caught in try-catch blocks

5. **Updated cache invalidation:**
   - Removed: `useQueryClient()` and `queryClient.invalidateQueries({ queryKey })`
   - Added: `useClient()` and `client.invalidate(Document, variables)`
   - Created reusable `invalidateQueries` callback for consistent invalidation

6. **Updated loading states:**
   - Changed: `isLoading` / `isFetching` → `fetching` (urql's loading state property)
   - Changed: `mutation.isPending` → `mutationState.fetching`

7. **Key differences from TanStack Query:**
   - urql returns tuple `[{ data, fetching, error }, execute]` instead of object
   - `pause` replaces `enabled` (inverted logic - true means paused/stopped)
   - Manual error handling from mutation result instead of `onError` callback
   - Cache invalidation uses `client.invalidate(document, variables)` instead of query keys

### Files Referenced for Pattern:
- `apps/native/src/app/(tabs)/admin/challenges/index.tsx` - urql migration example
- `apps/native/src/app/(tabs)/admin/users/index.tsx` - urql query patterns
*/
