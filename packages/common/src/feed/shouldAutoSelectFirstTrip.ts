export interface ShouldAutoSelectFirstTripArgs {
  trips: ReadonlyArray<{ id: string }>;
  selectedTripId: string | null;
  hasDismissedAutoPicker: boolean;
}

export function shouldAutoSelectFirstTrip({
  trips,
  selectedTripId,
  hasDismissedAutoPicker,
}: ShouldAutoSelectFirstTripArgs): string | null {
  if (trips.length === 0) return null;
  if (hasDismissedAutoPicker) return null;

  const firstId = trips[0]?.id;
  if (firstId == null) return null;

  if (selectedTripId === firstId) return null;
  if (selectedTripId === null) return firstId;
  if (!trips.some((trip) => trip.id === selectedTripId)) return firstId;

  return null;
}
