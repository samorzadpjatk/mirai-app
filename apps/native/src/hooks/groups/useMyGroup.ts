import { useMemo } from "react";
import { useQuery } from "urql";
import { GetCurrentUserDocument } from "@mirai-app/frameworks";

export function useMyGroup(tripId?: string | null) {
  // Get current user and extract their group from the trip
  const [{ data, error, fetching }] = useQuery({
    query: GetCurrentUserDocument,
    pause: !tripId,
  });

  const group = useMemo(() => {
    // Extract group from user's trip participation
    const user = data?.me;
    if (!user?.participations) return null;

    const participation = user.participations.find(
      (p) => p.trip?.id === tripId,
    );
    return participation?.group ?? null;
  }, [data, tripId]);

  return {
    group,
    isLoading: fetching,
    error,
  } as const;
}
