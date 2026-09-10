import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  clearSelectedTripIdInStorage,
  getSelectedTripIdFromStorage,
  setSelectedTripIdInStorage,
} from "~/services/storage/selectedTripStorage";

const SELECTED_TRIP_QUERY_KEY = ["selected-trip-id"] as const;

export function useSelectedTrip() {
  const queryClient = useQueryClient();
  const selectedTripQuery = useQuery({
    queryKey: SELECTED_TRIP_QUERY_KEY,
    queryFn: getSelectedTripIdFromStorage,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const setSelectedTripMutation = useMutation({
    mutationFn: async (tripId: string | null) => {
      if (tripId) {
        await setSelectedTripIdInStorage(tripId);
      } else {
        await clearSelectedTripIdInStorage();
      }
      return tripId;
    },
    onSuccess: (data: string | null) => {
      queryClient.setQueryData(SELECTED_TRIP_QUERY_KEY, data);
    },
  });

  const setSelectedTripId = useCallback(
    (tripId: string | null) => {
      // Execute the mutation to persist to storage
      setSelectedTripMutation.mutate(tripId, {
        onSuccess: () => {
          // Query cache will be updated automatically through the mutation
        },
        onError: () => {
          // Silently ignore storage persistence errors
        },
      });
    },
    // `mutate` is stable across renders; the mutation result object is not.
    // Depending on the object handed every consumer a new `setSelectedTripId` on
    // each render, which is enough to make any effect listing it re-run forever.
    [setSelectedTripMutation.mutate],
  );

  return {
    selectedTripId: selectedTripQuery.data ?? null,
    isLoadingSelectedTrip: selectedTripQuery.isLoading,
    setSelectedTripId,
  };
}
