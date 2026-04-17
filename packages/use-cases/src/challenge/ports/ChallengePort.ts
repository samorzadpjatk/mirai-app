import { Context, Effect } from "effect";
import type { Challenge, IPortError } from "@mirai-app/domain";

/**
 * Challenge Port - Repository interface with Context.Tag for Effect DI
 */
export interface IChallengePort {
  findById(id: string): Effect.Effect<Challenge | null, IPortError, never>;
  findByTripId(tripId: string): Effect.Effect<Challenge[], IPortError, never>;
  findActiveByTripId(
    tripId: string,
    atDate?: Date,
  ): Effect.Effect<Challenge[], IPortError, never>;
  findPaginatedByTripId(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { challenges: Challenge[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  create(challenge: Challenge): Effect.Effect<Challenge, IPortError, never>;
  update(challenge: Challenge): Effect.Effect<Challenge, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  exists(id: string): Effect.Effect<boolean, IPortError, never>;
  countByTripId(tripId: string): Effect.Effect<number, IPortError, never>;
  activateVisibleChallenges(
    tripId?: string,
  ): Effect.Effect<void, IPortError, never>;
}

export class ChallengePortTag extends Context.Tag("ChallengePort")<
  ChallengePortTag,
  IChallengePort
>() {}
