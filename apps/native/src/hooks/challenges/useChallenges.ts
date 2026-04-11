import { useCallback, useMemo } from "react";
import { useQuery } from "urql";
import {
  GetTripDocument,
  GetCurrentUserDocument,
} from "@mirai-app/graphql-client";
import { colors } from "~/styles";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

const PAGE_SIZE = 30;

// TODO: This hook requires GetChallengesByTrip query in GraphQL schema
// For now, we use trip data which contains challenges
export function useChallenges(tripId?: string | null) {
  const [{ data: tripData, fetching: tripLoading }] = useQuery({
    query: GetTripDocument,
    variables: { id: tripId ?? "" },
    pause: !tripId,
  });

  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
  });

  // TODO: Implement infinite query for challenges when GraphQL schema supports it
  // For now, we use challenges from trip data
  const trip = tripData?.trip;
  const challengesData = useMemo(
    () => (trip?.challenges as unknown as DBChallenge[]) ?? [],
    [trip?.challenges],
  );

  const currentUser = currentUserData?.me;

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
    const apiChallenges = challengesData ?? [];

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

  const refresh = useCallback(async () => {
    // Refetch is handled by urql
    // For now, no-op since urql handles cache invalidation
  }, []);

  return {
    trip,
    challenges,
    completedChallengesCount,
    isLoading: tripLoading,
    isRefreshing: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: async () => {},
    refresh,
    userGroup,
    leaderboardInfo,
  };
}
