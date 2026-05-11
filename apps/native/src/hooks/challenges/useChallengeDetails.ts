import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";

export function useChallengeDetails(
  challengeId?: string | null,
  tripId?: string | null,
) {
  const challengeQuery = useQuery(orpc.challenge.getById.queryOptions({ input: { id: challengeId ?? "", tripId: tripId ?? "" }, enabled: !!challengeId && !!tripId }));
  const currentUserQuery = useQuery(orpc.user.getMy.queryOptions({ input: {} }));

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
