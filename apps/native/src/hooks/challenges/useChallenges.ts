import { useCallback, useMemo, useState } from "react";
import { useQuery } from "urql";
import {
  GetChallengesByTripDocument,
  GetCurrentUserDocument,
  GetGroupsByTripDocument,
} from "@mirai-app/graphql-client";
import { colors } from "~/styles";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

const PAGE_SIZE = 20;

/**
 * Hook for fetching paginated challenges for a trip.
 * Uses GetChallengesByTripDocument with offset-based pagination.
 */
export function useChallenges(tripId?: string | null) {
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [allChallenges, setAllChallenges] = useState<
    ChallengeSummaryChallenge[]
  >([]);

  // Fetch paginated challenges
  const [{ data: challengesData, fetching: challengesLoading }] = useQuery({
    query: GetChallengesByTripDocument,
    variables: {
      tripId: tripId ?? "",
      limit: PAGE_SIZE,
      offset: offset,
    },
    pause: !tripId,
  });

  // Fetch current user
  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
  });

  // Fetch groups for leaderboard (optional, for future use)
  const [{ data: groupsData }] = useQuery({
    query: GetGroupsByTripDocument,
    variables: {
      tripId: tripId ?? "",
      pagination: { limit: 100, offset: 0 },
    },
    pause: !tripId,
  });

  // Append new challenges when data changes
  useMemo(() => {
    const newChallenges =
      (challengesData?.challengesByTrip
        ?.challenges as unknown as ChallengeSummaryChallenge[]) ?? [];

    if (offset === 0) {
      // First page - replace all
      setAllChallenges(newChallenges);
    } else {
      // Subsequent page - append only new items
      setAllChallenges((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const uniqueNew = newChallenges.filter((c) => !existingIds.has(c.id));
        return [...prev, ...uniqueNew];
      });
    }
  }, [challengesData, offset]);

  const currentUser = currentUserData?.me;

  // Calculate user's group from groups data
  const userGroup = useMemo(() => {
    if (!currentUser || !groupsData?.groupsByTrip?.groups) return null;
    return null;
  }, [currentUser, groupsData]);

  // Calculate leaderboard info
  const leaderboardInfo = useMemo(() => {
    if (!userGroup || !groupsData?.groupsByTrip?.groups) return null;

    const sortedGroups = [...groupsData.groupsByTrip.groups].sort(
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
  }, [userGroup, groupsData]);

  // Pagination info from response
  const pagination = challengesData?.challengesByTrip?.pagination;
  const hasMore = pagination?.hasMore ?? false;

  interface ChallengeSummaryChallenge {
    id: string;
    name: string;
    description?: string | null;
    submissionType:
      | "IMAGE"
      | "MULTI_IMAGE"
      | "VIDEO"
      | "TEXT"
      | "IMAGE_LOCATION"
      | "LOCATION"
      | "QR_CODE";
    scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
    basePoints: number;
    firstPlacePoints?: number | null;
    status:
      | "HIDDEN"
      | "VISIBLE"
      | "ACTIVE"
      | "VOTING_PHASE"
      | "COMPLETED"
      | "CANCELLED";
    image?: string | null;
    participantGroupsCount?: number | null;
    myGroupSubmissionStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  }

  const challenges: ChallengeListItem[] = useMemo(() => {
    const apiChallenges = allChallenges ?? [];

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
  }, [allChallenges]);

  const completedChallengesCount = useMemo(
    () =>
      challenges.filter(
        (challenge) =>
          challenge.status === "solved" || challenge.status === "submitted",
      ).length,
    [challenges],
  );

  // Load more challenges (fetch next page)
  const loadMore = useCallback(async () => {
    if (hasMore && !challengesLoading) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore, challengesLoading]);

  // Refresh challenges (reset to first page)
  const refresh = useCallback(async () => {
    setOffset(0);
    // Refetch is handled by urql when offset changes
  }, []);

  return {
    trip: null,
    challenges,
    completedChallengesCount,
    isLoading: challengesLoading && offset === 0,
    isRefreshing: challengesLoading && offset === 0,
    hasNextPage: hasMore,
    isFetchingNextPage: challengesLoading && offset > 0,
    fetchNextPage: loadMore,
    refresh,
    userGroup,
    leaderboardInfo,
  };
}
