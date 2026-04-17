import { Context, Effect } from "effect";
import type { Challenge, DatabaseError } from "@mirai-app/domain";

/**
 * Challenge Port - Repository interface with Context.Tag for Effect DI
 */
export interface IChallengePort {
  findById(id: string): Effect.Effect<Challenge | null, DatabaseError, never>;
  findByTripId(
    tripId: string,
  ): Effect.Effect<Challenge[], DatabaseError, never>;
  findActiveByTripId(
    tripId: string,
    atDate?: Date,
  ): Effect.Effect<Challenge[], DatabaseError, never>;
  findPaginatedByTripId(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { challenges: Challenge[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  create(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never>;
  update(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never>;
  activateVisibleChallenges(
    tripId?: string,
  ): Effect.Effect<void, DatabaseError, never>;
}

export class ChallengePortTag extends Context.Tag("ChallengePort")<
  ChallengePortTag,
  IChallengePort
>() {}
