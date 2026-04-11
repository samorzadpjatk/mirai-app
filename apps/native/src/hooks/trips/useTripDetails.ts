import { useEffect, useState } from "react";
import { useQuery } from "urql";
import {
  GetCurrentUserDocument,
  GetTripDocument,
} from "@mirai-app/graphql-client";
import {
  getCachedTripById,
  setCachedTripById,
  upsertCachedTripListItem,
} from "~/services/storage/selectedTripStorage";
import type { TripListItem } from "~/components/trips/list/types";
import { isTripPast } from "~/utils/trip";

export function useTripDetails(tripId?: string | null) {
  const [{ data: currentUserData, fetching: isLoadingUser }] = useQuery({
    query: GetCurrentUserDocument,
  });

  const [{ data: tripQueryData, fetching: tripFetching }, refetchTrip] =
    useQuery({
      query: GetTripDocument,
      variables: { id: tripId ?? "" },
      pause: !tripId,
    });

  const currentUser = currentUserData?.me;

  type TripData = NonNullable<typeof tripQueryData>["trip"];
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

  const tripData = tripQueryData?.trip;

  useEffect(() => {
    if (!tripId || !tripData) return;

    void setCachedTripById(tripId, tripData);

    const listItem: TripListItem = {
      id: tripData.id,
      name: tripData.name,
      description: tripData.description,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      backgroundImagePath: tripData.backgroundImagePath,
      groups: tripData.groups,
    };
    void upsertCachedTripListItem(listItem);
  }, [tripId, tripData]);

  const localCachedTrip = cachedTripId === (tripId ?? null) ? cachedTrip : null;
  const trip = tripData ?? localCachedTrip ?? null;
  const isLoadingTrip =
    Boolean(tripId) && !trip && (tripFetching || !isCacheHydrated);

  const isTripPastValue = trip ? isTripPast(trip.endDate) : false;

  return {
    currentUser,
    isLoadingUser,
    trip,
    isLoadingTrip,
    refetchTrip: () => refetchTrip({ requestPolicy: "network-only" }),
    isErrorTrip: !!error,
    tripError: error,
    isTripPast: isTripPastValue,
  };
}
