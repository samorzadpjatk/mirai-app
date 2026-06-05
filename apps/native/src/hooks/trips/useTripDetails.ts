import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { TripListItem } from "~/components/trips/list/types";
import {
  getCachedTripById,
  setCachedTripById,
  upsertCachedTripListItem,
} from "~/services/storage/selectedTripStorage";
import { isTripPast } from "~/utils/trip";

export function useTripDetails(tripId?: string | null) {
  const currentUserQuery = useQuery(orpc.user.getMy.queryOptions({ input: {} }));
  const tripQuery = useQuery(
    orpc.trip.getById.queryOptions({ input: { id: tripId ?? "" }, enabled: !!tripId }),
  );

  const { data: currentUser, isLoading: isLoadingUser } = currentUserQuery;

  type TripData = Exclude<typeof tripQuery.data, undefined>;
  const [cachedTrip, setCachedTrip] = useState<TripData | undefined>(undefined);
  const [cachedTripId, setCachedTripId] = useState<string>("");
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!isMounted) return;
      setCachedTrip(undefined);
      setCachedTripId("");
      setIsCacheHydrated(false);

      if (!tripId) {
        setIsCacheHydrated(true);
        return;
      }

      const cached = await getCachedTripById<TripData>(tripId);
      if (!isMounted) return;
      setCachedTrip(cached ?? undefined);
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

  const localCachedTrip = cachedTripId === (tripId ?? "") ? cachedTrip : undefined;
  const trip = tripQuery.data ?? localCachedTrip ?? null;
  const isLoadingTrip = Boolean(tripId) && !trip && (tripQuery.isLoading || !isCacheHydrated);

  const isTripPastValue = trip ? isTripPast(trip.endDate) : undefined;

  return {
    currentUser,
    isLoadingUser,
    trip,
    isLoadingTrip,
    refetchTrip: tripQuery.refetch,
    isErrorTrip: tripQuery.isError,
    tripError: tripQuery.error,
    isTripPast: isTripPastValue,
    tripId: tripId ?? "",
  };
}
