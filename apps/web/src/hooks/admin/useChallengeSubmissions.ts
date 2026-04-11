"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengeSubmissionsDocument,
  type GetChallengeSubmissionsQuery,
} from "@mirai-app/graphql-client/urql";

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SubmissionItem {
  id: string;
  status: SubmissionStatus;
  ranking: number | null;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  voteScore: number;
  voteCount: number;
  awardedPoints: number;
  bonusPoints: number;
  reviewedBy: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  group: {
    id: string;
    name: string;
    image: string | null;
  };
}

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

// GraphQL mutation for creating submission reports (flagging)
const CREATE_SUBMISSION_REPORT_MUTATION = `
  mutation CreateSubmissionReport($input: CreateSubmissionReportInput!) {
    createSubmissionReport(input: $input) {
      report {
        id
      }
    }
  }
`;

const parseSubmissionStatus = (value: string): SubmissionStatus => {
  if (value === "APPROVED" || value === "REJECTED" || value === "PENDING") {
    return value;
  }
  return "PENDING";
};

const parseSubmissionsFromQuery = (
  data: GetChallengeSubmissionsQuery | undefined,
): SubmissionItem[] => {
  if (!data?.challengeSubmissions?.submissions) return [];

  return data.challengeSubmissions.submissions
    .map((item) => {
      if (!item?.id || !item.group?.id || !item.group.name) return null;

      const reviewedBy = item.reviewedBy
        ? {
            firstName: item.reviewedBy.firstName ?? null,
            lastName: item.reviewedBy.lastName ?? null,
            email: item.reviewedBy.email ?? null,
          }
        : null;

      return {
        id: item.id,
        status: parseSubmissionStatus(item.status),
        ranking: item.ranking ?? null,
        imageIds: (item.imageIds?.filter(
          (id): id is string => typeof id === "string",
        ) ?? []) as string[],
        videoId: item.videoId ?? null,
        textContent: item.textContent ?? null,
        createdAt: item.createdAt ?? new Date().toISOString(),
        reviewedAt: item.reviewedAt ?? null,
        rejectionReason: item.rejectionReason ?? null,
        voteScore: item.voteScore ?? 0,
        voteCount: item.voteCount ?? 0,
        awardedPoints: item.awardedPoints ?? 0,
        bonusPoints: item.bonusPoints ?? 0,
        reviewedBy,
        group: {
          id: item.group.id,
          name: item.group.name,
          image: item.group.image ?? null,
        },
      };
    })
    .filter((item): item is SubmissionItem => item !== null);
};

export function useChallengeSubmissions(tripId: string, challengeId: string) {
  const client = useClient();

  // Use urql's useQuery hook for submissions
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

  const submissions = useMemo(
    () => parseSubmissionsFromQuery(submissionsResult.data),
    [submissionsResult.data],
  );

  // Review mutation using urql
  const [, reviewMutation] = useMutation(REVIEW_SUBMISSION_MUTATION);

  const reviewSubmission = useCallback(
    async (input: {
      id: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => {
      const result = await reviewMutation({
        input: {
          submissionId: input.id,
          status: input.status,
          rejectionReason: input.rejectionReason,
        },
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate cache after successful review
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

  // Flag mutation using urql
  const [, flagMutation] = useMutation(CREATE_SUBMISSION_REPORT_MUTATION);

  const flagSubmission = useCallback(
    async (input: {
      submissionId: string;
      reason: string;
      details?: string;
    }) => {
      const result = await flagMutation({
        input: {
          tripId,
          submissionId: input.submissionId,
          reason: input.reason,
          details: input.details,
        },
      });

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    [flagMutation, tripId],
  );

  return {
    submissions,
    isLoading: submissionsResult.fetching,
    isRefetching: submissionsResult.stale && submissionsResult.fetching,
    refetch: reexecuteSubmissions,
    reviewSubmission,
    isReviewing: submissionsResult.fetching,
    flagSubmission,
    isFlagging: submissionsResult.fetching,
  };
}
