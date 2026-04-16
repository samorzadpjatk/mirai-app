import { useMemo } from "react";
import { useQuery } from "urql";
import {
  GetChallengeDocument,
  GetCurrentUserDocument,
} from "@mirai-app/frameworks";

export function useChallengeDetails(
  challengeId?: string | null,
  tripId?: string | null,
) {
  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
  });

  // Query challenge directly by ID
  const [{ data: challengeData, fetching }] = useQuery({
    query: GetChallengeDocument,
    variables: {
      id: challengeId ?? "",
      tripId: tripId ?? "",
    },
    pause: !challengeId || !tripId,
  });

  // Challenge data comes directly from the query
  const challenge = useMemo(() => {
    return challengeData?.challenge ?? null;
  }, [challengeData]);

  const isAssignedToUser = useMemo(() => {
    if (!currentUserData?.me || !challenge) return false;
    return false;
  }, [currentUserData, challenge]);

  return {
    challenge,
    isLoading: fetching,
    isAssignedToUser,
  };
}
