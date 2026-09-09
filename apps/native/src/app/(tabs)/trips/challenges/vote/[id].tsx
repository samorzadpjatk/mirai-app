import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DeckBackground } from "~/components/common/DeckBackground";
import { ChallengeLoadingState } from "~/components/trips/challenges/ChallengeLoadingState";
import { ChallengeNotFoundState } from "~/components/trips/challenges/ChallengeNotFoundState";
import { SubmissionMediaCard } from "~/components/voting/SubmissionMediaCard";
import { useTripDetails } from "~/hooks/trips";
import { buildVotingDeck, useVotingDeck } from "~/hooks/voting/useVotingDeck";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import { borderRadius, colors, spacing, typography } from "../../../../../styles";

const PODIUM_POINTS = [3, 2, 1] as const;

/** A vote already exists for this user, so the podium is settled rather than broken. */
const isAlreadyVotedError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("oddales juz glos") || message.includes("already voted");
};

export default function ChallengePeerVotingScreen() {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const challengeId = typeof params.id === "string" ? params.id : params.id?.[0];
  const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  const { tripId: resolvedTripId, isTripPast } = useTripDetails(tripId);

  const challengeQuery = orpc.challenge.getById.queryOptions({
    input: {
      id: challengeId ?? "",
      tripId: resolvedTripId,
    },
  });
  const submissionsQuery = orpc.challengeSubmission.getByChallenge.queryOptions({
    input: {
      challengeId: challengeId ?? "",
      tripId: resolvedTripId,
    },
  });
  const myVotesQuery = orpc.challengeVote.getMyByChallenge.queryOptions({
    input: {
      challengeId: challengeId ?? "",
      tripId: resolvedTripId,
    },
  });

  const { data: challenge, isLoading: isLoadingChallenge } = useQuery({
    ...challengeQuery,
    enabled: !!challengeId && !!tripId,
  });
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    ...submissionsQuery,
    enabled: !!challengeId && !!tripId,
  });
  const { data: myVotes, isLoading: isLoadingVotes } = useQuery({
    ...myVotesQuery,
    enabled: !!challengeId && !!tripId,
  });
  const { data: meWithGroup, isLoading: isLoadingMeWithGroup } = useQuery({
    ...orpc.user.getMyWithGroup.queryOptions({ input: { tripId: resolvedTripId } }),
    enabled: !!tripId,
  });

  useEffect(() => {
    if (isTripPast && challengeId && tripId) {
      router.replace({
        pathname: "/trips/challenges/[id]",
        params: {
          id: challengeId,
          tripId: tripId,
        },
      });
    }
  }, [isTripPast, challengeId, tripId, router]);

  // One atomic mutation carrying the whole podium. Submitting the three positions as
  // separate concurrent calls raced on the server and corrupted the ranking.
  const submitVotesMutation = useMutation(orpc.challengeVote.submitVotes.mutationOptions());

  const ownGroupId = meWithGroup?.trips?.[0]?.group?.id ?? null;

  const votingSubmissions = useMemo(
    () => buildVotingDeck(submissionsData, { excludeGroupId: ownGroupId, requireMedia: true }),
    [submissionsData, ownGroupId],
  );

  const voting = useVotingDeck({ votingSubmissions });
  const bootstrapRef = useRef({ pending: false, completed: false });

  const navigateBackToChallenge = useCallback(() => {
    router.replace({
      pathname: "/trips/challenges/[id]",
      params: {
        id: challengeId ?? "",
        tripId: resolvedTripId,
      },
    });
  }, [challengeId, router, resolvedTripId]);

  const shouldRedirectToChallengeDetails = Boolean(
    challengeId &&
      tripId &&
      challenge &&
      (challenge.scoringCategory !== "PEER_VOTING" || challenge.status !== "VOTING_PHASE"),
  );

  useEffect(() => {
    if (!shouldRedirectToChallengeDetails) return;
    navigateBackToChallenge();
  }, [navigateBackToChallenge, shouldRedirectToChallengeDetails]);

  const { blockVoting, completeVoting, startComparing } = voting;
  const hasAlreadyVoted = (myVotes?.length ?? 0) > 0;
  const minSubmissionsToVote = voting.MIN_SUBMISSIONS_TO_VOTE;

  // Handle bootstrap logic in a microtask to avoid synchronous setState in effect
  useEffect(() => {
    if (!challengeId || !tripId) return;
    if (isLoadingChallenge || isLoadingSubmissions || isLoadingVotes || isLoadingMeWithGroup) {
      return;
    }

    if (!challenge) return;

    if (challenge.scoringCategory !== "PEER_VOTING" || challenge.status !== "VOTING_PHASE") {
      return;
    }

    if (bootstrapRef.current.completed || bootstrapRef.current.pending) return;

    bootstrapRef.current.pending = true;

    queueMicrotask(() => {
      // Votes cannot be changed once cast, so show the confirmation instead of
      // silently bouncing the user back to the challenge with no feedback.
      if (hasAlreadyVoted) {
        completeVoting();
      } else if (votingSubmissions.length < minSubmissionsToVote) {
        blockVoting(
          `At least ${minSubmissionsToVote} approved submissions are required. Voting starts automatically after moderation and after submissions end. Eligible now: ${votingSubmissions.length}.`,
        );
      } else {
        startComparing();
      }

      bootstrapRef.current.completed = true;
      bootstrapRef.current.pending = false;
    });
  }, [
    blockVoting,
    challenge,
    challengeId,
    completeVoting,
    hasAlreadyVoted,
    isLoadingChallenge,
    isLoadingMeWithGroup,
    isLoadingSubmissions,
    isLoadingVotes,
    minSubmissionsToVote,
    startComparing,
    tripId,
    votingSubmissions.length,
  ]);

  const handleSubmitPodium = async () => {
    if (!tripId || !challengeId || voting.finalTopThree.length < minSubmissionsToVote) {
      return;
    }

    const votesPayload = voting.finalTopThree
      .slice(0, PODIUM_POINTS.length)
      .map((submission, index) => ({
        submissionId: submission.id,
        votePosition: index + 1,
        votePoints: PODIUM_POINTS[index] ?? 1,
      }));

    try {
      await submitVotesMutation.mutateAsync({
        tripId,
        challengeId,
        votes: votesPayload,
      });

      await queryClient.invalidateQueries({ queryKey: myVotesQuery.queryKey });
      await queryClient.invalidateQueries({ queryKey: submissionsQuery.queryKey });
      completeVoting();
    } catch (error) {
      if (isAlreadyVotedError(error)) {
        await queryClient.invalidateQueries({ queryKey: myVotesQuery.queryKey });
        completeVoting();
        return;
      }
      const message = error instanceof Error ? error.message : "Failed to submit votes";
      blockVoting(message);
    }
  };

  const progress = voting.progress;
  const currentLeft = voting.currentLeft;
  const currentRight = voting.currentRight;

  if (!challengeId || !tripId || isLoadingChallenge || shouldRedirectToChallengeDetails) {
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
      <DeckBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 96 }]}
      >
        <Text style={styles.title}>{challenge.name}</Text>
        <Text style={styles.subtitle}>Peer voting</Text>

        {voting.phase === "comparing" ? (
          <>
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                {voting.comparisonCount}/{voting.hardCap} comparisons
              </Text>
            </View>

            {currentLeft && currentRight ? (
              <View style={styles.pairsWrap}>
                <SubmissionMediaCard
                  submission={currentLeft}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() => voting.handlePickWinner(currentLeft.id)}
                />
                <SubmissionMediaCard
                  submission={currentRight}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() => voting.handlePickWinner(currentRight.id)}
                />
              </View>
            ) : (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={palette.primary} />
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
                <SubmissionMediaCard
                  key={`${submission.id}-${index + 1}`}
                  submission={submission}
                  title={`#${index + 1}`}
                  subtitle={
                    (PODIUM_POINTS[index] ?? 1) === 1
                      ? "1 point"
                      : `${PODIUM_POINTS[index] ?? 1} points`
                  }
                />
              ))}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionGhost]}
                onPress={startComparing}
                disabled={submitVotesMutation.isPending}
              >
                <Text style={styles.actionGhostText}>Vote Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirm-podium-button"
                style={[styles.actionButton, styles.actionPrimary]}
                onPress={() => void handleSubmitPodium()}
                disabled={submitVotesMutation.isPending}
              >
                <Text style={styles.actionPrimaryText}>
                  {submitVotesMutation.isPending ? "Submitting..." : "Confirm Podium"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {voting.phase === "done" ? (
          <View testID="vote-submitted-card" style={styles.doneCard}>
            <Text style={styles.doneTitle}>Vote submitted</Text>
            <Text style={styles.doneText}>
              Your podium was saved. Votes cannot be changed, and results are published once voting
              ends.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary, styles.doneButton]}
              onPress={navigateBackToChallenge}
            >
              <Text style={styles.actionPrimaryText}>Back to challenge</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {voting.phase === "blocked" ? (
          <View style={styles.blockedCard}>
            <Text style={styles.blockedTitle}>Voting unavailable</Text>
            <Text style={styles.blockedText}>
              {voting.blockedReason ||
                "Voting is not available right now. It starts automatically after moderation and after the submission phase ends."}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary, styles.doneButton]}
              onPress={navigateBackToChallenge}
            >
              <Text style={styles.actionPrimaryText}>Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
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
      color: palette.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontSize: typography.xs,
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
      backgroundColor: palette.primary,
    },
    progressLabel: {
      color: palette.textMuted,
      fontSize: typography.xs,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    pairsWrap: {
      gap: spacing.md,
    },
    hintText: {
      color: palette.textMuted,
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
      backgroundColor: palette.primary,
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
    },
    centerState: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
  });
