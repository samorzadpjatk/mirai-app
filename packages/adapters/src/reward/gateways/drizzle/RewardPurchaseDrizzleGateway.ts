import { Effect } from "effect";
import { eq, count, sql, and } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  rewardPurchases,
  rewards,
  type RewardPurchaseSelect,
} from "@mirai-app/frameworks/drizzle";
import {
  RewardPurchase,
  RewardPurchaseId,
  RewardId,
  GroupId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IRewardPurchasePort } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { rewardPurchaseMapper } from "../../mappers/RewardPurchaseMapper";

/**
 * Reward Purchase Drizzle Gateway
 *
 * Implements IRewardPurchasePort using Drizzle ORM for database operations.
 */
export class RewardPurchaseDrizzleGateway
  extends BaseDrizzleGateway
  implements IRewardPurchasePort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: RewardPurchaseId) {
    const idStr = RewardPurchaseId.toString(id);

    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select()
          .from(rewardPurchases)
          .where(eq(rewardPurchases.id, idStr))
          .limit(1);
        return result[0] ?? null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          id: idStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbPurchase: RewardPurchaseSelect | null) => {
        if (!dbPurchase) {
          return Effect.succeed(null);
        }
        return rewardPurchaseMapper.toDomain(dbPurchase);
      }),
    );
  }

  findByRewardId(rewardId: RewardId) {
    const rewardIdStr = RewardId.toString(rewardId);

    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select()
          .from(rewardPurchases)
          .where(eq(rewardPurchases.rewardId, rewardIdStr))
          .orderBy(sql`${rewardPurchases.createdAt} DESC`);
        return results;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByRewardId",
          id: rewardIdStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbPurchases: RewardPurchaseSelect[]) =>
        Effect.forEach(dbPurchases, (dbPurchase) =>
          rewardPurchaseMapper.toDomain(dbPurchase),
        ),
      ),
    );
  }

  findByGroupId(groupId: GroupId) {
    const groupIdStr = GroupId.toString(groupId);

    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select()
          .from(rewardPurchases)
          .where(eq(rewardPurchases.groupId, groupIdStr))
          .orderBy(sql`${rewardPurchases.createdAt} DESC`);
        return results;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByGroupId",
          id: groupIdStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbPurchases: RewardPurchaseSelect[]) =>
        Effect.forEach(dbPurchases, (dbPurchase) =>
          rewardPurchaseMapper.toDomain(dbPurchase),
        ),
      ),
    );
  }

  findByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.tryPromise({
      try: async () => {
        // Join with rewards to filter by tripId
        const results = await this.db
          .select({
            purchase: rewardPurchases,
          })
          .from(rewardPurchases)
          .innerJoin(rewards, eq(rewardPurchases.rewardId, rewards.id))
          .where(eq(rewards.tripId, tripIdStr))
          .orderBy(sql`${rewardPurchases.createdAt} DESC`);

        return results.map((r) => r.purchase);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          id: tripIdStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbPurchases: RewardPurchaseSelect[]) =>
        Effect.forEach(dbPurchases, (dbPurchase) =>
          rewardPurchaseMapper.toDomain(dbPurchase),
        ),
      ),
    );
  }

  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.tryPromise({
      try: async () => {
        // Get total count
        const countResult = await this.db
          .select({ count: count() })
          .from(rewardPurchases)
          .innerJoin(rewards, eq(rewardPurchases.rewardId, rewards.id))
          .where(eq(rewards.tripId, tripIdStr));
        const total = countResult[0]?.count ?? 0;

        // Get paginated results
        const items = await this.db
          .select({
            purchase: rewardPurchases,
          })
          .from(rewardPurchases)
          .innerJoin(rewards, eq(rewardPurchases.rewardId, rewards.id))
          .where(eq(rewards.tripId, tripIdStr))
          .orderBy(sql`${rewardPurchases.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset);

        return {
          items: items.map((r) => r.purchase),
          total,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findPaginatedByTripId",
          id: tripIdStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap(
        ({ items, total }: { items: RewardPurchaseSelect[]; total: number }) =>
          Effect.forEach(items, (item) =>
            rewardPurchaseMapper.toDomain(item),
          ).pipe(
            Effect.map((domainPurchases) => ({
              purchases: domainPurchases,
              total,
              hasMore: params.offset + items.length < total,
            })),
          ),
      ),
    );
  }

  findPaginatedByTripIdAndGroupId(
    tripId: TripId,
    groupId: GroupId,
    params: { limit: number; offset: number },
  ) {
    const tripIdStr = TripId.toString(tripId);
    const groupIdStr = GroupId.toString(groupId);

    return Effect.tryPromise({
      try: async () => {
        // Get total count with both tripId (via reward join) and groupId filters
        const countResult = await this.db
          .select({ count: count() })
          .from(rewardPurchases)
          .innerJoin(rewards, eq(rewardPurchases.rewardId, rewards.id))
          .where(
            and(
              eq(rewards.tripId, tripIdStr),
              eq(rewardPurchases.groupId, groupIdStr),
            ),
          );
        const total = countResult[0]?.count ?? 0;

        // Get paginated results with both filters
        const items = await this.db
          .select({
            purchase: rewardPurchases,
          })
          .from(rewardPurchases)
          .innerJoin(rewards, eq(rewardPurchases.rewardId, rewards.id))
          .where(
            and(
              eq(rewards.tripId, tripIdStr),
              eq(rewardPurchases.groupId, groupIdStr),
            ),
          )
          .orderBy(sql`${rewardPurchases.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset);

        return {
          items: items.map((r) => r.purchase),
          total,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findPaginatedByTripIdAndGroupId",
          id: `${tripIdStr}:${groupIdStr}`,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap(
        ({ items, total }: { items: RewardPurchaseSelect[]; total: number }) =>
          Effect.forEach(items, (item) =>
            rewardPurchaseMapper.toDomain(item),
          ).pipe(
            Effect.map((domainPurchases) => ({
              purchases: domainPurchases,
              total,
              hasMore: params.offset + items.length < total,
            })),
          ),
      ),
    );
  }

  create(purchase: RewardPurchase) {
    const insertData = rewardPurchaseMapper.toInsert(purchase);
    const idStr = RewardPurchaseId.toString(purchase.id);

    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .insert(rewardPurchases)
          .values(insertData)
          .returning();
        if (!result) throw new Error("Failed to create reward purchase");
        return result;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          id: idStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbPurchase: RewardPurchaseSelect) =>
        rewardPurchaseMapper.toDomain(dbPurchase),
      ),
    );
  }

  update(purchase: RewardPurchase) {
    const updateData = rewardPurchaseMapper.toUpdate(purchase);
    const idStr = RewardPurchaseId.toString(purchase.id);

    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .update(rewardPurchases)
          .set(updateData)
          .where(eq(rewardPurchases.id, idStr))
          .returning();
        if (!result) throw new Error("Failed to update reward purchase");
        return result;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "update",
          id: idStr,
          cause: error,
        }),
    }).pipe(
      Effect.flatMap((dbPurchase: RewardPurchaseSelect) =>
        rewardPurchaseMapper.toDomain(dbPurchase),
      ),
    );
  }

  delete(id: RewardPurchaseId) {
    const idStr = RewardPurchaseId.toString(id);

    return Effect.tryPromise({
      try: async () => {
        await this.db
          .delete(rewardPurchases)
          .where(eq(rewardPurchases.id, idStr));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          id: idStr,
          cause: error,
        }),
    });
  }

  exists(id: RewardPurchaseId) {
    const idStr = RewardPurchaseId.toString(id);

    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: count() })
          .from(rewardPurchases)
          .where(eq(rewardPurchases.id, idStr));
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

  countByRewardId(rewardId: RewardId) {
    const rewardIdStr = RewardId.toString(rewardId);

    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: count() })
          .from(rewardPurchases)
          .where(eq(rewardPurchases.rewardId, rewardIdStr));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByRewardId",
          id: rewardIdStr,
          cause: error,
        }),
    });
  }

  countByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: count() })
          .from(rewardPurchases)
          .innerJoin(rewards, eq(rewardPurchases.rewardId, rewards.id))
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
