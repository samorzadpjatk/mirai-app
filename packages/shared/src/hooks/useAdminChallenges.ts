"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

const CHALLENGES_PER_PAGE = 30;

export type ChallengeStatus =
  | "HIDDEN"
  | "VISIBLE"
  | "ACTIVE"
  | "VOTING_PHASE"
  | "COMPLETED"
  | "CANCELLED"
  | "draft";

export type ChallengeFilterStatus = "ALL" | ChallengeStatus;

export type ChallengeSortBy = "priority" | "name" | "newest" | "points";

export interface Challenge {
  id: string;
  tripId: string;
  name: string;
  title: string;
  description: string;
  status: ChallengeStatus;
  submissionType: string;
  scoringCategory: string;
  basePoints: number;
  points: number;
  category: string;
  icon: string;
  participantGroupsCount: number;
  pendingSubmissionsCount: number;
  createdAt: string | null;
}

interface ChallengesPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface ChallengesResponse {
  challenges: Challenge[];
  pagination: ChallengesPagination;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseStatus = (value: unknown): ChallengeStatus => {
  if (
    value === "HIDDEN" ||
    value === "VISIBLE" ||
    value === "ACTIVE" ||
    value === "VOTING_PHASE" ||
    value === "COMPLETED" ||
    value === "CANCELLED"
  ) {
    return value;
  }

  return "HIDDEN";
};

const parseChallenge = (value: unknown): Challenge | null => {
  if (!isObject(value) || typeof value.id !== "string") {
    return null;
  }

  if (typeof value.tripId !== "string" || typeof value.name !== "string") {
    return null;
  }

  return {
    id: value.id,
    tripId: value.tripId,
    name: value.name,
    title: typeof value.name === "string" ? value.name : "",
    description: typeof value.description === "string" ? value.description : "",
    status: parseStatus(value.status),
    submissionType:
      typeof value.submissionType === "string" ? value.submissionType : "IMAGE",
    scoringCategory:
      typeof value.scoringCategory === "string"
        ? value.scoringCategory
        : "JUDGED_STAFF",
    basePoints: typeof value.basePoints === "number" ? value.basePoints : 0,
    points: typeof value.basePoints === "number" ? value.basePoints : 0,
    category:
      typeof value.scoringCategory === "string"
        ? value.scoringCategory
        : "standard",
    icon:
      typeof (value as Record<string, unknown>).icon === "string"
        ? ((value as Record<string, unknown>).icon as string)
        : "star",
    participantGroupsCount:
      typeof value.participantGroupsCount === "number"
        ? value.participantGroupsCount
        : 0,
    pendingSubmissionsCount:
      typeof value.pendingSubmissionsCount === "number"
        ? value.pendingSubmissionsCount
        : 0,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
  };
};

const parseChallengesResponse = (value: unknown): ChallengesResponse => {
  if (!isObject(value)) {
    return {
      challenges: [],
      pagination: {
        total: 0,
        limit: CHALLENGES_PER_PAGE,
        offset: 0,
        hasMore: false,
      },
    };
  }

  const challengesRaw = Array.isArray(value.challenges) ? value.challenges : [];
  const challenges = challengesRaw
    .map(parseChallenge)
    .filter((item): item is Challenge => item !== null);

  const paginationRaw = isObject(value.pagination) ? value.pagination : {};

  return {
    challenges,
    pagination: {
      total:
        typeof paginationRaw.total === "number"
          ? paginationRaw.total
          : challenges.length,
      limit:
        typeof paginationRaw.limit === "number"
          ? paginationRaw.limit
          : CHALLENGES_PER_PAGE,
      offset:
        typeof paginationRaw.offset === "number" ? paginationRaw.offset : 0,
      hasMore: Boolean(paginationRaw.hasMore),
    },
  };
};

const statusPriority: Record<ChallengeStatus, number> = {
  ACTIVE: 0,
  VISIBLE: 1,
  VOTING_PHASE: 2,
  HIDDEN: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  draft: 6,
};

export function useAdminChallenges(
  tripId?: string,
  searchTerm: string = "",
  statusFilter: ChallengeFilterStatus = "ALL",
  sortBy: ChallengeSortBy = "priority",
) {
  const trpc = useTRPCClient();

  const {
    data,
    isLoading: challengesLoading,
    isRefetching: challengesRefetching,
    hasNextPage: challengesHasNextPage,
    isFetchingNextPage: challengesFetchingNextPage,
    fetchNextPage: fetchMoreChallenges,
    refetch: refetchChallenges,
  } = useInfiniteQuery({
    queryKey: ["challenges", tripId ?? "all"],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;

      const result = await trpc.challenge.getAllByTrip.query({
        tripId: tripId ?? "",
        pagination: {
          limit: CHALLENGES_PER_PAGE,
          offset,
        },
      });

      return parseChallengesResponse(result);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

  const allChallenges = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.challenges ?? []),
    [data?.pages],
  );

  const statusCounts = useMemo(
    () => ({
      HIDDEN: allChallenges.filter((item) => item.status === "HIDDEN").length,
      VISIBLE: allChallenges.filter((item) => item.status === "VISIBLE").length,
      ACTIVE: allChallenges.filter((item) => item.status === "ACTIVE").length,
      VOTING_PHASE: allChallenges.filter(
        (item) => item.status === "VOTING_PHASE",
      ).length,
      COMPLETED: allChallenges.filter((item) => item.status === "COMPLETED")
        .length,
      CANCELLED: allChallenges.filter((item) => item.status === "CANCELLED")
        .length,
    }),
    [allChallenges],
  );

  const challenges = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let next = allChallenges;

    if (statusFilter !== "ALL") {
      next = next.filter((item) => item.status === statusFilter);
    }

    if (normalizedSearch) {
      next = next.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch),
      );
    }

    return [...next].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "newest") {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }

      if (sortBy === "points") {
        return b.basePoints - a.basePoints;
      }

      const pendingDiff = b.pendingSubmissionsCount - a.pendingSubmissionsCount;
      if (pendingDiff !== 0) {
        return pendingDiff;
      }

      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return a.name.localeCompare(b.name);
    });
  }, [allChallenges, searchTerm, sortBy, statusFilter]);

  const challengesPagination = useMemo(
    () => data?.pages?.[data.pages.length - 1]?.pagination,
    [data],
  );

  const createChallenge = async (input: {
    tripId: string;
    title: string;
    description: string;
    points: number;
    category?: string;
    icon?: string;
    targetLatitude?: number;
    targetLongitude?: number;
  }) => {
    return trpc.challenge.create.mutate({
      tripId: input.tripId,
      name: input.title,
      description: input.description,
      basePoints: input.points,
      scoringCategory: "JUDGED_STAFF",
      submissionType: "IMAGE",
      targetLatitude: input.targetLatitude,
      targetLongitude: input.targetLongitude,
      status: "HIDDEN",
    });
  };

  const updateChallenge = async (
    id: string,
    input: Partial<{
      title: string;
      description: string;
      points: number;
      status: ChallengeStatus;
      tripId: string;
      category: string;
      icon: string;
    }>,
  ) => {
    return trpc.challenge.update.mutate({
      id,
      tripId: input.tripId ?? tripId ?? "",
      name: input.title,
      description: input.description,
      basePoints: input.points,
      status:
        input.status && input.status !== "draft" ? input.status : undefined,
      image: input.icon,
    });
  };

  return {
    challenges,
    allChallengesCount: allChallenges.length,
    statusCounts,
    challengesLoading,
    challengesPagination,
    challengesRefetching,
    challengesHasNextPage,
    challengesFetchingNextPage,
    fetchMoreChallenges,
    refetchChallenges,
    createChallenge,
    updateChallenge,
  };
}

export type AdminChallengeUI = Challenge;
