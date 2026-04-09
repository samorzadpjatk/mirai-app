import { useMemo } from "react";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@mirai-app/frameworks/trpc/client";

export interface ChallengeItem {
  id: string;
  title: string;
  description: string | null;
  basePoints: number;
  status: string;
  tripId: string;
}

const PAGE_SIZE = 30;

export function useAdminChallengesByTrip(tripId: string) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const challengeQueryKey = trpc.challenge.getAllByTrip.queryOptions({
    tripId,
  }).queryKey;
  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...challengeQueryKey, "infinite", PAGE_SIZE],
    enabled: !!tripId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return trpcClient.challenge.getAllByTrip.query({
        tripId,
        pagination: {
          limit: PAGE_SIZE,
          offset,
        },
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });

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
    trpc.challenge.delete.mutationOptions({
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
