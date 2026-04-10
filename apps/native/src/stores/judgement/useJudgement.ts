import { useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/graphql";
import { useStore } from "zustand";
import { judgementStore } from "./judgementStores";
import type { ReviewStatus, Submission } from "./judgementStores";

/**
 * Hook that replaces the old JudgementProvider + useJudgement pattern.
 * Uses Zustand store for local state and direct hooks for server state.
 *
 * Can be called with explicit params or without args (reads from store).
 */
export function useJudgement(
  explicitTripId?: string,
  explicitChallengeId?: string,
) {
  const trpc = useTRPC();
  const storeTripId = useStore(judgementStore, (s) => s.tripId);
  const storeChallengeId = useStore(judgementStore, (s) => s.challengeId);
  const dismissedIds = useStore(judgementStore, (s) => s.dismissedIds);
  const addDismissedId = useStore(judgementStore, (s) => s.addDismissedId);

  const tripId = explicitTripId ?? storeTripId;
  const challengeId = explicitChallengeId ?? storeChallengeId;

  const submissionsQuery = useQuery(
    trpc.challengeSubmission.getByChallenge.queryOptions(
      {
        tripId,
        challengeId,
      },
      { enabled: !!tripId && !!challengeId },
    ),
  );

  const challengeQuery = useQuery(
    trpc.challenge.getById.queryOptions(
      {
        id: challengeId,
        tripId,
      },
      { enabled: !!tripId && !!challengeId },
    ),
  );

  const reviewMutation = useMutation(
    trpc.challengeSubmission.review.mutationOptions({
      onError: (error) => {
        console.error(error);
      },
    }),
  );

  const submissions = submissionsQuery.data;
  const challenge = challengeQuery.data;
  const submissionsLoading = submissionsQuery.isLoading;
  const challengeLoading = challengeQuery.isLoading;

  const activeDismissedIds = useMemo(() => {
    if (!submissions) return dismissedIds;
    return dismissedIds.filter((id) =>
      submissions.some(
        (submission) => submission.id === id && submission.status === "PENDING",
      ),
    );
  }, [dismissedIds, submissions]);

  const pendingSubmissions: Submission[] = useMemo(() => {
    return (submissions ?? [])
      .filter((submission) => submission.status === "PENDING")
      .filter(
        (submission) => !activeDismissedIds.includes(submission.id),
      ) as Submission[];
  }, [submissions, activeDismissedIds]);

  const stats = useMemo(() => {
    const approved = (submissions ?? []).filter(
      (submission) => submission.status === "APPROVED",
    ).length;
    const rejected = (submissions ?? []).filter(
      (submission) => submission.status === "REJECTED",
    ).length;
    return { approved, rejected };
  }, [submissions]);

  const currentSubmission = pendingSubmissions[0] ?? null;
  const nextSubmission = pendingSubmissions[1] ?? null;

  const reviewCurrent = useCallback(
    (status: ReviewStatus, rejectionReason?: string, ranking?: 1 | 2 | 3) => {
      if (!currentSubmission || reviewMutation.isPending) return;
      const normalizedRejectionReason = rejectionReason?.trim();
      if (status === "REJECTED" && !normalizedRejectionReason) return;
      addDismissedId(currentSubmission.id);
      reviewMutation.mutate({
        id: currentSubmission.id,
        status,
        rejectionReason:
          status === "REJECTED" ? normalizedRejectionReason : undefined,
        ranking: status === "APPROVED" ? ranking : undefined,
      });
    },
    [currentSubmission, reviewMutation, addDismissedId],
  );

  return {
    tripId,
    challengeId,
    challengeName: challenge?.name ?? "Challenge Review",
    challengeScoringCategory: challenge?.scoringCategory ?? null,
    isLoading: submissionsLoading || challengeLoading,
    isReviewing: reviewMutation.isPending,
    pendingCount: pendingSubmissions.length,
    stats,
    currentSubmission,
    nextSubmission,
    reviewCurrent,
  };
}
