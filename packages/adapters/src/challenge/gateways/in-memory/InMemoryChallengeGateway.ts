import { Effect } from "effect";
import {
  Challenge,
  ChallengeId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IChallengePort } from "@mirai-app/domain";

/**
 * In-Memory Challenge Gateway
 *
 * Implements IChallengePort using in-memory Map storage for testing.
 */
export class InMemoryChallengeGateway implements IChallengePort {
  private challenges: Map<string, Challenge> = new Map();

  findById(id: string) {
    return Effect.sync(() => {
      const challenge = this.challenges.get(id);
      return challenge ?? null;
    });
  }

  findByTripId(tripId: string) {
    return Effect.sync(() => {
      return Array.from(this.challenges.values())
        .filter((challenge) => TripId.toString(challenge.tripId) === tripId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findActiveByTripId(tripId: string, atDate?: Date) {
    const checkDate = atDate ?? new Date();

    return Effect.sync(() => {
      return Array.from(this.challenges.values())
        .filter((challenge) => {
          const matchesTrip = TripId.toString(challenge.tripId) === tripId;
          const isActive = challenge.status === "ACTIVE";
          const isWithinTimeRange =
            (!challenge.startTime || challenge.startTime <= checkDate) &&
            (!challenge.endTime || challenge.endTime >= checkDate);
          return matchesTrip && isActive && isWithinTimeRange;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findPaginatedByTripId(
    tripId: string,
    params: { limit: number; offset: number },
  ) {
    return Effect.sync(() => {
      const allForTrip = Array.from(this.challenges.values())
        .filter((challenge) => TripId.toString(challenge.tripId) === tripId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = allForTrip.length;
      const paginated = allForTrip.slice(
        params.offset,
        params.offset + params.limit,
      );

      return {
        challenges: paginated,
        total,
        hasMore: params.offset + paginated.length < total,
      };
    });
  }

  create(challenge: Challenge) {
    return Effect.sync(() => {
      this.challenges.set(ChallengeId.toString(challenge.id), challenge);
      return challenge;
    });
  }

  update(challenge: Challenge) {
    return Effect.sync(() => {
      this.challenges.set(ChallengeId.toString(challenge.id), challenge);
      return challenge;
    });
  }

  delete(id: string) {
    return Effect.sync(() => {
      this.challenges.delete(id);
    });
  }

  exists(id: string) {
    return Effect.sync(() => {
      return this.challenges.has(id);
    });
  }

  countByTripId(tripId: string) {
    return Effect.sync(() => {
      return Array.from(this.challenges.values()).filter(
        (challenge) => TripId.toString(challenge.tripId) === tripId,
      ).length;
    });
  }

  activateVisibleChallenges(tripId?: string) {
    return Effect.sync(() => {
      for (const challenge of this.challenges.values()) {
        const shouldUpdate =
          challenge.status === "VISIBLE" &&
          (!tripId || TripId.toString(challenge.tripId) === tripId);

        if (shouldUpdate) {
          const activated = challenge.activate();
          this.challenges.set(ChallengeId.toString(challenge.id), activated);
        }
      }
    });
  }

  /**
   * Helper method to add a challenge (for testing)
   */
  addChallenge(challenge: Challenge): void {
    this.challenges.set(ChallengeId.toString(challenge.id), challenge);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.challenges.clear();
  }
}
