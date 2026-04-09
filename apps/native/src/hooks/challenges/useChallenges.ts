import { useCallback, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@mirai-app/frameworks/trpc/client";
import { colors } from "~/styles";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

const PAGE_SIZE = 30;

export function useChallenges(tripId?: string | null) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();

  const tripQuery = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? "" }),
    enabled: Boolean(tripId),
  });

  const challengesQuery = useInfiniteQuery({
    queryKey: [
      ...trpc.challenge.getAllByTrip.queryOptions({ tripId: tripId ?? "" })
        .queryKey,
      "infinite",
      PAGE_SIZE,
    ],
    enabled: Boolean(tripId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return trpcClient.challenge.getAllByTrip.query({
        tripId: tripId ?? "",
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

  const currentUserQuery = useQuery(trpc.user.getMy.queryOptions());

  const { data: trip, isLoading: tripLoading } = tripQuery;
  const challengesData = useMemo(
    () =>
      (challengesQuery.data?.pages ?? []).flatMap(
        (page) => page.challenges ?? [],
      ),
    [challengesQuery.data?.pages],
  );
  const { isLoading: challengesLoading } = challengesQuery;
  const { data: currentUser } = currentUserQuery;

  const userGroup = useMemo(() => {
    if (!currentUser || !trip?.participants) return null;
    const participant = trip.participants.find(
      (p) => p.user.id === currentUser.id,
    );
    return participant?.group ?? null;
  }, [currentUser, trip]);

  const leaderboardInfo = useMemo(() => {
    if (!userGroup || !trip?.groups) return null;

    const sortedGroups = [...trip.groups].sort(
      (a, b) => (b.coins ?? 0) - (a.coins ?? 0),
    );
    const position = sortedGroups.findIndex((g) => g.id === userGroup.id) + 1;

    let pointsDifference = 0;
    let targetPosition: number | null = null;
    let targetGroupName: string | null = null;
    if (position === 1 && sortedGroups.length > 1) {
      const secondPlace = sortedGroups[1];
      pointsDifference = (userGroup.coins ?? 0) - (secondPlace?.coins ?? 0);
      targetPosition = 2;
      targetGroupName = secondPlace?.name ?? null;
    } else if (position > 1) {
      const groupAhead = sortedGroups[position - 2];
      pointsDifference = (groupAhead?.coins ?? 0) - (userGroup.coins ?? 0);
      targetPosition = position - 1;
      targetGroupName = groupAhead?.name ?? null;
    }

    return {
      position,
      pointsDifference,
      totalGroups: sortedGroups.length,
      targetPosition,
      targetGroupName,
    };
  }, [userGroup, trip]);

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
    scoringCategory?:
      | "SPEED"
      | "UNLIMITED"
      | "JUDGED_STAFF"
      | "PEER_VOTING"
      | null;
    description?: string | null;
    image?: string | null;
    status?:
      | "HIDDEN"
      | "VISIBLE"
      | "ACTIVE"
      | "VOTING_PHASE"
      | "COMPLETED"
      | "CANCELLED"
      | null;
    participantGroupsCount?: number | null;
    myGroupSubmissionStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  }

  const challenges: ChallengeListItem[] = useMemo(() => {
    const apiChallenges = (challengesData ?? []) as DBChallenge[];

    return apiChallenges.map((dbChallenge) => {
      const rawStatus = dbChallenge.status ?? "HIDDEN";
      const mySubmissionStatus = dbChallenge.myGroupSubmissionStatus ?? null;

      const cardStatus: ChallengeListItem["status"] =
        rawStatus === "HIDDEN" || rawStatus === "CANCELLED"
          ? "locked"
          : mySubmissionStatus === "APPROVED"
            ? "solved"
            : mySubmissionStatus === "PENDING"
              ? "submitted"
              : mySubmissionStatus === "REJECTED"
                ? "rejected"
                : rawStatus === "VOTING_PHASE"
                  ? "locked"
                  : rawStatus === "COMPLETED"
                    ? "completed"
                    : rawStatus === "VISIBLE"
                      ? "visible"
                      : "to_solve";

      const basePoints = dbChallenge.basePoints ?? 0;
      const maxPoints =
        dbChallenge.scoringCategory === "UNLIMITED"
          ? basePoints
          : (dbChallenge.firstPlacePoints ?? basePoints);

      return {
        id: dbChallenge.id,
        title: dbChallenge.name,
        points: maxPoints,
        icon: "trophy",
        iconColor: colors.primary,
        status: cardStatus,
        submissionType: dbChallenge.submissionType ?? "IMAGE",
        scoringCategory: dbChallenge.scoringCategory ?? undefined,
        lifecycleStatus: rawStatus,
        description: dbChallenge.description ?? undefined,
        image: dbChallenge.image ?? undefined,
        participantGroupsCount: dbChallenge.participantGroupsCount ?? 0,
      } as ChallengeListItem;
    });
  }, [challengesData]);

  const completedChallengesCount = useMemo(
    () =>
      challenges.filter(
        (challenge) =>
          challenge.status === "solved" || challenge.status === "submitted",
      ).length,
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
