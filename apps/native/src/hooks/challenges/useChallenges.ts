import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { colors } from "~/styles";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

export function useChallenges(tripId?: string | null) {
  const trpc = useTRPC();

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId,
  });

  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    ...trpc.challenge.getAllByTrip.queryOptions({ tripId: tripId ?? "" }),
    enabled: !!tripId,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

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
    if (position === 1 && sortedGroups.length > 1) {
      const secondPlace = sortedGroups[1];
      pointsDifference = (userGroup.coins ?? 0) - (secondPlace?.coins ?? 0);
    } else if (position > 1) {
      const groupAhead = sortedGroups[position - 2];
      pointsDifference = (groupAhead?.coins ?? 0) - (userGroup.coins ?? 0);
    }

    return { position, pointsDifference, totalGroups: sortedGroups.length };
  }, [userGroup, trip]);

  interface DBChallenge {
    id: string;
    name: string;
    basePoints?: number | null;
    firstPlacePoints?: number | null;
    scoringCategory?: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING" | null;
    description?: string | null;
    image?: string | null;
    status?: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED" | null;
    participantGroupsCount?: number | null;
    myGroupSubmissionStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  }

  const challenges: ChallengeListItem[] = useMemo(() => {
    if (!Array.isArray(challengesData)) return [];

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
                : rawStatus === "VOTING_PHASE" || rawStatus === "COMPLETED"
                  ? "locked"
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

  return {
    trip,
    challenges,
    completedChallengesCount,
    isLoading: tripLoading || challengesLoading,
    userGroup,
    leaderboardInfo,
  };
}
