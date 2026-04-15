"use client";

import { useMemo, useCallback } from "react";
import { useClient } from "urql";
import {
  GetChallengeSubmissionsDocument,
  GetVotesByChallengeDocument,
  useGetChallengeQuery,
  useGetChallengeSubmissionsQuery,
  useGetVotesByChallengeQuery,
  useUpdateChallengeSubmissionMutation,
  useUpdateChallengeMutation,
  type GetChallengeSubmissionsQuery,
  type ReviewAction,
} from "@mirai-app/graphql-client/urql";

type ChallengeStatus =
  | "HIDDEN"
  | "VISIBLE"
  | "ACTIVE"
  | "VOTING_PHASE"
  | "COMPLETED"
  | "CANCELLED";

export interface JudgementChallenge {
  id: string;
  tripId: string;
  name: string;
  scoringCategory: string;
  status: ChallengeStatus;
  basePoints: number;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
}

export interface JudgementSubmission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  voteScore: number;
  voteCount: number;
  ranking: number | null;
  awardedPoints: number;
  bonusPoints: number;
  rejectionReason: string | null;
  createdAt: string;
  group: {
    id: string;
    name: string;
    image: string | null;
  };
}

const parseSubmissionsFromQuery = (
  data: GetChallengeSubmissionsQuery | undefined,
): JudgementSubmission[] => {
  if (!data?.challengeSubmissions?.submissions) return [];

  return data.challengeSubmissions.submissions
    .map((item) => {
      if (!item?.id || !item.group?.id || !item.group.name) return null;

      const status = item.status as JudgementSubmission["status"] | undefined;
      if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        return null;
      }

      return {
        id: item.id,
        status,
        imageIds: (item.imageIds?.filter(
          (id): id is string => typeof id === "string",
        ) ?? []) as string[],
        videoId: item.videoId ?? null,
        textContent: item.textContent ?? null,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        voteScore: item.voteScore ?? 0,
        voteCount: item.voteCount ?? 0,
        ranking: item.ranking ?? null,
        awardedPoints: item.awardedPoints ?? 0,
        bonusPoints: item.bonusPoints ?? 0,
        rejectionReason: item.rejectionReason ?? null,
        createdAt: item.createdAt ?? new Date().toISOString(),
        group: {
          id: item.group.id,
          name: item.group.name,
          image: item.group.image ?? null,
        },
      };
    })
    .filter((item): item is JudgementSubmission => item !== null);
};

export function useJudgement(tripId: string, challengeId: string) {
  const client = useClient();

  // Challenge query using generated hook
  const [challengeResult, reexecuteChallenge] = useGetChallengeQuery({
    variables: { id: challengeId, tripId },
    pause: !tripId || !challengeId,
  });

  const challenge = useMemo((): JudgementChallenge | null => {
    if (!challengeResult.data?.challenge) return null;

    const c = challengeResult.data.challenge;
    return {
      id: c.id,
      tripId: c.tripId,
      name: c.name,
      scoringCategory: c.scoringCategory,
      status: c.status as ChallengeStatus,
      basePoints: c.basePoints,
      firstPlacePoints: c.firstPlacePoints ?? null,
      secondPlacePoints: c.secondPlacePoints ?? null,
      thirdPlacePoints: c.thirdPlacePoints ?? null,
    };
  }, [challengeResult.data]);

  // Submissions query using generated hook
  const [submissionsResult, reexecuteSubmissions] =
    useGetChallengeSubmissionsQuery({
      variables: {
        challengeId,
        limit: 100,
        offset: 0,
      },
      pause: !challengeId,
    });

  // Votes query using generated hook
  const [votesResult] = useGetVotesByChallengeQuery({
    variables: { challengeId },
    pause: !challengeId,
  });

  // Review mutation using generated hook
  const [, reviewMutation] = useUpdateChallengeSubmissionMutation();

  const reviewSubmission = useCallback(
    async (input: {
      id: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
      awardedPoints?: number;
      bonusPoints?: number;
      ranking?: 1 | 2 | 3;
    }) => {
      const result = await reviewMutation({
        input: {
          submissionId: input.id,
          reviewAction: input.status as ReviewAction,
          rejectionReason: input.rejectionReason,
          awardedPoints: input.awardedPoints,
          bonusPoints: input.bonusPoints,
          ranking: input.ranking,
        },
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate related queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).invalidate(GetChallengeSubmissionsDocument, {
        challengeId,
        limit: 100,
        offset: 0,
      });

      return result.data;
    },
    [reviewMutation, client, challengeId],
  );

  // Complete challenge mutation using generated hook
  const [, completeChallengeMutation] = useUpdateChallengeMutation();

  const completeChallenge = useCallback(async () => {
    const result = await completeChallengeMutation({
      input: {
        id: challengeId,
        tripId,
      },
    });

    if (result.error) {
      throw result.error;
    }

    // Invalidate related queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).invalidate(GetChallengeSubmissionsDocument, {
      challengeId,
      limit: 100,
      offset: 0,
    });

    return result.data;
  }, [completeChallengeMutation, client, challengeId]);

  const submissions = useMemo(
    () => parseSubmissionsFromQuery(submissionsResult.data),
    [submissionsResult.data],
  );

  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "PENDING",
  );
  const approvedSubmissions = submissions.filter(
    (submission) => submission.status === "APPROVED",
  );
  const rejectedSubmissions = submissions.filter(
    (submission) => submission.status === "REJECTED",
  );

  const rankedSubmissions = [...submissions].sort((a, b) => {
    const byRanking = (a.ranking ?? 999) - (b.ranking ?? 999);
    if (byRanking !== 0) return byRanking;
    const byVoteScore = b.voteScore - a.voteScore;
    if (byVoteScore !== 0) return byVoteScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    challenge,
    submissions,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    rankedSubmissions,
    votes: votesResult.data?.votesByChallenge?.votes ?? [],
    isLoading: challengeResult.fetching || submissionsResult.fetching,
    isReviewing: challengeResult.fetching,
    isCompleting: challengeResult.fetching,
    reviewSubmission,
    completeChallenge,
    refetchSubmissions: reexecuteSubmissions,
    refetchChallenge: reexecuteChallenge,
  };
}
