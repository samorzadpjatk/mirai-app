import { orpc } from "@mirai-app/orpc/client";
import {
  type DBChallenge,
  buildChallengeQueryInput,
  countCompletedChallenges,
  getNextChallengePageParam,
  mapChallengeToListItem,
} from "@mirai-app/shared/challenges";
import {
  calculateLeaderboardInfo,
  findUserGroup,
} from "@mirai-app/shared/trips";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { ChallengeListItem } from "~/components/trips/challenges/types";
import { colors } from "~/styles";

export function useChallenges(tripId?: string | null) {
  const tripQuery = useQuery({
    ...orpc.trip.getById.queryOptions({ input: { id: tripId ?? "" } }),
    enabled: Boolean(tripId),
  });

  const challengesQuery = useInfiniteQuery(
    orpc.challenge.getAllByTrip.infiniteOptions({
      input: (pageParam: number) => buildChallengeQueryInput(tripId, pageParam),
      initialPageParam: 0,
      getNextPageParam: getNextChallengePageParam,
      enabled: Boolean(tripId),
    }),
  );

  const currentUserQuery = useQuery(orpc.user.getMy.queryOptions({ input: {} }));

  const { data: trip, isLoading: tripLoading } = tripQuery;
  const challengesData = useMemo(
    () => (challengesQuery.data?.pages ?? []).flatMap((page) => page.challenges ?? []),
    [challengesQuery.data?.pages],
  );
  const { isLoading: challengesLoading } = challengesQuery;
  const { data: currentUser } = currentUserQuery;

  const userGroup = useMemo(() => {
    if (!currentUser || !trip?.participants) return null;
    return findUserGroup(currentUser.id, trip.participants)?.group ?? null;
  }, [currentUser, trip]);

  const leaderboardInfo = useMemo(
    () => calculateLeaderboardInfo(userGroup, trip?.groups),
    [userGroup, trip],
  );

  const challenges = useMemo(() => {
    const apiChallenges = (challengesData ?? []) as DBChallenge[];
    return apiChallenges.map((dbChallenge) =>
      mapChallengeToListItem(dbChallenge, colors.primary),
    ) as ChallengeListItem[];
  }, [challengesData]);

  const completedChallengesCount = useMemo(
    () => countCompletedChallenges(challenges),
    [challenges],
  );

  const isRefreshing = tripQuery.isRefetching || challengesQuery.isRefetching;

  const refresh = useCallback(async () => {
    if (!tripId) return;
    await Promise.all([tripQuery.refetch(), challengesQuery.refetch()]);
  }, [challengesQuery, tripId, tripQuery]);

  return {
    trip,
    challenges,
    completedChallengesCount,
    isLoading: tripLoading || challengesLoading,
    isRefreshing,
    hasNextPage: challengesQuery.hasNextPage,
    isFetchingNextPage: challengesQuery.isFetchingNextPage,
    fetchNextPage: challengesQuery.fetchNextPage,
    refresh,
    userGroup,
    leaderboardInfo,
  };
}
