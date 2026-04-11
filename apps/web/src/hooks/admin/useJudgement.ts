"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengeSubmissionsDocument,
  GetVotesByChallengeDocument,
  type GetChallengeSubmissionsQuery,
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

// GraphQL query to get challenge by ID
const GET_CHALLENGE_QUERY = `
  query GetChallenge($id: ID!, $tripId: ID!) {
    challenge(id: $id, tripId: $tripId) {
      id
      name
      scoringCategory
      status
      basePoints
      firstPlacePoints
      secondPlacePoints
      thirdPlacePoints
    }
  }
`;

// GraphQL mutation for reviewing submissions
const REVIEW_SUBMISSION_MUTATION = `
  mutation ReviewChallengeSubmission($input: ReviewChallengeSubmissionInput!) {
    reviewChallengeSubmission(input: $input) {
      submission {
        id
        status
        rejectionReason
        awardedPoints
        bonusPoints
        ranking
      }
    }
  }
`;

// GraphQL mutation for updating challenge status
const UPDATE_CHALLENGE_MUTATION = `
  mutation UpdateChallenge($input: UpdateChallengeInput!) {
    updateChallenge(input: $input) {
      challenge {
        id
        status
      }
    }
  }
`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseChallenge = (value: unknown): JudgementChallenge | null => {
  if (!isObject(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.tripId !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  const status = value.status;
  const validStatus: ChallengeStatus =
    status === "HIDDEN" ||
    status === "VISIBLE" ||
    status === "ACTIVE" ||
    status === "VOTING_PHASE" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
      ? status
      : "HIDDEN";

  return {
    id: value.id,
    tripId: value.tripId,
    name: value.name,
    scoringCategory:
      typeof value.scoringCategory === "string"
        ? value.scoringCategory
        : "SPEED",
    status: validStatus,
    basePoints: typeof value.basePoints === "number" ? value.basePoints : 0,
    firstPlacePoints:
      typeof value.firstPlacePoints === "number"
        ? value.firstPlacePoints
        : null,
    secondPlacePoints:
      typeof value.secondPlacePoints === "number"
        ? value.secondPlacePoints
        : null,
    thirdPlacePoints:
      typeof value.thirdPlacePoints === "number"
        ? value.thirdPlacePoints
        : null,
  };
};

const parseSubmission = (value: unknown): JudgementSubmission | null => {
  if (!isObject(value) || typeof value.id !== "string") {
    return null;
  }

  const group = isObject(value.group) ? value.group : null;
  if (
    !group ||
    typeof group.id !== "string" ||
    typeof group.name !== "string"
  ) {
    return null;
  }

  const statusRaw = value.status;
  const status: JudgementSubmission["status"] =
    statusRaw === "APPROVED" ||
    statusRaw === "REJECTED" ||
    statusRaw === "PENDING"
      ? statusRaw
      : "PENDING";

  return {
    id: value.id,
    status,
    imageIds: Array.isArray(value.imageIds)
      ? value.imageIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    videoId: typeof value.videoId === "string" ? value.videoId : null,
    textContent:
      typeof value.textContent === "string" ? value.textContent : null,
    latitude: typeof value.latitude === "number" ? value.latitude : null,
    longitude: typeof value.longitude === "number" ? value.longitude : null,
    voteScore: typeof value.voteScore === "number" ? value.voteScore : 0,
    voteCount: typeof value.voteCount === "number" ? value.voteCount : 0,
    ranking: typeof value.ranking === "number" ? value.ranking : null,
    awardedPoints:
      typeof value.awardedPoints === "number" ? value.awardedPoints : 0,
    bonusPoints: typeof value.bonusPoints === "number" ? value.bonusPoints : 0,
    rejectionReason:
      typeof value.rejectionReason === "string" ? value.rejectionReason : null,
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : new Date().toISOString(),
    group: {
      id: group.id,
      name: group.name,
      image: typeof group.image === "string" ? group.image : null,
    },
  };
};

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

  // Challenge query using urql
  const [challengeResult, reexecuteChallenge] = useQuery({
    query: GET_CHALLENGE_QUERY,
    variables: { id: challengeId, tripId },
    pause: !tripId || !challengeId,
  });

  const challenge = useMemo(() => {
    if (!challengeResult.data?.challenge) return null;
    return parseChallenge(challengeResult.data.challenge);
  }, [challengeResult.data]);

  // Submissions query using urql
  const [submissionsResult, reexecuteSubmissions] = useQuery({
    query: GetChallengeSubmissionsDocument,
    variables: {
      challengeId,
      tripId,
      limit: 100,
      offset: 0,
    },
    pause: !tripId || !challengeId,
  });

  // Votes query using urql
  const [votesResult] = useQuery({
    query: GetVotesByChallengeDocument,
    variables: { challengeId },
    pause: !challengeId,
  });

  // Review mutation using urql
  const [, reviewMutation] = useMutation(REVIEW_SUBMISSION_MUTATION);

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
          status: input.status,
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
      client.invalidate(GetChallengeSubmissionsDocument, {
        challengeId,
        tripId,
        limit: 100,
        offset: 0,
      });

      return result.data;
    },
    [reviewMutation, client, challengeId, tripId],
  );

  // Complete challenge mutation using urql
  const [, completeChallengeMutation] = useMutation(UPDATE_CHALLENGE_MUTATION);

  const completeChallenge = useCallback(async () => {
    const result = await completeChallengeMutation({
      input: {
        id: challengeId,
        tripId,
        status: "COMPLETED",
      },
    });

    if (result.error) {
      throw result.error;
    }

    // Invalidate related queries
    client.invalidate(GetChallengeSubmissionsDocument, {
      challengeId,
      tripId,
      limit: 100,
      offset: 0,
    });

    return result.data;
  }, [completeChallengeMutation, client, challengeId, tripId]);

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
