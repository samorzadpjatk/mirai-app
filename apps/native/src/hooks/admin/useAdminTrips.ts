import { useMemo, useState } from 'react';
import { useTrips } from '~/hooks/trips';

export interface Trip {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

export function useAdminTrips() {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const {
    trips,
    isLoading: tripsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useTrips();

  const effectiveTripId = selectedTripId ?? trips?.[0]?.id ?? null;

  const selectedTrip = useMemo(() => {
    if (!trips || !effectiveTripId) return null;
    return trips.find((trip) => trip.id === effectiveTripId) ?? null;
  }, [trips, effectiveTripId]);

  const selectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
  };

  return {
    trips,
    tripsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    selectedTripId: effectiveTripId,
    selectedTrip,
    selectTrip,
    hasTrip: !!effectiveTripId,
  };
}
