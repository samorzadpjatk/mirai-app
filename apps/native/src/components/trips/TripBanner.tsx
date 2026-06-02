import { useTripStore } from "~/stores/tripStore";
import { TripEndedBanner } from "./TripEndedBanner";

/**
 * A shared banner component that displays trip-related information
 * based on the current trip store state. Currently shows the "Trip Ended" banner
 * when the trip is past.
 */
export function TripBanner() {
  const { selectedTripId, isTripPast } = useTripStore();

  // Only show banner when we have a selected trip and it's past
  if (!selectedTripId || !isTripPast) {
    return null;
  }

  return <TripEndedBanner visible={true} />;
}
