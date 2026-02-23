import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "~/styles";
import { ChallengeLoadingState } from "~/components/trips/challenges/ChallengeLoadingState";
import { ChallengeNotFoundState } from "~/components/trips/challenges/ChallengeNotFoundState";

type VotingPhase = "comparing" | "confirming" | "done" | "blocked";

interface VotingSubmission {
  id: string;
  groupId: string;
  groupName: string;
  imagePath: string;
  createdAt: string | Date;
}

const ELO_BASE_RATING = 1500;
const ELO_K = 32;
const TOP3_STABILITY_REQUIRED = 3;
const MIN_SUBMISSIONS_TO_VOTE = 2;

const toPairKey = (leftId: string, rightId: string) =>
  leftId < rightId ? `${leftId}|${rightId}` : `${rightId}|${leftId}`;

const rankByRating = (
  submissions: VotingSubmission[],
  ratings: Record<string, number>,
) =>
  [...submissions].sort((a, b) => {
    const ratingDelta =
      (ratings[b.id] ?? ELO_BASE_RATING) - (ratings[a.id] ?? ELO_BASE_RATING);
    if (Math.abs(ratingDelta) > 0.0001) return ratingDelta;
    const createdAtDelta =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (createdAtDelta !== 0) return createdAtDelta;
    return a.id.localeCompare(b.id);
  });

