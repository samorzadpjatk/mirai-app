import { Context, Effect } from "effect";
import type {
  SponsorId,
  TripId,
  TripSponsorId,
  DatabaseError,
} from "@mirai-app/domain";
import type { SponsorDTO } from "../dto/SponsorDTOs";

/**
 * Trip Sponsor Port - Repository interface with Context.Tag for Effect DI
 * Manages the many-to-many relationship between trips and sponsors
 */
export interface ITripSponsorPort {
  findById(
    id: TripSponsorId,
  ): Effect.Effect<TripSponsorWithSponsor | null, DatabaseError, never>;
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<TripSponsorWithSponsor[], DatabaseError, never>;
  findBySponsorId(
    sponsorId: SponsorId,
  ): Effect.Effect<TripSponsor[], DatabaseError, never>;
  findByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<TripSponsor | null, DatabaseError, never>;
  create(
    tripSponsor: TripSponsor,
  ): Effect.Effect<TripSponsor, DatabaseError, never>;
  delete(id: TripSponsorId): Effect.Effect<void, DatabaseError, never>;
  deleteByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<void, DatabaseError, never>;
  existsByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<boolean, DatabaseError, never>;
}

/**
 * Trip Sponsor relationship entity (used internally by port)
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
  sponsor: SponsorDTO;
}

export class TripSponsorPortTag extends Context.Tag("TripSponsorPort")<
  TripSponsorPortTag,
  ITripSponsorPort
>() {}
