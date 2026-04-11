import { useQuery } from "urql";
import {
  GetSponsorsDocument,
  GetSponsorDocument,
  GetSponsorsByTripDocument,
} from "@mirai-app/graphql-client";

export function useSponsors() {
  return useQuery({
    query: GetSponsorsDocument,
  });
}

export function useSponsorById(id: string) {
  return useQuery({
    query: GetSponsorDocument,
    variables: { id },
    pause: !id,
  });
}

export function useTripSponsors(tripId: string) {
  return useQuery({
    query: GetSponsorsByTripDocument,
    variables: { tripId },
    pause: !tripId,
  });
}
