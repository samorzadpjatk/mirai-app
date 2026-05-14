import { create } from "zustand";
import React from "react";
import { useSelectedTrip, useTripDetails } from "~/hooks/trips";

interface TripState {
  selectedTripId: string | null;
  isTripPast: boolean | undefined;
  isLoading: boolean;
}

export const useTripStore = create<TripState>((_set) => ({
  selectedTripId: null,
  isTripPast: undefined,
  isLoading: false,
}));

// Hook to sync the store with the actual trip data
// This should only be used in the trip details screen (main hub)
export function useTripSync() {
  const { selectedTripId } = useSelectedTrip();
  const { isTripPast, isLoadingTrip } = useTripDetails(selectedTripId);

  // Update store when trip data changes
  React.useEffect(() => {
    useTripStore.setState({
      selectedTripId,
      isTripPast,
      isLoading: isLoadingTrip,
    });
  }, [selectedTripId, isTripPast, isLoadingTrip]);
}
