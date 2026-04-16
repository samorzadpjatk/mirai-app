"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useClient } from "urql";
import {
  GetChallengeSubmissionsDocument,
  type GetChallengeSubmissionsQuery,
  useUpdateChallengeSubmissionMutation,
  useCreateSubmissionReportMutation,
  ReviewAction,
  SubmissionStatus,
  type ReportReason,
} from "@mirai-app/frameworks/graphql/urql";

export { SubmissionStatus };

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
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  group: {
    id: string;
    name: string;
    image: string | null;
  };
}

const parseSubmissionStatus = (value: string): SubmissionStatus => {
  switch (value) {
    case "APPROVED":
      return SubmissionStatus.Approved;
    case "REJECTED":
      return SubmissionStatus.Rejected;
    case "PENDING":
    default:
      return SubmissionStatus.Pending;
  }
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
            firstName: item.reviewedBy.firstName,
            lastName: item.reviewedBy.lastName,
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
    .filter((item): item is NonNullable<typeof item> => item !== null);
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

  // Review mutation using generated hook
  const [, reviewMutation] = useUpdateChallengeSubmissionMutation();

  const reviewSubmission = useCallback(
    async (input: {
      id: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => {
      const result = await reviewMutation({
        input: {
          submissionId: input.id,
          reviewAction:
            input.status === "APPROVED"
              ? ReviewAction.Approve
              : ReviewAction.Reject,
          rejectionReason: input.rejectionReason,
        },
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate cache after successful review
      (client as any).invalidate(GetChallengeSubmissionsDocument, {
        challengeId,
        tripId,
        limit: 100,
        offset: 0,
      });

      return result.data;
    },
    [reviewMutation, client, challengeId, tripId],
  );

  // Flag mutation using generated hook
  const [, flagMutation] = useCreateSubmissionReportMutation();

  const flagSubmission = useCallback(
    async (input: {
      submissionId: string;
      reason: string;
      details?: string;
    }) => {
      // Map string reason to ReportReason enum
      const reasonEnum = input.reason
        .toUpperCase()
        .replace(/\s+/g, "_") as ReportReason;

      const result = await flagMutation({
        input: {
          submissionId: input.submissionId,
          reason: reasonEnum,
          details: input.details,
        },
      });

      if (result.error) {
        throw result.error;
      }

      return result.data;
    },
    [flagMutation],
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
