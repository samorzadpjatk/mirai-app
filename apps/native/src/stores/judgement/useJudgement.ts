import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetChallengeSubmissionsQuery,
  useUpdateChallengeSubmissionMutation,
  GetChallengeSubmissionsDocument,
  type ChallengeSubmission,
} from "@mirai-app/graphql-types";
import { graphqlClient } from "~/lib/graphql-client";
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
  const queryClient = useQueryClient();
  const storeTripId = useStore(judgementStore, (s) => s.tripId);
  const storeChallengeId = useStore(judgementStore, (s) => s.challengeId);
  const dismissedIds = useStore(judgementStore, (s) => s.dismissedIds);
  const addDismissedId = useStore(judgementStore, (s) => s.addDismissedId);

  const tripId = explicitTripId ?? storeTripId;
  const challengeId = explicitChallengeId ?? storeChallengeId;

  // GraphQL query for challenge submissions
  const submissionsQuery = useGetChallengeSubmissionsQuery(
    graphqlClient,
    {
      challengeId: challengeId ?? "",
      limit: 100,
      offset: 0,
    },
    { enabled: !!tripId && !!challengeId },
  );

  // Get challenge details using direct request (no generated hook available)
  const challengeQuery = useQuery({
    queryKey: ["GetChallenge", challengeId, tripId],
    queryFn: async () => {
      if (!challengeId || !tripId) return null;
      // Using graphqlClient.request for operations without generated hooks
      const result = await graphqlClient.request<{
        challenge: {
          id: string;
          name: string;
          scoringCategory: string;
        };
      }>(
        `
        query GetChallenge($id: ID!, $tripId: ID!) {
          challenge(id: $id, tripId: $tripId) {
            id
            name
            scoringCategory
          }
        }
        `,
        { id: challengeId, tripId },
      );
      return result.challenge;
    },
    enabled: !!tripId && !!challengeId,
  });

  // GraphQL mutation for reviewing submissions
  const reviewMutation = useUpdateChallengeSubmissionMutation(graphqlClient, {
    onError: (error: Error) => {
      console.error(error);
    },
    onSuccess: async () => {
      // Invalidate and refetch submissions
      await queryClient.invalidateQueries({
        queryKey: ["GetChallengeSubmissions", { challengeId }],
      });
    },
  });

  const submissions = submissionsQuery.data?.challengeSubmissions?.submissions;
  const challenge = challengeQuery.data;
  const submissionsLoading = submissionsQuery.isLoading;
  const challengeLoading = challengeQuery.isLoading;

  const activeDismissedIds = useMemo(() => {
    if (!submissions) return dismissedIds;
    return dismissedIds.filter((id) =>
      submissions.some(
        (submission: ChallengeSubmission) =>
          submission.id === id && submission.status === "PENDING",
      ),
    );
  }, [dismissedIds, submissions]);

  const pendingSubmissions: Submission[] = useMemo(() => {
    if (!submissions) return [];
    return submissions
      .filter(
        (submission: ChallengeSubmission) => submission.status === "PENDING",
      )
      .filter(
        (submission: ChallengeSubmission) =>
          !activeDismissedIds.includes(submission.id),
      )
      .map((submission: ChallengeSubmission) => ({
        id: submission.id,
        status: submission.status,
        imageIds: submission.imageIds ?? [],
        videoId: submission.videoId ?? null,
        textContent: submission.textContent ?? null,
        latitude: submission.latitude ?? null,
        longitude: submission.longitude ?? null,
        createdAt: submission.createdAt,
        group: {
          id: submission.group?.id ?? "",
          name: submission.group?.name ?? "",
          description: submission.group?.description ?? null,
          image: submission.group?.image ?? null,
        },
      }));
  }, [submissions, activeDismissedIds]);

  const stats = useMemo(() => {
    if (!submissions) return { approved: 0, rejected: 0 };
    const approved = submissions.filter(
      (submission: ChallengeSubmission) => submission.status === "APPROVED",
    ).length;
    const rejected = submissions.filter(
      (submission: ChallengeSubmission) => submission.status === "REJECTED",
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

      // Map to GraphQL reviewAction
      const reviewAction = status === "APPROVED" ? "APPROVE" : "REJECT";

      reviewMutation.mutate({
        input: {
          submissionId: currentSubmission.id,
          reviewAction,
          rejectionReason:
            status === "REJECTED" ? normalizedRejectionReason : undefined,
          ranking: status === "APPROVED" ? ranking : undefined,
        },
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
