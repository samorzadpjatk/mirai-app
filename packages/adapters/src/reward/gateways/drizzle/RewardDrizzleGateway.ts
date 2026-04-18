import { Effect } from "effect";
import { eq, count, and, sql } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import { rewards, type RewardSelect } from "../../../infrastructure/drizzle";
import { Reward, RewardId, TripId, DatabaseError } from "@mirai-app/domain";
import type { IRewardPort } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { rewardMapper } from "../../mappers/RewardMapper";

/**
 * Reward Drizzle Gateway
 *
 * Implements IRewardPort using Drizzle ORM for database operations.
 */
export class RewardDrizzleGateway
  extends BaseDrizzleGateway
  implements IRewardPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: RewardId) {
    const idStr = RewardId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // First get the reward
      const rewardResult = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select()
            .from(rewards)
            .where(eq(rewards.id, idStr))
            .limit(1);
          return result[0] ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findById",
            id: idStr,
            cause: error,
          }),
      });

      // If authenticated and reward exists, verify access
      if (authCtx.isAuthenticated && rewardResult) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: rewardResult.tripId,
          requiredPermission: "read",
        });
      }

      return rewardResult;
    }).pipe(
      Effect.flatMap((dbReward: RewardSelect | null) => {
        if (!dbReward) {
          return Effect.succeed(null);
        }
        return rewardMapper.toDomain(dbReward);
      }),
    );
  }

  findByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select()
          .from(rewards)
          .where(eq(rewards.tripId, tripIdStr))
          .orderBy(sql`${rewards.createdAt} DESC`);
        return results;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          id: tripIdStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbRewards: RewardSelect[]) =>
        Effect.forEach(dbRewards, (dbReward) =>
          rewardMapper.toDomain(dbReward),
        ),
      ),
    );
  }

  findAvailableByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select()
          .from(rewards)
          .where(
            and(
              eq(rewards.tripId, tripIdStr),
              eq(rewards.isHidden, false),
              sql`${rewards.availableQuantity} > 0`,
            ),
          )
          .orderBy(sql`${rewards.createdAt} DESC`);
        return results;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAvailableByTripId",
          id: tripIdStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbRewards: RewardSelect[]) =>
        Effect.forEach(dbRewards, (dbReward) =>
          rewardMapper.toDomain(dbReward),
        ),
      ),
    );
  }

  create(reward: Reward) {
    const insertData = rewardMapper.toInsert(reward);
    const idStr = RewardId.toString(reward.id);
    const tripIdStr = TripId.toString(reward.tripId);
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

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .insert(rewards)
            .values(insertData)
            .returning();
          if (!result) throw new Error("Failed to create reward");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(
      Effect.flatMap((dbReward: RewardSelect) =>
        rewardMapper.toDomain(dbReward),
      ),
    );
  }

  update(reward: Reward) {
    const updateData = rewardMapper.toUpdate(reward);
    const idStr = RewardId.toString(reward.id);
    const tripIdStr = TripId.toString(reward.tripId);
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

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .update(rewards)
            .set(updateData)
            .where(eq(rewards.id, idStr))
            .returning();
          if (!result) throw new Error("Failed to update reward");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(
      Effect.flatMap((dbReward: RewardSelect) =>
        rewardMapper.toDomain(dbReward),
      ),
    );
  }

  delete(id: RewardId, tripId: TripId) {
    const idStr = RewardId.toString(id);
    const tripIdStr = TripId.toString(tripId);
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

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          await self.db.delete(rewards).where(eq(rewards.id, idStr));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });
    });
  }

  exists(id: RewardId) {
    const idStr = RewardId.toString(id);

    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: count() })
          .from(rewards)
          .where(eq(rewards.id, idStr));
        return (result[0]?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "exists",
          id: idStr,
          cause: error,
        }),
    });
  }

  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.tryPromise({
      try: async () => {
        const [items, totalResult] = await Promise.all([
          this.db
            .select()
            .from(rewards)
            .where(eq(rewards.tripId, tripIdStr))
            .orderBy(sql`${rewards.createdAt} DESC`)
            .limit(params.limit)
            .offset(params.offset),
          this.db
            .select({ count: count() })
            .from(rewards)
            .where(eq(rewards.tripId, tripIdStr)),
        ]);

        return { items, total: totalResult[0]?.count ?? 0 };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findPaginatedByTripId",
          id: tripIdStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap(
        ({ items, total }: { items: RewardSelect[]; total: number }) =>
          Effect.forEach(items, (item) => rewardMapper.toDomain(item)).pipe(
            Effect.map((domainRewards) => ({
              rewards: domainRewards,
              total,
              hasMore: params.offset + items.length < total,
            })),
          ),
      ),
    );
  }

  findAllPaginated(params: { limit: number; offset: number }) {
    return Effect.tryPromise({
      try: async () => {
        const [items, totalResult] = await Promise.all([
          this.db
            .select()
            .from(rewards)
            .orderBy(sql`${rewards.createdAt} DESC`)
            .limit(params.limit)
            .offset(params.offset),
          this.db.select({ count: count() }).from(rewards),
        ]);

        return { items, total: totalResult[0]?.count ?? 0 };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAllPaginated",
          cause: error,
        }),
    }).pipe(
      Effect.flatMap(
        ({ items, total }: { items: RewardSelect[]; total: number }) =>
          Effect.forEach(items, (item) => rewardMapper.toDomain(item)).pipe(
            Effect.map((domainRewards) => ({
              rewards: domainRewards,
              total,
              hasMore: params.offset + items.length < total,
            })),
          ),
      ),
    );
  }

  countByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: count() })
          .from(rewards)
          .where(eq(rewards.tripId, tripIdStr));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByTripId",
          id: tripIdStr,
          cause: error,
        }),
    });
  }
}
