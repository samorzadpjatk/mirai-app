import { Context, Effect } from "effect";
import type {
  SponsorId,
  TripId,
  TripSponsorId,
  IPortError,
} from "@mirai-app/domain";
import type { SponsorDTO } from "../dto/SponsorDTOs";

/**
 * Trip Sponsor Port - Repository interface with Context.Tag for Effect DI
 * Manages the many-to-many relationship between trips and sponsors
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

/**
 * @deprecated Use TripSponsorPortTag instead. Kept for backward compatibility.
 */
export const TripSponsorPort = TripSponsorPortTag;

/**
 * @deprecated Use ITripSponsorPort instead. Kept for backward compatibility.
 */
export type TripSponsorPort = typeof TripSponsorPortTag;
