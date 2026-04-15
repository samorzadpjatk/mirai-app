import { useCallback, useState, useEffect } from "react";
import {
  getSelectedTripIdFromStorage,
  setSelectedTripIdInStorage,
  clearSelectedTripIdInStorage,
} from "~/services/storage/selectedTripStorage";

export function useSelectedTrip() {
  const [selectedTripId, setSelectedTripIdState] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const tripId = await getSelectedTripIdFromStorage();
      if (isMounted) {
        setSelectedTripIdState(tripId);
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setSelectedTripId = useCallback(async (tripId: string | null) => {
    try {
      if (tripId) {
        await setSelectedTripIdInStorage(tripId);
      } else {
        await clearSelectedTripIdInStorage();
      }
      setSelectedTripIdState(tripId);
    } catch {
      // Silently ignore storage errors
    }
  }, []);

  return {
    selectedTripId,
    isLoadingSelectedTrip: isLoading,
    setSelectedTripId,
  };
}
