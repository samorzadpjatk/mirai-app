import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch just the theme key of a trip.
 *
 * Deliberately separate from {@link useTripDetails}: the root `TripThemeProvider` is
 * mounted on every screen, and gating it on `trip.getByIdFull` meant every cold start
 * kicked off the heaviest endpoint in the API before anything was on screen. The theme
 * is a single column, so it gets a single-column query.
 */
export function useTripThemeKey(tripId?: string | null) {
  const enabled = Boolean(tripId);

  const query = useQuery(
    orpc.trip.getTheme.queryOptions({
      input: { id: tripId ?? "" },
      enabled,
      // The theme of a trip effectively never changes during a session.
      staleTime: 5 * 60 * 1000,
    }),
  );

  return {
    theme: query.data?.theme ?? null,
    isLoadingTheme: enabled && query.isLoading,
  };
}
