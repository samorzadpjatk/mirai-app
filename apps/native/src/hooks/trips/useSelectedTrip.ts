import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSelectedTripIdFromStorage,
  setSelectedTripIdInStorage,
  clearSelectedTripIdInStorage,
} from "~/services/storage/selectedTripStorage";

const SELECTED_TRIP_QUERY_KEY = ["selected-trip-id"] as const;

export function useSelectedTrip() {
  const queryClient = useQueryClient();
  const selectedTripQuery = useQuery({
    queryKey: SELECTED_TRIP_QUERY_KEY,
    queryFn: getSelectedTripIdFromStorage,
    staleTime: Infinity,
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
        onError: (error: unknown) => {
          console.warn("Failed to persist selected trip in storage:", error);
        },
      });
    },
    [setSelectedTripMutation],
  );

  return {
    selectedTripId: selectedTripQuery.data ?? null,
    isLoadingSelectedTrip: selectedTripQuery.isLoading,
    setSelectedTripId,
  };
}
