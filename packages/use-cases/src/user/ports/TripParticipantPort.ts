import { Context, Effect } from "effect";
import type { TripParticipant, DatabaseError } from "@mirai-app/domain";

/**
 * TripParticipant Port - Repository interface with Context.Tag for Effect DI
 */
export interface ITripParticipantPort {
  /**
   * Find participant by user and trip
   */
  findByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never>;

  /**
   * Find all participants for a trip
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never>;

  /**
   * Find all participants for a user
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never>;

  /**
   * Find participant by ID
   */
  findById(
    id: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never>;

  /**
   * Create or update participant
   */
  upsert(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, DatabaseError, never>;

  /**
   * Update participant
   */
  update(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, DatabaseError, never>;

  /**
   * Delete participant
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Count participants for a trip
   */
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never>;

  /**
   * Check if user is participant of trip
   */
  isParticipant(
    userId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Find participant by wrist number in a trip
   */
  findByWristNumber(
    tripId: string,
    wristNumber: string,
    excludeUserId?: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never>;

  /**
   * Find participant by user and trip with all relations (group, trip)
   */
  findByUserAndTripWithRelations(
    userId: string,
    tripId: string,
  ): Effect.Effect<
    {
      participant: TripParticipant;
      group: { id: string; name: string } | null;
      trip: { id: string; name: string } | null;
    } | null,
    DatabaseError,
    never
  >;

  /**
   * Find all participants for a trip with user and group info
   */
  findByTripIdWithRelations(tripId: string): Effect.Effect<
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
    DatabaseError,
    never
  >;
}

/**
 * Context.Tag for TripParticipantPort
 */
export class TripParticipantPortTag extends Context.Tag("TripParticipantPort")<
  TripParticipantPortTag,
  ITripParticipantPort
>() {}
