import { Effect } from "effect";
import { eq, count, and, sql } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  challenges,
  type ChallengeSelect,
} from "../../../infrastructure/drizzle";
import {
  Challenge,
  ChallengeId,
  TripId,
  DatabaseError,
  type IChallengePort,
} from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { challengeMapper } from "../../mappers/ChallengeMapper";

/**
 * Challenge Drizzle Gateway
 *
 * Implements IChallengePort using Drizzle ORM for database operations.
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 * Trip membership checks use tripRoles from AuthContext.
 */
export class ChallengeDrizzleGateway
  extends BaseDrizzleGateway
  implements IChallengePort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: ChallengeId) {
    const challengeIdStr = ChallengeId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // First, fetch the challenge
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

      // If authenticated, verify access using tripRoles from context
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: dbChallenge.tripId,
          requiredPermission: "read",
        });
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

  create(challenge: Challenge) {
    const insertData = challengeMapper.toInsert(challenge);
    const tripIdStr = TripId.toString(challenge.tripId);
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
          resourceId: tripIdStr,
          requiredPermission: "write",
        });
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

  update(challenge: Challenge) {
    const updateData = challengeMapper.toUpdate(challenge);
    const challengeIdStr = ChallengeId.toString(challenge.id);
    const tripIdStr = TripId.toString(challenge.tripId);
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
          resourceId: tripIdStr,
          requiredPermission: "write",
        });
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

  delete(id: ChallengeId) {
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

      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: dbChallenge.tripId,
          requiredPermission: "write",
        });
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

  activateVisibleChallenges(tripId?: TripId) {
    const tripIdStr = tripId ? TripId.toString(tripId) : undefined;
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission if tripId provided
      if (tripIdStr) {
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

  findAll() {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated (admin only)
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "challenge",
          resourceId: "*",
          requiredPermission: "admin",
        });
      }

      return yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challenges)
            .orderBy(sql`${challenges.createdAt} DESC`),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeDrizzleGateway.findAll",
            cause: error,
          }),
      });
    }).pipe(
      Effect.flatMap((dbChallenges: ChallengeSelect[]) =>
        Effect.forEach(dbChallenges, (dbChallenge) =>
          challengeMapper.toDomain(dbChallenge),
        ),
      ),
    );
  }
}
