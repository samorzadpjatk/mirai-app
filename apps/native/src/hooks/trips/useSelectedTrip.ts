import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearSelectedTripIdInStorage,
  getSelectedTripIdFromStorage,
  setSelectedTripIdInStorage,
} from "~/lib/selectedTripStorage";

const SELECTED_TRIP_QUERY_KEY = ["selected-trip-id"] as const;

export function useSelectedTrip() {
  const queryClient = useQueryClient();

  const selectedTripQuery = useQuery({
    queryKey: SELECTED_TRIP_QUERY_KEY,
    queryFn: getSelectedTripIdFromStorage,
    staleTime: Infinity,
  });

  const setSelectedTripId = useCallback(
    (tripId: string | null) => {
      queryClient.setQueryData(SELECTED_TRIP_QUERY_KEY, tripId);

      void (async () => {
        try {
          if (tripId) {
            await setSelectedTripIdInStorage(tripId);
            return;
          }

          await clearSelectedTripIdInStorage();
        } catch (error) {
          console.warn("Failed to persist selected trip in storage:", error);
        }
      })();
    },
    [queryClient],
  );

  return {
    selectedTripId: selectedTripQuery.data ?? null,
    isLoadingSelectedTrip: selectedTripQuery.isLoading,
    setSelectedTripId,
  };
}
