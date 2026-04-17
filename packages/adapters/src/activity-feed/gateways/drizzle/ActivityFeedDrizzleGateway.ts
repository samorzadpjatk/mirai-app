import { Effect } from "effect";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  activityFeed,
  type ActivityFeedSelect,
} from "@mirai-app/frameworks/drizzle";
import {
  ActivityFeed,
  ActivityFeedId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IActivityFeedPort } from "@mirai-app/use-cases";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { activityFeedMapper } from "../../mappers/ActivityFeedMapper";

/**
 * ActivityFeed Drizzle Gateway
 *
 * Implements IActivityFeedPort using Drizzle ORM for database operations.
 */
export class ActivityFeedDrizzleGateway
  extends BaseDrizzleGateway
  implements IActivityFeedPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(
    id: ActivityFeedId,
  ): Effect.Effect<ActivityFeed | null, DatabaseError, never> {
    const idStr = ActivityFeedId.toString(id);
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select()
          .from(activityFeed)
          .where(eq(activityFeed.id, idStr))
          .limit(1);
        return result[0] ?? null;
      },
      idStr,
    ).pipe(
      Effect.flatMap((dbActivity: ActivityFeedSelect | null) =>
        dbActivity
          ? activityFeedMapper.toDomain(dbActivity).pipe(
              Effect.mapError(
                (validationError) =>
                  new DatabaseError({
                    operation: "findById",
                    id: idStr,
                    cause: validationError,
                  }),
              ),
            )
          : Effect.succeed(null),
      ),
    );
  }

  findByTripId(
    tripId: TripId,
  ): Effect.Effect<ActivityFeed[], DatabaseError, never> {
    const tripIdStr = TripId.toString(tripId);
    return this.tryPromise(
      "findByTripId",
      async () => {
        const results = await this.db
          .select()
          .from(activityFeed)
          .where(eq(activityFeed.tripId, tripIdStr))
          .orderBy(desc(activityFeed.isPinned), desc(activityFeed.createdAt));
        return results;
      },
      tripIdStr,
    ).pipe(
      Effect.flatMap((dbActivities: ActivityFeedSelect[]) =>
        Effect.forEach(dbActivities, (dbActivity) =>
          activityFeedMapper.toDomain(dbActivity).pipe(
            Effect.mapError(
              (validationError) =>
                new DatabaseError({
                  operation: "findByTripId",
                  id: tripIdStr,
                  cause: validationError,
                }),
            ),
          ),
        ),
      ),
    );
  }

  findByTripIdPaginated(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
      includeHidden?: boolean;
    },
  ): Effect.Effect<
    { activities: ActivityFeed[]; nextCursor: string | null; hasMore: boolean },
    DatabaseError,
    never
  > {
    const tripIdStr = TripId.toString(tripId);
    const limit = params.limit;
    const includeHidden = params.includeHidden ?? false;

    return this.tryPromise(
      "findByTripIdPaginated",
      async () => {
        const conditions = [eq(activityFeed.tripId, tripIdStr)];

        if (!includeHidden) {
          conditions.push(eq(activityFeed.isHidden, false));
        }

        if (params.cursor) {
          const cursorDate = new Date(params.cursor);
          conditions.push(gt(activityFeed.createdAt, cursorDate));
        }

        const results = await this.db
          .select()
          .from(activityFeed)
          .where(and(...conditions))
          .orderBy(desc(activityFeed.isPinned), desc(activityFeed.createdAt))
          .limit(limit + 1);

        return results;
      },
      tripIdStr,
    ).pipe(
      Effect.flatMap((dbActivities: ActivityFeedSelect[]) => {
        const hasMore = dbActivities.length > limit;
        const activitiesToReturn = hasMore
          ? dbActivities.slice(0, limit)
          : dbActivities;

        return Effect.forEach(activitiesToReturn, (dbActivity) =>
          activityFeedMapper.toDomain(dbActivity).pipe(
            Effect.mapError(
              (validationError) =>
                new DatabaseError({
                  operation: "findByTripIdPaginated",
                  id: tripIdStr,
                  cause: validationError,
                }),
            ),
          ),
        ).pipe(
          Effect.map((domainActivities) => {
            const lastActivity =
              activitiesToReturn[activitiesToReturn.length - 1];
            const nextCursor =
              hasMore && lastActivity
                ? lastActivity.createdAt.toISOString()
                : null;

            return {
              activities: domainActivities,
              nextCursor,
              hasMore,
            };
          }),
        );
      }),
    );
  }

  findByTripIdForModeration(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
    },
  ): Effect.Effect<
    { activities: ActivityFeed[]; nextCursor: string | null; hasMore: boolean },
    DatabaseError,
    never
  > {
    const tripIdStr = TripId.toString(tripId);
    const limit = params.limit;

    return this.tryPromise(
      "findByTripIdForModeration",
      async () => {
        const conditions = [eq(activityFeed.tripId, tripIdStr)];

        if (params.cursor) {
          const cursorDate = new Date(params.cursor);
          conditions.push(gt(activityFeed.createdAt, cursorDate));
        }

        const results = await this.db
          .select()
          .from(activityFeed)
          .where(and(...conditions))
          .orderBy(desc(activityFeed.createdAt))
          .limit(limit + 1);

        return results;
      },
      tripIdStr,
    ).pipe(
      Effect.flatMap((dbActivities: ActivityFeedSelect[]) => {
        const hasMore = dbActivities.length > limit;
        const activitiesToReturn = hasMore
          ? dbActivities.slice(0, limit)
          : dbActivities;

        return Effect.forEach(activitiesToReturn, (dbActivity) =>
          activityFeedMapper.toDomain(dbActivity).pipe(
            Effect.mapError(
              (validationError) =>
                new DatabaseError({
                  operation: "findByTripIdForModeration",
                  id: tripIdStr,
                  cause: validationError,
                }),
            ),
          ),
        ).pipe(
          Effect.map((domainActivities) => {
            const lastActivity =
              activitiesToReturn[activitiesToReturn.length - 1];
            const nextCursor =
              hasMore && lastActivity
                ? lastActivity.createdAt.toISOString()
                : null;

            return {
              activities: domainActivities,
              nextCursor,
              hasMore,
            };
          }),
        );
      }),
    );
  }

  create(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, DatabaseError, never> {
    const insertData = activityFeedMapper.toInsert(activity);
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(activityFeed)
          .values(insertData)
          .returning();
        if (!result) throw new Error("Failed to create activity");
        return result;
      },
      ActivityFeedId.toString(activity.id),
    ).pipe(
      Effect.flatMap((dbActivity: ActivityFeedSelect) =>
        activityFeedMapper.toDomain(dbActivity).pipe(
          Effect.mapError(
            (validationError) =>
              new DatabaseError({
                operation: "create",
                id: ActivityFeedId.toString(activity.id),
                cause: validationError,
              }),
          ),
        ),
      ),
    );
  }

  update(
    activity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, DatabaseError, never> {
    const updateData = activityFeedMapper.toUpdate(activity);
    return this.tryPromise(
      "update",
      async () => {
        const [result] = await this.db
          .update(activityFeed)
          .set(updateData)
          .where(eq(activityFeed.id, ActivityFeedId.toString(activity.id)))
          .returning();
        if (!result) throw new Error("Failed to update activity");
        return result;
      },
      ActivityFeedId.toString(activity.id),
    ).pipe(
      Effect.flatMap((dbActivity: ActivityFeedSelect) =>
        activityFeedMapper.toDomain(dbActivity).pipe(
          Effect.mapError(
            (validationError) =>
              new DatabaseError({
                operation: "update",
                id: ActivityFeedId.toString(activity.id),
                cause: validationError,
              }),
          ),
        ),
      ),
    );
  }

  delete(id: ActivityFeedId): Effect.Effect<void, DatabaseError, never> {
    const idStr = ActivityFeedId.toString(id);
    return this.tryPromise(
      "delete",
      async () => {
        await this.db.delete(activityFeed).where(eq(activityFeed.id, idStr));
      },
      idStr,
    );
  }

  setPinned(
    id: ActivityFeedId,
    isPinned: boolean,
  ): Effect.Effect<ActivityFeed, DatabaseError, never> {
    const idStr = ActivityFeedId.toString(id);
    return this.tryPromise(
      "setPinned",
      async () => {
        const [result] = await this.db
          .update(activityFeed)
          .set({ isPinned, updatedAt: new Date() })
          .where(eq(activityFeed.id, idStr))
          .returning();
        if (!result) throw new Error("Failed to update activity pinned status");
        return result;
      },
      idStr,
    ).pipe(
      Effect.flatMap((dbActivity: ActivityFeedSelect) =>
        activityFeedMapper.toDomain(dbActivity).pipe(
          Effect.mapError(
            (validationError) =>
              new DatabaseError({
                operation: "setPinned",
                id: idStr,
                cause: validationError,
              }),
          ),
        ),
      ),
    );
  }

  exists(id: ActivityFeedId): Effect.Effect<boolean, DatabaseError, never> {
    const idStr = ActivityFeedId.toString(id);
    return this.tryPromise(
      "exists",
      async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(activityFeed)
          .where(eq(activityFeed.id, idStr));
        return (result[0]?.count ?? 0) > 0;
      },
      idStr,
    );
  }
}
