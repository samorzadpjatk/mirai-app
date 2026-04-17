import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { TripId } from "../../trip/value-objects/TripId";
import type { UserId } from "../value-objects/UserId";

/**
 * TripParticipant entity interface
 * Represents a user's participation in a trip
 */
export interface TripParticipant {
  id: string;
  userId: UserId;
  tripId: TripId;
  wristNumber: string | null;
  groupId: string | null;
  joinedAt: Date;
  updatedAt: Date;
}

/**
 * TripParticipant Port
 * Defines repository operations for trip participants
 */
export interface ITripParticipantPort {
  findByUserAndTrip(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<TripParticipant | null, IPortError, never>;
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<TripParticipant[], IPortError, never>;
  findByUserId(
    userId: UserId,
  ): Effect.Effect<TripParticipant[], IPortError, never>;
  findById(
    id: string,
  ): Effect.Effect<TripParticipant | null, IPortError, never>;
  upsert(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, IPortError, never>;
  update(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  countByTripId(tripId: TripId): Effect.Effect<number, IPortError, never>;
  isParticipant(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<boolean, IPortError, never>;
  findByWristNumber(
    tripId: TripId,
    wristNumber: string,
    excludeUserId?: UserId,
  ): Effect.Effect<TripParticipant | null, IPortError, never>;
  findByUserAndTripWithRelations(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<
    {
      participant: TripParticipant;
      group: { id: string; name: string } | null;
      trip: { id: string; name: string } | null;
    } | null,
    IPortError,
    never
  >;
  findByTripIdWithRelations(tripId: TripId): Effect.Effect<
    {
      participant: TripParticipant;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        authUserId: string | null;
      };
      group: { id: string; name: string } | null;
    }[],
    IPortError,
    never
  >;
}
