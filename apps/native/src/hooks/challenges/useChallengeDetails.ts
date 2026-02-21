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
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const isAssignedToUser = useMemo(() => {
    if (!currentUser || !challenge) return false;
    return false;
  }, [currentUser, challenge]);

  return {
    challenge,
    isLoading: challengeLoading,
    isAssignedToUser,
  };
}
