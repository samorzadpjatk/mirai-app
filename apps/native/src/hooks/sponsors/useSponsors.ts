import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useSponsors() {
  const trpc = useTRPC();
  
  return useQuery(trpc.sponsor.getAll.queryOptions());
}

export function useSponsorById(id: string) {
  const trpc = useTRPC();
  
  return useQuery({
    ...trpc.sponsor.getById.queryOptions({ id }),
    enabled: !!id,
  });
}

export function useTripSponsors(tripId: string) {
  const trpc = useTRPC();
  
  return useQuery({
    ...trpc.sponsor.getByTripId.queryOptions({ tripId }),
    enabled: !!tripId,
  });
}
