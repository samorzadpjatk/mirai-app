import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useChallengeDetails(
  challengeId?: string | null,
  tripId?: string | null,
) {
  const trpc = useTRPC();

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    ...trpc.challenge.getById.queryOptions({
      id: challengeId ?? "",
      tripId: tripId ?? "",
    }),
    enabled: !!challengeId && !!tripId,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const isAssignedToUser = useMemo(() => {
    if (!currentUser || !challenge) return false;

    return challenge.groups.some(
      (g) =>
        g.group.organizer?.id === currentUser.id ||
        g.group.participants?.some((p) => p.id === currentUser.id),
    );
  }, [currentUser, challenge]);

  return {
    challenge,
    isLoading: challengeLoading,
    isAssignedToUser,
  };
}
