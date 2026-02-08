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
    description?: string | null;
    image?: string | null;
    status?: string | null;
  }

  const challenges: ChallengeListItem[] = useMemo(() => {
    if (!Array.isArray(challengesData)) return [];

    const apiChallenges = (challengesData ?? []) as DBChallenge[];

    return apiChallenges.map((dbChallenge) => {
      const rawStatus = dbChallenge.status ?? "HIDDEN";
      const cardStatus =
        rawStatus === "HIDDEN" || rawStatus === "CANCELLED"
          ? "locked"
          : rawStatus === "COMPLETED"
            ? "selected"
            : "incomplete";

      return {
        id: dbChallenge.id,
        title: dbChallenge.name,
        points: dbChallenge.basePoints ?? 0,
        icon: "trophy",
        iconColor: colors.primary,
        status: cardStatus,
        description: dbChallenge.description ?? undefined,
        image: dbChallenge.image ?? undefined,
      } as ChallengeListItem;
    });
  }, [challengesData]);

  return {
    trip,
    challenges,
    isLoading: tripLoading || challengesLoading,
    userGroup,
    leaderboardInfo,
  };
}
