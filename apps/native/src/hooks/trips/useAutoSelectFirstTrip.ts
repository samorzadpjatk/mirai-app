import { shouldAutoSelectFirstTrip } from "@mirai-app/common/feed";
import { useEffect } from "react";
import type { TripListItem } from "~/components/trips/list/types";
import { useSelectedTrip } from "./useSelectedTrip";

export function useAutoSelectFirstTrip(
  trips: readonly TripListItem[],
  hasDismissedAutoPicker: boolean,
): void {
  const { selectedTripId, setSelectedTripId } = useSelectedTrip();

  useEffect(() => {
    const nextTripId = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId,
      hasDismissedAutoPicker,
    });

    if (nextTripId) {
      setSelectedTripId(nextTripId);
    }
  }, [trips, selectedTripId, hasDismissedAutoPicker, setSelectedTripId]);
}
