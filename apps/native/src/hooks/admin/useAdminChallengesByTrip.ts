import { orpc } from "@mirai-app/orpc/client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export interface ChallengeItem {
  id: string;
  title: string;
  description: string | null;
  basePoints: number;
  status: string;
  tripId: string;
}

const PAGE_SIZE = 30;

export function buildAdminChallengeQueryInput(tripId: string, pageParam: number) {
  const offset = typeof pageParam === "number" ? pageParam : 0;
  return {
    tripId,
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextAdminChallengePageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

export function useAdminChallengesByTrip(tripId: string) {
  const queryClient = useQueryClient();

  const challengeQueryKey = orpc.challenge.getAllByTrip.queryOptions({
    input: { tripId },
  }).queryKey;
  const { data, isLoading, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(
      orpc.challenge.getAllByTrip.infiniteOptions({
        input: (pageParam: number) => buildAdminChallengeQueryInput(tripId, pageParam),
        initialPageParam: 0,
        getNextPageParam: getNextAdminChallengePageParam,
        enabled: !!tripId,
      }),
    );

  const challengesData = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.challenges ?? []),
    [data?.pages],
  );

  const challenges: ChallengeItem[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((challenge) => ({
      id: challenge.id,
      title: challenge.name,
      description: challenge.description ?? null,
      basePoints: challenge.basePoints ?? 0,
      status: challenge.status ?? "HIDDEN",
      tripId: challenge.tripId,
    }));
  }, [challengesData]);

  const deleteChallengeMutation = useMutation(
    orpc.challenge.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: challengeQueryKey });
      },
    }),
  );

  const deleteChallenge = (id: string) => {
    return deleteChallengeMutation.mutateAsync({ id, tripId });
  };

  const stats = useMemo(
    () => ({
      totalChallenges: challenges.length,
    }),
    [challenges],
  );

  return {
    challenges,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isDeleting: deleteChallengeMutation.isPending,
    deleteChallenge,
    stats,
  };
}
