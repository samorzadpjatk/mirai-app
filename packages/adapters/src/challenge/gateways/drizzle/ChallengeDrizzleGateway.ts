import { Effect } from "effect";
import { eq, count, and, sql } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  challenges,
  type ChallengeSelect,
} from "@mirai-app/frameworks/drizzle";
import { Challenge, ChallengeId, DatabaseError } from "@mirai-app/domain";
import type { IChallengePort } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { challengeMapper } from "../../mappers/ChallengeMapper";

/**
 * Challenge Drizzle Gateway
 *
 * Implements IChallengePort using Drizzle ORM for database operations.
 */
export class ChallengeDrizzleGateway
  extends BaseDrizzleGateway
  implements IChallengePort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: string): Effect.Effect<Challenge | null, DatabaseError, never> {
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select()
          .from(challenges)
          .where(eq(challenges.id, id))
          .limit(1);
        return result[0] ?? null;
      },
      id,
    ).pipe(
      Effect.flatMap((dbChallenge: ChallengeSelect | null) =>
        dbChallenge
          ? challengeMapper.toDomain(dbChallenge).pipe(
              Effect.mapError(
                (validationError) =>
                  new DatabaseError({
                    operation: "findById",
                    id,
                    cause: validationError,
                  }),
              ),
            )
          : Effect.succeed(null),
      ),
    );
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return this.tryPromise(
      "findByTripId",
      async () => {
        const results = await this.db
          .select()
          .from(challenges)
          .where(eq(challenges.tripId, tripId))
          .orderBy(sql`${challenges.createdAt} DESC`);
        return results;
      },
      tripId,
    ).pipe(
      Effect.flatMap((dbChallenges: ChallengeSelect[]) =>
        Effect.forEach(dbChallenges, (dbChallenge) =>
          challengeMapper.toDomain(dbChallenge).pipe(
            Effect.mapError(
              (validationError) =>
                new DatabaseError({
                  operation: "findByTripId",
                  id: tripId,
                  cause: validationError,
                }),
            ),
          ),
        ),
      ),
    );
  }

  findActiveByTripId(
    tripId: string,
    atDate?: Date,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    const checkDate = atDate ?? new Date();

    return this.tryPromise(
      "findActiveByTripId",
      async () => {
        const results = await this.db
          .select()
          .from(challenges)
          .where(
            and(
              eq(challenges.tripId, tripId),
              eq(challenges.status, "ACTIVE"),
              sql`${challenges.startTime} IS NULL OR ${challenges.startTime} <= ${checkDate}`,
              sql`${challenges.endTime} IS NULL OR ${challenges.endTime} >= ${checkDate}`,
            ),
          )
          .orderBy(sql`${challenges.createdAt} DESC`);
        return results;
      },
      tripId,
    ).pipe(
      Effect.flatMap((dbChallenges: ChallengeSelect[]) =>
        Effect.forEach(dbChallenges, (dbChallenge) =>
          challengeMapper.toDomain(dbChallenge).pipe(
            Effect.mapError(
              (validationError) =>
                new DatabaseError({
                  operation: "findActiveByTripId",
                  id: tripId,
                  cause: validationError,
                }),
            ),
          ),
        ),
      ),
    );
  }

  findPaginatedByTripId(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { challenges: Challenge[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  > {
    return this.tryPromise(
      "findPaginatedByTripId",
      async () => {
        const [items, totalResult] = await Promise.all([
          this.db
            .select()
            .from(challenges)
            .where(eq(challenges.tripId, tripId))
            .orderBy(sql`${challenges.createdAt} DESC`)
            .limit(params.limit)
            .offset(params.offset),
          this.db
            .select({ count: count() })
            .from(challenges)
            .where(eq(challenges.tripId, tripId)),
        ]);

        return { items, total: totalResult[0]?.count ?? 0 };
      },
      tripId,
    ).pipe(
      Effect.flatMap(
        ({ items, total }: { items: ChallengeSelect[]; total: number }) =>
          Effect.forEach(items, (item) =>
            challengeMapper.toDomain(item).pipe(
              Effect.mapError(
                (validationError) =>
                  new DatabaseError({
                    operation: "findPaginatedByTripId",
                    id: tripId,
                    cause: validationError,
                  }),
              ),
            ),
          ).pipe(
            Effect.map((domainChallenges) => ({
              challenges: domainChallenges,
              total,
              hasMore: params.offset + items.length < total,
            })),
          ),
      ),
    );
  }

  create(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never> {
    const insertData = challengeMapper.toInsert(challenge);
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(challenges)
          .values(insertData)
          .returning();
        if (!result) throw new Error("Failed to create challenge");
        return result;
      },
      ChallengeId.toString(challenge.id),
    ).pipe(
      Effect.flatMap((dbChallenge: ChallengeSelect) =>
        challengeMapper.toDomain(dbChallenge).pipe(
          Effect.mapError(
            (validationError) =>
              new DatabaseError({
                operation: "create",
                id: ChallengeId.toString(challenge.id),
                cause: validationError,
              }),
          ),
        ),
      ),
    );
  }

  update(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never> {
    const updateData = challengeMapper.toUpdate(challenge);
    return this.tryPromise(
      "update",
      async () => {
        const [result] = await this.db
          .update(challenges)
          .set(updateData)
          .where(eq(challenges.id, ChallengeId.toString(challenge.id)))
          .returning();
        if (!result) throw new Error("Failed to update challenge");
        return result;
      },
      ChallengeId.toString(challenge.id),
    ).pipe(
      Effect.flatMap((dbChallenge: ChallengeSelect) =>
        challengeMapper.toDomain(dbChallenge).pipe(
          Effect.mapError(
            (validationError) =>
              new DatabaseError({
                operation: "update",
                id: ChallengeId.toString(challenge.id),
                cause: validationError,
              }),
          ),
        ),
      ),
    );
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise(
      "delete",
      async () => {
        await this.db.delete(challenges).where(eq(challenges.id, id));
      },
      id,
    );
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.tryPromise(
      "exists",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(challenges)
          .where(eq(challenges.id, id));
        return (result[0]?.count ?? 0) > 0;
      },
      id,
    );
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "countByTripId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(challenges)
          .where(eq(challenges.tripId, tripId));
        return result[0]?.count ?? 0;
      },
      tripId,
    );
  }

  activateVisibleChallenges(
    tripId?: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise(
      "activateVisibleChallenges",
      async () => {
        if (tripId) {
          await this.db
            .update(challenges)
            .set({ status: "ACTIVE", updatedAt: new Date() })
            .where(
              and(
                eq(challenges.tripId, tripId),
                eq(challenges.status, "VISIBLE"),
              ),
            );
        } else {
          await this.db
            .update(challenges)
            .set({ status: "ACTIVE", updatedAt: new Date() })
            .where(eq(challenges.status, "VISIBLE"));
        }
      },
      tripId,
    );
  }
}
