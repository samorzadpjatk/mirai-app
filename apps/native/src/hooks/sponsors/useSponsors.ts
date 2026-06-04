import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";

export function useSponsors() {
  return useQuery(orpc.sponsor.getAll.queryOptions({ input: {} }));
}

export function useSponsorById(id: string) {
  return useQuery({
    ...orpc.sponsor.getById.queryOptions({ input: { id } }),
    enabled: !!id,
  });
}

export function useTripSponsors(tripId: string) {
  return useQuery({
    ...orpc.sponsor.getByTripId.queryOptions({ input: { tripId } }),
    enabled: !!tripId,
  });
}
