import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengeSubmissionsDocument,
  UpdateChallengeSubmissionDocument,
  type ChallengeSubmission,
} from "@mirai-app/graphql-client";
import { useStore } from "zustand";
import { judgementStore } from "./judgementStores";
import type { ReviewStatus, Submission } from "./judgementStores";
import { clientLogger } from "@mirai-app/shared";

// Inline GraphQL document for GetChallenge
const GetChallengeDocument = `
  query GetChallenge($id: ID!, $tripId: ID!) {
    challenge(id: $id, tripId: $tripId) {
      id
      name
      scoringCategory
    }
  }
`;

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
  const client = useClient();
  const storeTripId = useStore(judgementStore, (s) => s.tripId);
  const storeChallengeId = useStore(judgementStore, (s) => s.challengeId);
  const dismissedIds = useStore(judgementStore, (s) => s.dismissedIds);
  const addDismissedId = useStore(judgementStore, (s) => s.addDismissedId);

  const tripId = explicitTripId ?? storeTripId;
  const challengeId = explicitChallengeId ?? storeChallengeId;

  // GraphQL query for challenge submissions
  const [{ data: submissionsData, fetching: submissionsFetching }] = useQuery({
    query: GetChallengeSubmissionsDocument,
    variables: {
      challengeId: challengeId ?? "",
      limit: 100,
      offset: 0,
    },
    pause: !tripId || !challengeId,
  });

  // Get challenge details using direct request (no generated hook available)
  const [{ data: challengeData, fetching: challengeFetching }] = useQuery<{
    challenge: {
      id: string;
      name: string;
      scoringCategory: string;
    } | null;
  }>({
    query: GetChallengeDocument,
    variables: { id: challengeId, tripId },
    pause: !tripId || !challengeId,
  });

  // GraphQL mutation for reviewing submissions
  const [, executeReview] = useMutation(UpdateChallengeSubmissionDocument);

  const submissions = submissionsData?.challengeSubmissions?.submissions;
  const challenge = challengeData?.challenge;
  const submissionsLoading = submissionsFetching;
  const challengeLoading = challengeFetching;

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
    async (
      status: ReviewStatus,
      rejectionReason?: string,
      ranking?: 1 | 2 | 3,
    ) => {
      if (!currentSubmission) return;
      const normalizedRejectionReason = rejectionReason?.trim();
      if (status === "REJECTED" && !normalizedRejectionReason) return;
      addDismissedId(currentSubmission.id);

      // Map to GraphQL reviewAction
      const reviewAction = status === "APPROVED" ? "APPROVE" : "REJECT";

      const result = await executeReview({
        input: {
          submissionId: currentSubmission.id,
          reviewAction,
          rejectionReason:
            status === "REJECTED" ? normalizedRejectionReason : undefined,
          ranking: status === "APPROVED" ? ranking : undefined,
        },
      });

      if (result.error) {
        clientLogger.error(
          "Failed to review challenge submission:",
          result.error as Error,
        );
      } else {
        // Invalidate and refetch submissions
        await client.invalidate("GetChallengeSubmissions", { challengeId });
      }
    },
    [currentSubmission, executeReview, addDismissedId, client, challengeId],
  );

  // Check if mutation is in progress
  const [, executeReviewState] = useMutation(UpdateChallengeSubmissionDocument);
  const isReviewing = false; // urql doesn't provide isPending directly, track manually if needed

  return {
    tripId,
    challengeId,
    challengeName: challenge?.name ?? "Challenge Review",
    challengeScoringCategory: challenge?.scoringCategory ?? null,
    isLoading: submissionsLoading || challengeLoading,
    isReviewing,
    pendingCount: pendingSubmissions.length,
    stats,
    currentSubmission,
    nextSubmission,
    reviewCurrent,
  };
}
