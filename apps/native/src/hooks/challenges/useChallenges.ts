import { useCallback, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import {
  mapChallengeToListItem,
  countCompletedChallenges,
  calculateLeaderboardInfo,
  findUserGroup,
} from "@mirai-app/shared";
import { colors } from "~/styles";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

const PAGE_SIZE = 30;

export function buildChallengeQueryInput(tripId: string | null | undefined, pageParam: number) {
  const offset = pageParam || 0;
  return {
    tripId: tripId ?? "",
    pagination: {
      limit: PAGE_SIZE,
      offset,
    },
  };
}

export function getNextChallengePageParam(lastPage: {
  pagination: { hasMore: boolean; offset: number; limit: number };
}) {
  if (!lastPage.pagination.hasMore) {
    return undefined;
  }
  return lastPage.pagination.offset + lastPage.pagination.limit;
}

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

  interface DBChallenge {
    id: string;
    name: string;
    submissionType?:
      | "IMAGE"
      | "MULTI_IMAGE"
      | "VIDEO"
      | "TEXT"
      | "IMAGE_LOCATION"
      | "LOCATION"
      | "QR_CODE"
      | null;
    basePoints?: number | null;
    firstPlacePoints?: number | null;
    scoringCategory?: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING" | null;
    description?: string | null;
    image?: string | null;
    status?: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED" | null;
    participantGroupsCount?: number | null;
    myGroupSubmissionStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  }



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
