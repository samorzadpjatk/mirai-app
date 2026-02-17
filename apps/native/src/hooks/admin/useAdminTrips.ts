import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

export interface Trip {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

export function useAdminTrips() {
  const trpc = useTRPC();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const { data: trips, isLoading: tripsLoading } = useQuery(
    trpc.trip.getAll.queryOptions()
  );

  const effectiveTripId = selectedTripId ?? trips?.[0]?.id ?? null;

  const selectedTrip = useMemo(() => {
    if (!trips || !effectiveTripId) return null;
    return trips.find((trip) => trip.id === effectiveTripId) ?? null;
  }, [trips, effectiveTripId]);

  const selectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
  };

  return {
    trips: trips ?? [],
    tripsLoading,
    selectedTripId: effectiveTripId,
    selectedTrip,
    selectTrip,
    hasTrip: !!effectiveTripId,
  };
}
