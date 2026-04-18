import { Effect } from "effect";
import {
  Challenge,
  ChallengeId,
  TripId,
  DatabaseError,
  type IChallengePort,
} from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * In-Memory Challenge Gateway
 *
 * Implements IChallengePort using in-memory Map storage for testing.
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 */
export class InMemoryChallengeGateway implements IChallengePort {
  private challenges: Map<string, Challenge> = new Map();

  findById(id: ChallengeId) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      const challengeIdStr = ChallengeId.toString(id);
      const challenge = self.challenges.get(challengeIdStr) ?? null;

      if (!challenge) {
        return null;
      }

      // If authenticated, verify access using tripRoles from context
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(challenge.tripId),
          requiredPermission: "read",
        });
      }

      return challenge;
    });
  }

  findByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.sync(() => {
      return Array.from(this.challenges.values())
        .filter((challenge) => TripId.toString(challenge.tripId) === tripIdStr)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findActiveByTripId(tripId: TripId, atDate?: Date) {
    const tripIdStr = TripId.toString(tripId);
    const checkDate = atDate ?? new Date();

    return Effect.sync(() => {
      return Array.from(this.challenges.values())
        .filter((challenge) => {
          const matchesTrip = TripId.toString(challenge.tripId) === tripIdStr;
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
    tripId: TripId,
    params: { limit: number; offset: number },
  ) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.sync(() => {
      const allForTrip = Array.from(this.challenges.values())
        .filter((challenge) => TripId.toString(challenge.tripId) === tripIdStr)
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
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(challenge.tripId),
          requiredPermission: "write",
        });
      }

      self.challenges.set(ChallengeId.toString(challenge.id), challenge);
      return challenge;
    });
  }

  update(challenge: Challenge) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(challenge.tripId),
          requiredPermission: "write",
        });
      }

      self.challenges.set(ChallengeId.toString(challenge.id), challenge);
      return challenge;
    });
  }

  delete(id: ChallengeId) {
    const self = this;

    return Effect.gen(function* () {
      const challengeIdStr = ChallengeId.toString(id);
      const challenge = self.challenges.get(challengeIdStr);

      if (!challenge) {
        return;
      }

      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(challenge.tripId),
          requiredPermission: "write",
        });
      }

      self.challenges.delete(challengeIdStr);
    });
  }

  exists(id: ChallengeId) {
    const challengeIdStr = ChallengeId.toString(id);

    return Effect.sync(() => {
      return this.challenges.has(challengeIdStr);
    });
  }

  countByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.sync(() => {
      return Array.from(this.challenges.values()).filter(
        (challenge) => TripId.toString(challenge.tripId) === tripIdStr,
      ).length;
    });
  }

  activateVisibleChallenges(tripId?: TripId) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission if tripId provided
      if (tripId) {
        const tripIdStr = TripId.toString(tripId);
        const authCtx = yield* AuthContextTag;

        if (authCtx.isAuthenticated) {
          const authZPort = yield* AuthZPortTag;
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "trip",
            resourceId: tripIdStr,
            requiredPermission: "write",
          });
        }
      }

      for (const challenge of self.challenges.values()) {
        const shouldUpdate =
          challenge.status === "VISIBLE" &&
          (!tripId || TripId.toString(challenge.tripId) === TripId.toString(tripId));

        if (shouldUpdate) {
          const activated = challenge.activate();
          self.challenges.set(ChallengeId.toString(challenge.id), activated);
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
