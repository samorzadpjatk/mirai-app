import React, { useEffect, useCallback, useMemo } from 'react';
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/trpc/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "~/styles";
import { ChallengeLoadingState } from "~/components/trips/challenges/ChallengeLoadingState";
import { ChallengeNotFoundState } from "~/components/trips/challenges/ChallengeNotFoundState";
import { useStaffVoting, type VotingSubmission } from "~/hooks/admin/useStaffVoting";
import { SubmissionImageCard } from "~/components/admin/challenges/SubmissionImageCard";

export default function AdminChallengeStaffVotingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const insets = useSafeAreaInsets();

  const challengeId =
    typeof params.challengeId === "string"
      ? params.challengeId
      : params.challengeId?.[0];
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  const challengeQuery = trpc.challenge.getById.queryOptions({
    id: challengeId ?? "",
    tripId: tripId ?? "",
  });
  const submissionsQuery =
    trpc.challengeSubmission.getByChallengeForAdmin.queryOptions({
      challengeId: challengeId ?? "",
      tripId: tripId ?? "",
    });
  const myVotesQuery = trpc.challengeVote.getMyByChallenge.queryOptions({
    challengeId: challengeId ?? "",
    tripId: tripId ?? "",
  });
  const judgedStaffProgressQuery =
    trpc.challengeVote.getJudgedStaffProgress.queryOptions({
      challengeId: challengeId ?? "",
      tripId: tripId ?? "",
    });

  const { data: challenge, isLoading: isLoadingChallenge } = useQuery({
    ...challengeQuery,
    enabled: !!challengeId && !!tripId,
  });
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    ...submissionsQuery,
    enabled: !!challengeId && !!tripId,
  });
  const {
    data: myVotes,
    isLoading: isLoadingVotes,
    error: myVotesError,
  } = useQuery({
    ...myVotesQuery,
    enabled: !!challengeId && !!tripId,
  });
  const {
    data: judgedStaffProgress,
    isLoading: isLoadingProgress,
    error: judgedStaffProgressError,
  } = useQuery({
    ...judgedStaffProgressQuery,
    enabled:
      !!challengeId &&
      !!tripId &&
      challenge?.scoringCategory === "JUDGED_STAFF",
    refetchInterval: 10_000,
  });

  const submitVoteMutation = useMutation(
    trpc.challengeVote.submitVotes.mutationOptions(),
  );
  const forceEndMutation = useMutation(
    trpc.challengeVote.forceEndJudgedStaffVoting.mutationOptions(),
  );

  const voting = useStaffVoting({
    votingSubmissions,
    hasMyCompleteVote,
    requiredVotePositions,
    judgedStaffProgress,
    myVotesError,
    judgedStaffProgressError,
    challenge,
  });

  useEffect(() => {
    if (!challengeId || !tripId) return;
    if (isLoadingChallenge || isLoadingSubmissions || isLoadingVotes) {
      return;
    }
    if (!challenge) return;
    if (challenge.scoringCategory === "JUDGED_STAFF" && isLoadingProgress) {
      return;
    }

    voting.bootstrapVoting();
  }, [
    challenge,
    challengeId,
    isLoadingChallenge,
    isLoadingProgress,
    isLoadingSubmissions,
    isLoadingVotes,
    tripId,
    voting,
  ]);

  const navigateBackToChallenges = () => {
    router.replace({
      pathname: "/admin/challenges",
      params: { tripId: tripId ?? "" },
    });
  };


  const votingSubmissions: VotingSubmission[] = useMemo(() => {
    const raw = submissionsData ?? [];
    return raw
      .filter((submission) => submission.status !== "REJECTED")
      .filter((submission) => Boolean(submission.imageIds[0]))
      .map((submission) => ({
        id: submission.id,
        groupId: submission.groupId,
        groupName: submission.group.name,
        imagePath: submission.imageIds[0] ?? "",
        createdAt: submission.createdAt,
      }));
  }, [submissionsData]);

  const requiredVotePositions = Math.max(
    judgedStaffProgress?.requiredPositions ?? 0,
    0,
  );
  const myVotePositions = useMemo(
    () => new Set((myVotes ?? []).map((vote) => vote.votePosition)),
    [myVotes],
  );
  const hasMyCompleteVote =
    requiredVotePositions > 0 &&
    Array.from({ length: requiredVotePositions }, (_, index) => index + 1).every(
      (position) => myVotePositions.has(position),
    );
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
      await submitVoteMutation.mutateAsync({
        tripId,
        challengeId,
        votes: votesPayload,
      });

      await queryClient.invalidateQueries({ queryKey: myVotesQuery.queryKey });
      await queryClient.invalidateQueries({ queryKey: submissionsQuery.queryKey });
      await queryClient.invalidateQueries({
        queryKey: judgedStaffProgressQuery.queryKey,
      });
      await queryClient.invalidateQueries({ queryKey: challengeQuery.queryKey });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit votes";
      const normalized = message.toLowerCase();
      const alreadyVoted =
        normalized.includes("oddales juz glos") ||
        normalized.includes("mozna wyslac tylko raz") ||
        normalized.includes("already voted");

      if (alreadyVoted) {
        await queryClient.invalidateQueries({ queryKey: myVotesQuery.queryKey });
        await queryClient.invalidateQueries({
          queryKey: judgedStaffProgressQuery.queryKey,
        });
        await queryClient.invalidateQueries({ queryKey: challengeQuery.queryKey });
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
          onPress: () => {
            void forceEndMutation
              .mutateAsync({
                tripId,
                challengeId,
              })
              .then(async () => {
                await queryClient.invalidateQueries({
                  queryKey: challengeQuery.queryKey,
                });
                await queryClient.invalidateQueries({
                  queryKey: submissionsQuery.queryKey,
                });
                await queryClient.invalidateQueries({
                  queryKey: myVotesQuery.queryKey,
                });
                await queryClient.invalidateQueries({
                  queryKey: judgedStaffProgressQuery.queryKey,
                });
              })
              .catch((error: unknown) => {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Failed to force end voting";
                Alert.alert("Force end failed", message);
              });
          },
        },
      ],
    );
  }, [
    challengeId,
    challengeQuery.queryKey,
    forceEndMutation,
    judgedStaffProgressQuery.queryKey,
    myVotesQuery.queryKey,
    queryClient,
    submissionsQuery.queryKey,
    tripId,
  ]);

  const progress = voting.progress;

  if (!challengeId || !tripId || isLoadingChallenge) {
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
              disabled={forceEndMutation.isPending}
            >
              <Text style={styles.forceButtonText}>
                {forceEndMutation.isPending ? "Finalizing..." : "Force End Voting"}
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
                  onPress={() => voting.handlePickWinner(voting.currentLeft!.id)}
                />
                <SubmissionImageCard
                  submission={voting.currentRight}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() => voting.handlePickWinner(voting.currentRight!.id)}
                />
              </View>
            ) : (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            {voting.stableTop3Count > 0 ? (
              <Text style={styles.hintText}>
                Top 3 stable streak: {voting.stableTop3Count}/{voting.TOP3_STABILITY_REQUIRED}
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
                    index === 0 ? "3 points" : index === 1 ? "2 points" : "1 point"
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
                disabled={submitVoteMutation.isPending}
              >
                <Text style={styles.actionPrimaryText}>
                  {submitVoteMutation.isPending
                    ? "Submitting..."
                    : "Confirm Podium"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {voting.phase === "done" ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneTitle}>
              {challenge.status === "COMPLETED" ? "Voting completed" : "Vote submitted"}
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
