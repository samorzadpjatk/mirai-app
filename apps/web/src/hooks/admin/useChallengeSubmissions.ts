"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@repo/frameworks/trpc/client";

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

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseSubmissionStatus = (value: unknown): SubmissionStatus => {
  if (value === "APPROVED" || value === "REJECTED" || value === "PENDING") {
    return value;
  }

  return "PENDING";
};

const parseSubmission = (value: unknown): SubmissionItem | null => {
  if (!isObject(value) || typeof value.id !== "string") {
    return null;
  }

  const groupRaw = isObject(value.group) ? value.group : null;
  if (
    !groupRaw ||
    typeof groupRaw.id !== "string" ||
    typeof groupRaw.name !== "string"
  ) {
    return null;
  }

  const reviewedByRaw = isObject(value.reviewedBy) ? value.reviewedBy : null;
  const reviewedBy = reviewedByRaw
    ? {
        firstName:
          typeof reviewedByRaw.firstName === "string"
            ? reviewedByRaw.firstName
            : null,
        lastName:
          typeof reviewedByRaw.lastName === "string"
            ? reviewedByRaw.lastName
            : null,
        email:
          typeof reviewedByRaw.email === "string" ? reviewedByRaw.email : null,
      }
    : null;

  return {
    id: value.id,
    status: parseSubmissionStatus(value.status),
    ranking: typeof value.ranking === "number" ? value.ranking : null,
    imageIds: Array.isArray(value.imageIds)
      ? value.imageIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    videoId: typeof value.videoId === "string" ? value.videoId : null,
    textContent:
      typeof value.textContent === "string" ? value.textContent : null,
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : new Date().toISOString(),
    reviewedAt: typeof value.reviewedAt === "string" ? value.reviewedAt : null,
    rejectionReason:
      typeof value.rejectionReason === "string" ? value.rejectionReason : null,
    voteScore: typeof value.voteScore === "number" ? value.voteScore : 0,
    voteCount: typeof value.voteCount === "number" ? value.voteCount : 0,
    awardedPoints:
      typeof value.awardedPoints === "number" ? value.awardedPoints : 0,
    bonusPoints: typeof value.bonusPoints === "number" ? value.bonusPoints : 0,
    reviewedBy,
    group: {
      id: groupRaw.id,
      name: groupRaw.name,
      image: typeof groupRaw.image === "string" ? groupRaw.image : null,
    },
  };
};

export function useChallengeSubmissions(tripId: string, challengeId: string) {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const queryKey = ["challenge-submissions", tripId, challengeId] as const;

  const submissionsQuery = useQuery({
    queryKey,
    enabled: Boolean(tripId) && Boolean(challengeId),
    queryFn: async () => {
      const result =
        await trpcClient.challengeSubmission.getByChallengeForAdmin.query({
          tripId,
          challengeId,
        });

      if (!Array.isArray(result)) {
        return [] as SubmissionItem[];
      }

      return result
        .map(parseSubmission)
        .filter((item): item is SubmissionItem => item !== null);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => trpcClient.challengeSubmission.review.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...queryKey] });
      await queryClient.invalidateQueries({ queryKey: ["challenges", tripId] });
    },
  });

  const flagMutation = useMutation({
    mutationFn: (input: {
      submissionId: string;
      reason: string;
      details?: string;
    }) =>
      trpcClient.submissionReport.create.mutate({
        tripId,
        submissionId: input.submissionId,
        reason: input.reason,
        details: input.details,
      }),
  });

  return {
    submissions: submissionsQuery.data ?? [],
    isLoading: submissionsQuery.isLoading,
    isRefetching: submissionsQuery.isRefetching,
    refetch: submissionsQuery.refetch,
    reviewSubmission: reviewMutation.mutateAsync,
    isReviewing: reviewMutation.isPending,
    flagSubmission: flagMutation.mutateAsync,
    isFlagging: flagMutation.isPending,
  };
}
