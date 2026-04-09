import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@repo/frameworks/trpc/client";

export function useChallengeDetails(
  challengeId?: string | null,
  tripId?: string | null,
) {
  const trpc = useTRPC();
  const challengeQuery = useQuery(
    trpc.challenge.getById.queryOptions(
      { id: challengeId ?? "", tripId: tripId ?? "" },
      { enabled: !!challengeId && !!tripId },
    ),
  );
  const currentUserQuery = useQuery(trpc.user.getMy.queryOptions());

  const { data: challenge, isLoading: challengeLoading } = challengeQuery;
  const { data: currentUser } = currentUserQuery;

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
