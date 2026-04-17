import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { SponsorId } from "../../sponsor/value-objects/SponsorId";
import type { TripId } from "../../trip/value-objects/TripId";
import type { TripSponsorId } from "../value-objects/SponsorId";

/**
 * Trip Sponsor relationship entity
 */
export interface TripSponsor {
  id: TripSponsorId;
  tripId: TripId;
  sponsorId: SponsorId;
  createdAt: Date;
}

/**
 * Trip Sponsor with populated sponsor data
 */
export interface TripSponsorWithSponsor extends TripSponsor {
  sponsor: {
    id: SponsorId;
    name: string;
    logoUrl: string | null;
    website: string | null;
  };
}

/**
 * TripSponsor Port
 * Defines repository operations for trip-sponsor relationships
 */
export interface ITripSponsorPort {
  findById(
    id: TripSponsorId,
  ): Effect.Effect<TripSponsorWithSponsor | null, IPortError, never>;
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<TripSponsorWithSponsor[], IPortError, never>;
  findBySponsorId(
    sponsorId: SponsorId,
  ): Effect.Effect<TripSponsor[], IPortError, never>;
  findByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<TripSponsor | null, IPortError, never>;
  create(
    tripSponsor: TripSponsor,
  ): Effect.Effect<TripSponsor, IPortError, never>;
  delete(id: TripSponsorId): Effect.Effect<void, IPortError, never>;
  deleteByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<void, IPortError, never>;
  existsByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<boolean, IPortError, never>;
}
