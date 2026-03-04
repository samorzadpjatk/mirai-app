import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import {
  getCachedTripById,
  setCachedTripById,
  upsertCachedTripListItem,
} from "~/services/storage/selectedTripStorage";
import type { TripListItem } from "~/components/trips/list/types";
import { isTripPast } from "~/utils/trip";

export function useTripDetails(tripId?: string | null) {
  const trpc = useTRPC();
  const currentUserQuery = useQuery(trpc.user.getMy.queryOptions());
  const tripQuery = useQuery(trpc.trip.getById.queryOptions({ id: tripId ?? "" }, { enabled: !!tripId }));

  const { data: currentUser, isLoading: isLoadingUser } = currentUserQuery;

  type TripData = Exclude<typeof tripQuery.data, undefined>;
  const [cachedTrip, setCachedTrip] = useState<TripData | null>(null);
  const [cachedTripId, setCachedTripId] = useState<string | null>(null);
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!isMounted) return;
      setCachedTrip(null);
      setCachedTripId(null);
      setIsCacheHydrated(false);

      if (!tripId) {
        setIsCacheHydrated(true);
        return;
      }

      const cached = await getCachedTripById<TripData>(tripId);
      if (!isMounted) return;
      setCachedTrip(cached);
      setCachedTripId(tripId);
      setIsCacheHydrated(true);
    })();

    return () => {
      isMounted = false;
    };
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !tripQuery.data) return;

    void setCachedTripById(tripId, tripQuery.data);

    const listItem: TripListItem = {
      id: tripQuery.data.id,
      name: tripQuery.data.name,
      description: tripQuery.data.description,
      startDate: tripQuery.data.startDate,
      endDate: tripQuery.data.endDate,
      backgroundImagePath: tripQuery.data.backgroundImagePath,
      groups: tripQuery.data.groups,
    };
    void upsertCachedTripListItem(listItem);
  }, [tripId, tripQuery.data]);

  const localCachedTrip = cachedTripId === (tripId ?? null) ? cachedTrip : null;
  const trip = tripQuery.data ?? localCachedTrip ?? null;
  const isLoadingTrip =
    Boolean(tripId) &&
    !trip &&
    (tripQuery.isLoading || !isCacheHydrated);

  const isTripPastValue = trip ? isTripPast(trip.endDate) : false;

  return {
    currentUser,
    isLoadingUser,
    trip,
    isLoadingTrip,
    refetchTrip: tripQuery.refetch,
    isErrorTrip: tripQuery.isError,
    tripError: tripQuery.error,
    isTripPast: isTripPastValue,
  };
}
