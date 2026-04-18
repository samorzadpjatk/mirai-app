import { Effect } from "effect";
import { eq, count, and, sql } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  challenges,
  tripParticipants,
  type ChallengeSelect,
} from "@mirai-app/frameworks/drizzle";
import {
  Challenge,
  ChallengeId,
  TripId,
  DatabaseError,
  PermissionDeniedError,
  type IChallengePort,
} from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { challengeMapper } from "../../mappers/ChallengeMapper";

/**
 * Challenge Drizzle Gateway
 *
 * Implements IChallengePort using Drizzle ORM for database operations.
 * Supports optional auth token for protected operations.
 * Auth verification uses direct database queries to check trip membership.
 */
export class ChallengeDrizzleGateway
  extends BaseDrizzleGateway
  implements IChallengePort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  /**
   * Verify trip membership from auth token
   * Extracts user ID from token and checks if they're a trip participant
   */
  private verifyTripMembership(
    authToken: string,
    tripId: string,
  ): Effect.Effect<void, PermissionDeniedError | DatabaseError, never> {
    const self = this;

    return Effect.gen(function* () {
      // Extract user ID from token (last 36 chars for UUID)
      const userId = authToken.length > 36 ? authToken.slice(-36) : authToken;

      // Check if user is a trip participant
      const participant = yield* Effect.tryPromise({
        try: () =>
          self.db.query.tripParticipants.findFirst({
            where: and(
              eq(tripParticipants.tripId, tripId),
              eq(tripParticipants.userId, userId),
            ),
          }),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeDrizzleGateway.verifyTripMembership",
            cause: error,
          }),
      });

      if (!participant) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            action: "access:challenge",
            resource: `trip:${tripId}`,
            userId,
          }),
        );
      }
    });
  }

  findById(id: ChallengeId, authToken?: string) {
    const challengeIdStr = ChallengeId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // First, fetch the challenge to get tripId for auth check
      const dbChallenge = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r: ChallengeSelect[]) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeDrizzleGateway.findById",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!dbChallenge) {
        return null;
      }

      // Verify auth if token provided - check trip membership
      if (authToken) {
        yield* self.verifyTripMembership(authToken, dbChallenge.tripId);
      }

      return yield* challengeMapper.toDomain(dbChallenge);
    });
  }

  findByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return this.tryPromise(
      "findByTripId",
      async () => {
        const results = await this.db
          .select()
          .from(challenges)
          .where(eq(challenges.tripId, tripIdStr))
          .orderBy(sql`${challenges.createdAt} DESC`);
        return results;
      },
      tripIdStr,
    ).pipe(
      Effect.flatMap((dbChallenges: ChallengeSelect[]) =>
        Effect.forEach(dbChallenges, (dbChallenge) =>
          challengeMapper.toDomain(dbChallenge),
        ),
      ),
    );
  }

  findActiveByTripId(tripId: TripId, atDate?: Date) {
    const tripIdStr = TripId.toString(tripId);
    const checkDate = atDate ?? new Date();

    return this.tryPromise(
      "findActiveByTripId",
      async () => {
        const results = await this.db
          .select()
          .from(challenges)
          .where(
            and(
              eq(challenges.tripId, tripIdStr),
              eq(challenges.status, "ACTIVE"),
              sql`${challenges.startTime} IS NULL OR ${challenges.startTime} <= ${checkDate}`,
              sql`${challenges.endTime} IS NULL OR ${challenges.endTime} >= ${checkDate}`,
            ),
          )
          .orderBy(sql`${challenges.createdAt} DESC`);
        return results;
      },
      tripIdStr,
    ).pipe(
      Effect.flatMap((dbChallenges: ChallengeSelect[]) =>
        Effect.forEach(dbChallenges, (dbChallenge) =>
          challengeMapper.toDomain(dbChallenge),
        ),
      ),
    );
  }

  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ) {
    const tripIdStr = TripId.toString(tripId);

    return this.tryPromise(
      "findPaginatedByTripId",
      async () => {
        const [items, totalResult] = await Promise.all([
          this.db
            .select()
            .from(challenges)
            .where(eq(challenges.tripId, tripIdStr))
            .orderBy(sql`${challenges.createdAt} DESC`)
            .limit(params.limit)
            .offset(params.offset),
          this.db
            .select({ count: count() })
            .from(challenges)
            .where(eq(challenges.tripId, tripIdStr)),
        ]);

        return { items, total: totalResult[0]?.count ?? 0 };
      },
      tripIdStr,
    ).pipe(
      Effect.flatMap(
        ({ items, total }: { items: ChallengeSelect[]; total: number }) =>
          Effect.forEach(items, (item) => challengeMapper.toDomain(item)).pipe(
            Effect.map((domainChallenges) => ({
              challenges: domainChallenges,
              total,
              hasMore: params.offset + items.length < total,
            })),
          ),
      ),
    );
  }

  create(challenge: Challenge, authToken?: string) {
    const insertData = challengeMapper.toInsert(challenge);
    const tripIdStr = TripId.toString(challenge.tripId);
    const self = this;

    return Effect.gen(function* () {
      // Verify auth if token provided - check trip membership (organizer+ required)
      if (authToken) {
        yield* self.verifyTripMembership(authToken, tripIdStr);
        // Note: Additional role check (organizer+) would be done at use case layer
        // The gateway only verifies trip membership
      }

      const dbChallenge = yield* Effect.tryPromise({
        try: () =>
          self.db
            .insert(challenges)
            .values(insertData)
            .returning()
            .then((r: ChallengeSelect[]) => {
              if (!r[0]) throw new Error("Failed to create challenge");
              return r[0];
            }),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeDrizzleGateway.create",
            id: ChallengeId.toString(challenge.id),
            cause: error,
          }),
      });

      return yield* challengeMapper.toDomain(dbChallenge);
    });
  }

  update(challenge: Challenge, authToken?: string) {
    const updateData = challengeMapper.toUpdate(challenge);
    const challengeIdStr = ChallengeId.toString(challenge.id);
    const tripIdStr = TripId.toString(challenge.tripId);
    const self = this;

    return Effect.gen(function* () {
      // Verify auth if token provided - check trip membership (organizer+ required)
      if (authToken) {
        yield* self.verifyTripMembership(authToken, tripIdStr);
        // Note: Additional role check (organizer+) would be done at use case layer
      }

      const dbChallenge = yield* Effect.tryPromise({
        try: () =>
          self.db
            .update(challenges)
            .set(updateData)
            .where(eq(challenges.id, challengeIdStr))
            .returning()
            .then((r: ChallengeSelect[]) => {
              if (!r[0]) throw new Error("Failed to update challenge");
              return r[0];
            }),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeDrizzleGateway.update",
            id: challengeIdStr,
            cause: error,
          }),
      });

      return yield* challengeMapper.toDomain(dbChallenge);
    });
  }

  delete(id: ChallengeId, authToken?: string) {
    const challengeIdStr = ChallengeId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // First fetch the challenge to get tripId for auth check
      const dbChallenge = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r: ChallengeSelect[]) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeDrizzleGateway.delete",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!dbChallenge) {
        return;
      }

      // Verify auth if token provided - check trip membership (organizer+ required)
      if (authToken) {
        yield* self.verifyTripMembership(authToken, dbChallenge.tripId);
        // Note: Additional role check (organizer+) would be done at use case layer
      }

      yield* Effect.tryPromise({
        try: () =>
          self.db
            .delete(challenges)
            .where(eq(challenges.id, challengeIdStr)),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeDrizzleGateway.delete",
            id: challengeIdStr,
            cause: error,
          }),
      });
    });
  }

  exists(id: ChallengeId) {
    const challengeIdStr = ChallengeId.toString(id);

    return this.tryPromise(
      "exists",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(challenges)
          .where(eq(challenges.id, challengeIdStr));
        return (result[0]?.count ?? 0) > 0;
      },
      challengeIdStr,
    );
  }

  countByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return this.tryPromise(
      "countByTripId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(challenges)
          .where(eq(challenges.tripId, tripIdStr));
        return result[0]?.count ?? 0;
      },
      tripIdStr,
    );
  }

  activateVisibleChallenges(tripId?: TripId, authToken?: string) {
    const tripIdStr = tripId ? TripId.toString(tripId) : undefined;
    const self = this;

    return Effect.gen(function* () {
      // Verify auth if token provided - check trip membership (admin required for this operation)
      if (authToken && tripIdStr) {
        yield* self.verifyTripMembership(authToken, tripIdStr);
        // Note: Additional admin role check would be done at use case layer
      }

      if (tripIdStr) {
        yield* Effect.tryPromise({
          try: () =>
            self.db
              .update(challenges)
              .set({ status: "ACTIVE", updatedAt: new Date() })
              .where(
                and(
                  eq(challenges.tripId, tripIdStr),
                  eq(challenges.status, "VISIBLE"),
                ),
              ),
          catch: (error) =>
            new DatabaseError({
              operation: "ChallengeDrizzleGateway.activateVisibleChallenges",
              id: tripIdStr,
              cause: error,
            }),
        });
      } else {
        yield* Effect.tryPromise({
          try: () =>
            self.db
              .update(challenges)
              .set({ status: "ACTIVE", updatedAt: new Date() })
              .where(eq(challenges.status, "VISIBLE")),
          catch: (error) =>
            new DatabaseError({
              operation: "ChallengeDrizzleGateway.activateVisibleChallenges",
              cause: error,
            }),
        });
      }
    });
  }
}
