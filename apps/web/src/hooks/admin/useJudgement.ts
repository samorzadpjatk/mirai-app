"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@repo/frameworks/trpc/client";

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

export function useJudgement(tripId: string, challengeId: string) {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const challengeQuery = useQuery({
    queryKey: ["challenge", "details", challengeId, tripId],
    enabled: Boolean(tripId) && Boolean(challengeId),
    queryFn: async () => {
      const result = await trpcClient.challenge.getById.query({
        id: challengeId,
        tripId,
      });

      const parsed = parseChallenge(result);
      if (!parsed) {
        throw new Error("Invalid challenge payload.");
      }

      return parsed;
    },
  });

  const submissionsQuery = useQuery({
    queryKey: ["challenge", "admin-submissions", challengeId, tripId],
    enabled: Boolean(tripId) && Boolean(challengeId),
    queryFn: async () => {
      const result =
        await trpcClient.challengeSubmission.getByChallengeForAdmin.query({
          tripId,
          challengeId,
        });

      if (!Array.isArray(result)) {
        return [] as JudgementSubmission[];
      }

      return result
        .map(parseSubmission)
        .filter((submission): submission is JudgementSubmission =>
          Boolean(submission),
        );
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
      awardedPoints?: number;
      bonusPoints?: number;
      ranking?: 1 | 2 | 3;
    }) => trpcClient.challengeSubmission.review.mutate(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["challenge", "admin-submissions", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "details", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenges", tripId],
        }),
      ]);
    },
  });

  const completeChallengeMutation = useMutation({
    mutationFn: async () => {
      return trpcClient.challenge.update.mutate({
        id: challengeId,
        tripId,
        status: "COMPLETED",
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["challenge", "details", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "admin-submissions", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenges", tripId],
        }),
      ]);
    },
  });

  const submissions = submissionsQuery.data ?? [];
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
    challenge: challengeQuery.data,
    submissions,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    rankedSubmissions,
    isLoading: challengeQuery.isLoading || submissionsQuery.isLoading,
    isReviewing: reviewMutation.isPending,
    isCompleting: completeChallengeMutation.isPending,
    reviewSubmission: reviewMutation.mutateAsync,
    completeChallenge: completeChallengeMutation.mutateAsync,
  };
}
