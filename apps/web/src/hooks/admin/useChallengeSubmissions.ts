"use client";

import { useMemo } from "react";
import { GraphQLClient } from "graphql-request";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetChallengeSubmissionsQuery,
  type GetChallengeSubmissionsQuery,
} from "@mirai-app/graphql-types";
import { env } from "../../lib/env";

const getAuthToken = () => {
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) =>
    c.trim().startsWith("sb-access-token="),
  );
  return tokenCookie ? tokenCookie.split("=")[1] : null;
};

const createGraphQLClient = () => {
  return new GraphQLClient(env.graphqlUrl, {
    headers: () => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return headers;
    },
  });
};

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
  const graphqlClient = useMemo(() => createGraphQLClient(), []);
  const queryClient = useQueryClient();

  const queryKey = useGetChallengeSubmissionsQuery.getKey({
    challengeId,
    tripId,
  });

  // Use generated GraphQL hook for submissions
  const submissionsQuery = useGetChallengeSubmissionsQuery(
    graphqlClient,
    {
      challengeId,
      tripId,
      limit: 100,
      offset: 0,
    },
    {
      enabled: Boolean(tripId) && Boolean(challengeId),
    },
  );

  const submissions = useMemo(
    () => parseSubmissionsFromQuery(submissionsQuery.data),
    [submissionsQuery.data],
  );

  // Review mutation using raw GraphQL
  const reviewMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => {
      const result = await graphqlClient.request<{
        reviewChallengeSubmission?: {
          submission?: {
            id: string;
            status: string;
          };
        };
      }>(REVIEW_SUBMISSION_MUTATION, {
        input: {
          submissionId: input.id,
          status: input.status,
          rejectionReason: input.rejectionReason,
        },
      });
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["challenges", tripId] });
    },
  });

  // Flag mutation using raw GraphQL
  const flagMutation = useMutation({
    mutationFn: async (input: {
      submissionId: string;
      reason: string;
      details?: string;
    }) => {
      const result = await graphqlClient.request<{
        createSubmissionReport?: {
          report?: {
            id: string;
          };
        };
      }>(CREATE_SUBMISSION_REPORT_MUTATION, {
        input: {
          tripId,
          submissionId: input.submissionId,
          reason: input.reason,
          details: input.details,
        },
      });
      return result;
    },
  });

  return {
    submissions,
    isLoading: submissionsQuery.isLoading,
    isRefetching: submissionsQuery.isRefetching,
    refetch: submissionsQuery.refetch,
    reviewSubmission: reviewMutation.mutateAsync,
    isReviewing: reviewMutation.isPending,
    flagSubmission: flagMutation.mutateAsync,
    isFlagging: flagMutation.isPending,
  };
}