const pickNextPair = (
  submissions: VotingSubmission[],
  ratings: Record<string, number>,
  comparedPairs: Set<string>,
) => {
  const candidates: {
    pair: [string, string];
    diff: number;
  }[] = [];

  for (let i = 0; i < submissions.length; i += 1) {
    const left = submissions[i];
    if (!left) continue;
    for (let j = i + 1; j < submissions.length; j += 1) {
      const right = submissions[j];
      if (!right) continue;
      if (left.groupId === right.groupId) continue;
      const key = toPairKey(left.id, right.id);
      if (comparedPairs.has(key)) continue;
      const diff = Math.abs(
        (ratings[left.id] ?? ELO_BASE_RATING) -
          (ratings[right.id] ?? ELO_BASE_RATING),
      );
      candidates.push({ pair: [left.id, right.id], diff });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.diff - b.diff);
  const poolSize = Math.min(candidates.length, 6);
  const pickIndex = Math.floor(Math.random() * poolSize);
  return candidates[pickIndex]?.pair ?? candidates[0]?.pair ?? null;
};

function SubmissionImageCard({
  submission,
  title,
  subtitle,
  onPress,
  disabled = false,
}: {
  submission: VotingSubmission;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery({
    ...trpc.storage.createDownloadUrl.queryOptions({
      storagePath: submission.imagePath,
    }),
    enabled: !!submission.imagePath,
  });

  const content = (
    <View style={styles.voteCard}>
      <View style={styles.voteImageWrap}>
        {isLoading ? (
          <View style={styles.voteImageFallback}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : data?.signedUrl ? (
          <Image source={{ uri: data.signedUrl }} style={styles.voteImage} />
        ) : (
          <View style={styles.voteImageFallback}>
            <Text style={styles.voteImageFallbackText}>
              {submission.groupName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.voteCardBody}>
        <Text style={styles.voteCardTitle}>{title}</Text>
        <Text style={styles.voteCardGroup}>{submission.groupName}</Text>
        {subtitle ? (
          <Text style={styles.voteCardSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      {content}
    </TouchableOpacity>
  );
}

export default function AdminChallengeStaffVotingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

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

  const [phase, setPhase] = useState<VotingPhase>("comparing");
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comparedPairs, setComparedPairs] = useState<Set<string>>(new Set());
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(null);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [stableTop3Count, setStableTop3Count] = useState(0);
  const [previousTop3Key, setPreviousTop3Key] = useState<string | null>(null);
  const [finalTopThreeIds, setFinalTopThreeIds] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

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

  const submissionById = useMemo(
    () =>
      new Map(
        votingSubmissions.map((submission) => [submission.id, submission]),
      ),
    [votingSubmissions],
  );

  const hardCap = Math.max(votingSubmissions.length * 2, 1);
  const ranking = useMemo(
    () => rankByRating(votingSubmissions, ratings),
    [votingSubmissions, ratings],
  );
  const calculatedTopThree = ranking.slice(0, 3);
  const finalTopThree = useMemo(() => {
    if (finalTopThreeIds.length > 0) {
      return finalTopThreeIds
        .map((id) => submissionById.get(id))
        .filter((submission): submission is VotingSubmission =>
          Boolean(submission),
        );
    }
    return calculatedTopThree;
  }, [calculatedTopThree, finalTopThreeIds, submissionById]);
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

  const currentLeft = currentPair ? submissionById.get(currentPair[0]) : null;
  const currentRight = currentPair ? submissionById.get(currentPair[1]) : null;

  const navigateBackToChallenges = () => {
    router.replace({
      pathname: "/admin/challenges",
      params: { tripId: tripId ?? "" },
    });
  };

  const startComparing = useCallback(() => {
    if (votingSubmissions.length < MIN_SUBMISSIONS_TO_VOTE) return;
    const initialRatings = Object.fromEntries(
      votingSubmissions.map((submission) => [submission.id, ELO_BASE_RATING]),
    );
    const initialCompared = new Set<string>();
    const pair = pickNextPair(
      votingSubmissions,
      initialRatings,
      initialCompared,
    );

    setRatings(initialRatings);
    setComparedPairs(initialCompared);
    setCurrentPair(pair);
    setComparisonCount(0);
    setStableTop3Count(0);
    setPreviousTop3Key(null);
    setFinalTopThreeIds([]);
    setBlockedReason(null);
    setPhase("comparing");
  }, [votingSubmissions]);

   
  useEffect(() => {
    if (!challengeId || !tripId) return;
    if (isLoadingChallenge || isLoadingSubmissions || isLoadingVotes) {
      return;
    }
    if (!challenge) return;
    if (challenge.scoringCategory === "JUDGED_STAFF" && isLoadingProgress) {
      return;
    }

    const setBlockedState = (reason: string) => {
      setPhase("blocked");
      setBlockedReason(reason);
      setBootstrapped(true);
    };

    if (challenge.scoringCategory !== "JUDGED_STAFF") {
      setBlockedState("This screen is available only for Judged Staff challenges.");
      return;
    }

    if (!challenge.endTime) {
      setBlockedState(
        "Staff voting will be available after submission phase ends. Set submission end time first.",
      );
      return;
    }

    if (!isSubmissionPhaseEnded) {
      setBlockedState(
        "Staff voting will be available only after submission phase ends.",
      );
      return;
    }

    if (challenge.status === "CANCELLED") {
      setBlockedState("Challenge is cancelled.");
      return;
    }

    if (myVotesError) {
      const message =
        myVotesError instanceof Error
          ? myVotesError.message
          : "Voting unavailable for your account";
      setBlockedState(message);
      return;
    }

    if (judgedStaffProgressError) {
      const message =
        judgedStaffProgressError instanceof Error
          ? judgedStaffProgressError.message
          : "Unable to load staff voting progress";
      setBlockedState(message);
      return;
    }

    if (challenge.status === "COMPLETED" || hasMyCompleteVote) {
      if (phase !== "done") {
        setTimeout(() => setPhase("done"), 0);
      }
      setTimeout(() => setBootstrapped(true), 0);
      return;
    }

    if (requiredVotePositions < MIN_SUBMISSIONS_TO_VOTE) {
      if (phase !== "blocked") {
        setTimeout(() => setPhase("blocked"), 0);
      }
      setTimeout(() => setBlockedReason(
        `At least ${MIN_SUBMISSIONS_TO_VOTE} eligible submissions are required to start staff voting. Eligible now: ${judgedStaffProgress?.eligibleSubmissionsCount ?? votingSubmissions.length}.`,
      ), 0);
      setTimeout(() => setBootstrapped(true), 0);
      return;
    }

    if (!bootstrapped || phase === "blocked") {
      setTimeout(() => startComparing(), 0);
      setTimeout(() => setBootstrapped(true), 0);
    }
  }, [
    bootstrapped,
    challenge,
    challengeId,
    isLoadingChallenge,
    isLoadingProgress,
    isLoadingSubmissions,
    isLoadingVotes,
    hasMyCompleteVote,
    judgedStaffProgressError,
    myVotesError,
    phase,
    requiredVotePositions,
    startComparing,
    tripId,
    isSubmissionPhaseEnded,
    judgedStaffProgress?.eligibleSubmissionsCount,
    votingSubmissions.length,
  ]);
   

  const handlePickWinner = (winnerId: string) => {
    if (phase !== "comparing") return;
    if (!currentPair) return;
    const [leftId, rightId] = currentPair;

    const leftRating = ratings[leftId] ?? ELO_BASE_RATING;
    const rightRating = ratings[rightId] ?? ELO_BASE_RATING;
    const expectedLeft = 1 / (1 + 10 ** ((rightRating - leftRating) / 400));
    const expectedRight = 1 / (1 + 10 ** ((leftRating - rightRating) / 400));
    const leftScore = winnerId === leftId ? 1 : 0;
    const rightScore = winnerId === rightId ? 1 : 0;

    const nextRatings: Record<string, number> = {
      ...ratings,
      [leftId]: leftRating + ELO_K * (leftScore - expectedLeft),
      [rightId]: rightRating + ELO_K * (rightScore - expectedRight),
    };

    const nextCompared = new Set(comparedPairs);
    nextCompared.add(toPairKey(leftId, rightId));
    const nextComparisonCount = comparisonCount + 1;
    const nextRanking = rankByRating(votingSubmissions, nextRatings);
    const nextTop3Ids = nextRanking
      .slice(0, 3)
      .map((submission) => submission.id);
    const nextTop3Key = nextTop3Ids.join("|");
    const nextStableTop3Count =
      previousTop3Key === nextTop3Key ? stableTop3Count + 1 : 0;

    const reachedHardCap = nextComparisonCount >= hardCap;
    const reachedStableTop3 = nextStableTop3Count >= TOP3_STABILITY_REQUIRED;
    const nextPair = pickNextPair(votingSubmissions, nextRatings, nextCompared);
    const noMorePairs = !nextPair;

    setRatings(nextRatings);
    setComparedPairs(nextCompared);
    setComparisonCount(nextComparisonCount);
    setStableTop3Count(nextStableTop3Count);
    setPreviousTop3Key(nextTop3Key);

    if (reachedHardCap || reachedStableTop3 || noMorePairs) {
      setFinalTopThreeIds(nextTop3Ids);
      setCurrentPair(null);
      setPhase("confirming");
      return;
    }

    setCurrentPair(nextPair);
  };

  const handleSubmitPodium = async () => {
    if (
      !tripId ||
      !challengeId ||
      finalTopThree.length < MIN_SUBMISSIONS_TO_VOTE
    ) {
      return;
    }

    const votesPayload = [
      {
        submissionId: finalTopThree[0]?.id ?? "",
        votePosition: 1,
        votePoints: 3,
      },
      {
        submissionId: finalTopThree[1]?.id ?? "",
        votePosition: 2,
        votePoints: 2,
      },
      {
        submissionId: finalTopThree[2]?.id ?? "",
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
      setPhase("done");
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
        setBlockedReason(null);
        setPhase("done");
        return;
      }

      setBlockedReason(message);
      setPhase("blocked");
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
                setPhase("done");
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

  const progress = Math.min(comparisonCount / hardCap, 1);

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

  if (!bootstrapped) {
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

        {phase === "comparing" ? (
          <>
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {comparisonCount}/{hardCap} comparisons
              </Text>
            </View>

            {currentLeft && currentRight ? (
              <View style={styles.pairsWrap}>
                <SubmissionImageCard
                  submission={currentLeft}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() => handlePickWinner(currentLeft.id)}
                />
                <SubmissionImageCard
                  submission={currentRight}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() => handlePickWinner(currentRight.id)}
                />
              </View>
            ) : (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            {stableTop3Count > 0 ? (
              <Text style={styles.hintText}>
                Top 3 stable streak: {stableTop3Count}/{TOP3_STABILITY_REQUIRED}
              </Text>
            ) : null}
          </>
        ) : null}

        {phase === "confirming" ? (
          <>
            <Text style={styles.sectionTitle}>Confirm your podium</Text>
            {comparisonCount < hardCap ? (
              <Text style={styles.successHint}>Mamy Twoje TOP 3!</Text>
            ) : null}
            <View style={styles.confirmList}>
              {finalTopThree.map((submission, index) => (
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
                onPress={startComparing}
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

        {phase === "done" ? (
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

        {phase === "blocked" ? (
          <View style={styles.blockedCard}>
            <Text style={styles.blockedTitle}>Voting unavailable</Text>
            <Text style={styles.blockedText}>
              {blockedReason ?? "Voting is not available right now."}
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
    borderColor: "rgba(14,165,233,0.35)",
    backgroundColor: "rgba(14,165,233,0.1)",
    padding: spacing.md,
    gap: spacing.xs,
  },
  staffProgressTitle: {
    color: "#7dd3fc",
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
    backgroundColor: "rgba(255,255,255,0.1)",
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
  voteCard: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  voteImageWrap: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "rgba(15,23,42,0.5)",
  },
  voteImage: {
    width: "100%",
    height: "100%",
  },
  voteImageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  voteImageFallbackText: {
    color: colors.textMuted,
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  voteCardBody: {
    padding: spacing.md,
    gap: 2,
  },
  voteCardTitle: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  voteCardGroup: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  voteCardSubtitle: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  successHint: {
    color: "#22c55e",
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
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
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
    backgroundColor: "#ef4444",
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
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.12)",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  doneTitle: {
    color: "#22c55e",
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
    borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: "rgba(239,68,68,0.12)",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  blockedTitle: {
    color: "#ef4444",
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
