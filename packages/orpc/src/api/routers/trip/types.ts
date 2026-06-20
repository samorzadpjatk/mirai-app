import type { sponsors, tripSponsors, trips } from "@mirai-app/db";
import type { InferSelectModel } from "drizzle-orm";

/**
 * Sponsor shape returned inside a trip's `tripSponsors` relation.
 * Mirrors the database sponsors table without display metadata,
 * which lives on the separate `tripSponsorDisplay` table.
 */
export type TripDetailSponsor = InferSelectModel<typeof sponsors>;

/**
 * Junction-row shape for `trip.tripSponsors`, including the resolved `sponsor`.
 */
export type TripDetailTripSponsor = InferSelectModel<typeof tripSponsors> & {
  sponsor: TripDetailSponsor | null;
};

export interface TripDetailGroup {
  id: string;
  name?: string | null;
  coins?: number | null;
  image?: string | null;
  _count: { participants: number };
}

export interface TripDetailParticipant {
  user: ({ id: string; email: string | null } & Record<string, unknown>) | null;
  group:
    | ({
        id: string;
        name?: string | null;
        coins?: number | null;
        _count: { participants: number };
        image: string | null | undefined;
      } & Record<string, unknown>)
    | null;
}

/**
 * Client-safe trip detail object returned by `trip.getById` / `trip.getByIdFull`.
 * Replaces the deeply inferred Drizzle relation type so the oRPC client can
 * fully resolve nested types such as `tripSponsors[].sponsor`.
 */
export interface TripDetail extends InferSelectModel<typeof trips> {
  description: string;
  backgroundImagePath: string;
  tripSponsors: TripDetailTripSponsor[];
  groups: TripDetailGroup[];
  participants: TripDetailParticipant[];
}
