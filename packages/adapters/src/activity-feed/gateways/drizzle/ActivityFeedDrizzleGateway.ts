import { Effect } from "effect";
import { eq, and, desc, gt } from "drizzle-orm";
import {
  activityFeed,
} from "../../../infrastructure/drizzle";
import * as domain from "@mirai-app/domain";
import { type IActivityFeedPort } from "@mirai-app/use-cases/activity-feed/ports";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { activityFeedMapper } from "../../mappers/ActivityFeedMapper";

/**
 * ActivityFeed Drizzle Gateway
 *
 * Implements IActivityFeedPort using Drizzle ORM for database operations.
 *
 * Authorization Pattern:
 * This gateway uses the AuthContext pattern for authorization. All methods
 * access authentication context via `yield* AuthContextTag` and perform strict
 * authorization checks via `yield* AuthZPortTag.verifyAccess()` before executing
 * database operations.
 *
 * ActivityFeed is trip-scoped:
 * - Users can only see posts from trips they're members of
 * - ORGANIZER+ can create posts
 * - Uses "read" permission for all query operations
 * - Uses "write" permission for mutations (create, update, delete)
 */
export class ActivityFeedDrizzleGateway
  extends BaseDrizzleGateway
  implements IActivityFeedPort
{
  findById(id: domain.ActivityFeedId) {
    const self = this;
    const idStr = domain.ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch the activity first to get tripId for auth check
      const result = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select()
            .from(activityFeed)
            .where(eq(activityFeed.id, idStr))
            .limit(1);
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "findById",
            id: idStr,
            cause: error,
          }),
      });

      const dbActivity = result[0] ?? null;

      // Verify access if authenticated and activity exists
      if (authCtx.isAuthenticated && dbActivity) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: dbActivity.tripId,
          requiredPermission: "read",
        });
      }

      return dbActivity
        ? yield* activityFeedMapper.toDomain(dbActivity)
        : null;
    });
  }

  findByTripId(tripId: domain.TripId) {
    const self = this;
    const tripIdStr = domain.TripId.toString(tripId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user is member of the trip
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "read",
        });
      }

      const results = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select()
            .from(activityFeed)
            .where(eq(activityFeed.tripId, tripIdStr))
            .orderBy(desc(activityFeed.isPinned), desc(activityFeed.createdAt));
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "findByTripId",
            id: tripIdStr,
            cause: error,
          }),
      });

      return yield* Effect.forEach(results, (dbActivity) =>
        activityFeedMapper.toDomain(dbActivity),
      );
    });
  }

  findVisibleByTripId(tripId: domain.TripId) {
    const self = this;
    const tripIdStr = domain.TripId.toString(tripId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user is member of the trip
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "read",
        });
      }

      const results = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select()
            .from(activityFeed)
            .where(
              and(
                eq(activityFeed.tripId, tripIdStr),
                eq(activityFeed.isHidden, false),
              ),
            )
            .orderBy(desc(activityFeed.isPinned), desc(activityFeed.createdAt));
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "findVisibleByTripId",
            id: tripIdStr,
            cause: error,
          }),
      });

      return yield* Effect.forEach(results, (dbActivity) =>
        activityFeedMapper.toDomain(dbActivity),
      );
    });
  }

  findPinnedByTripId(tripId: domain.TripId) {
    const self = this;
    const tripIdStr = domain.TripId.toString(tripId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user is member of the trip
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "read",
        });
      }

      const results = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select()
            .from(activityFeed)
            .where(
              and(
                eq(activityFeed.tripId, tripIdStr),
                eq(activityFeed.isPinned, true),
                eq(activityFeed.isHidden, false),
              ),
            )
            .orderBy(desc(activityFeed.createdAt));
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "findPinnedByTripId",
            id: tripIdStr,
            cause: error,
          }),
      });

      return yield* Effect.forEach(results, (dbActivity) =>
        activityFeedMapper.toDomain(dbActivity),
      );
    });
  }

  findByTripIdPaginated(
    tripId: domain.TripId,
    params: {
      limit: number;
      cursor?: string | null;
      includeHidden?: boolean;
    },
  ) {
    const self = this;
    const tripIdStr = domain.TripId.toString(tripId);
    const limit = params.limit;
    const includeHidden = params.includeHidden ?? false;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user is member of the trip
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "read",
        });
      }

      const results = yield* Effect.tryPromise({
        try: async () => {
          const conditions = [eq(activityFeed.tripId, tripIdStr)];

          if (!includeHidden) {
            conditions.push(eq(activityFeed.isHidden, false));
          }

          if (params.cursor) {
            const cursorDate = new Date(params.cursor);
            conditions.push(gt(activityFeed.createdAt, cursorDate));
          }

          return await self.db
            .select()
            .from(activityFeed)
            .where(and(...conditions))
            .orderBy(desc(activityFeed.isPinned), desc(activityFeed.createdAt))
            .limit(limit + 1);
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "findByTripIdPaginated",
            id: tripIdStr,
            cause: error,
          }),
      });

      const hasMore = results.length > limit;
      const activitiesToReturn = hasMore ? results.slice(0, limit) : results;

      const domainActivities = yield* Effect.forEach(
        activitiesToReturn,
        (dbActivity) => activityFeedMapper.toDomain(dbActivity),
      );

      const lastActivity = activitiesToReturn[activitiesToReturn.length - 1];
      const nextCursor =
        hasMore && lastActivity ? lastActivity.createdAt.toISOString() : null;

      return {
        activities: domainActivities,
        nextCursor,
        hasMore,
      };
    });
  }

  findByTripIdForModeration(
    tripId: domain.TripId,
    params: {
      limit: number;
      cursor?: string | null;
    },
  ) {
    const self = this;
    const tripIdStr = domain.TripId.toString(tripId);
    const limit = params.limit;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Moderation requires admin permission
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "admin",
        });
      }

      const results = yield* Effect.tryPromise({
        try: async () => {
          const conditions = [eq(activityFeed.tripId, tripIdStr)];

          if (params.cursor) {
            const cursorDate = new Date(params.cursor);
            conditions.push(gt(activityFeed.createdAt, cursorDate));
          }

          return await self.db
            .select()
            .from(activityFeed)
            .where(and(...conditions))
            .orderBy(desc(activityFeed.createdAt))
            .limit(limit + 1);
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "findByTripIdForModeration",
            id: tripIdStr,
            cause: error,
          }),
      });

      const hasMore = results.length > limit;
      const activitiesToReturn = hasMore ? results.slice(0, limit) : results;

      const domainActivities = yield* Effect.forEach(
        activitiesToReturn,
        (dbActivity) => activityFeedMapper.toDomain(dbActivity),
      );

      const lastActivity = activitiesToReturn[activitiesToReturn.length - 1];
      const nextCursor =
        hasMore && lastActivity ? lastActivity.createdAt.toISOString() : null;

      return {
        activities: domainActivities,
        nextCursor,
        hasMore,
      };
    });
  }

  create(activity: domain.ActivityFeed) {
    const self = this;
    const insertData = activityFeedMapper.toInsert(activity);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // ORGANIZER+ can create posts
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: domain.TripId.toString(activity.tripId),
          requiredPermission: "write",
        });
      }

      const result = yield* Effect.tryPromise({
        try: async () => {
          const [r] = await self.db
            .insert(activityFeed)
            .values(insertData)
            .returning();
          if (!r) throw new Error("Failed to create activity");
          return r;
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "create",
            id: domain.ActivityFeedId.toString(activity.id),
            cause: error,
          }),
      });

      return yield* activityFeedMapper.toDomain(result);
    });
  }

  update(activity: domain.ActivityFeed) {
    const self = this;
    const updateData = activityFeedMapper.toUpdate(activity);
    const idStr = domain.ActivityFeedId.toString(activity.id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch existing to get tripId for auth check
      const existing = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select({ tripId: activityFeed.tripId })
            .from(activityFeed)
            .where(eq(activityFeed.id, idStr))
            .limit(1);
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });

      const tripId = existing[0]?.tripId;

      // Verify write access
      if (authCtx.isAuthenticated && tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "write",
        });
      }

      const result = yield* Effect.tryPromise({
        try: async () => {
          const [r] = await self.db
            .update(activityFeed)
            .set(updateData)
            .where(eq(activityFeed.id, idStr))
            .returning();
          if (!r) throw new Error("Failed to update activity");
          return r;
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });

      return yield* activityFeedMapper.toDomain(result);
    });
  }

  delete(id: domain.ActivityFeedId) {
    const self = this;
    const idStr = domain.ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch existing to get tripId for auth check
      const existing = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select({ tripId: activityFeed.tripId })
            .from(activityFeed)
            .where(eq(activityFeed.id, idStr))
            .limit(1);
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });

      const tripId = existing[0]?.tripId;

      // Verify admin access for deletes
      if (authCtx.isAuthenticated && tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "admin",
        });
      }

      yield* Effect.tryPromise({
        try: async () => {
          await self.db.delete(activityFeed).where(eq(activityFeed.id, idStr));
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });
    });
  }

  setPinned(id: domain.ActivityFeedId, isPinned: boolean) {
    const self = this;
    const idStr = domain.ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch existing to get tripId for auth check
      const existing = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select({ tripId: activityFeed.tripId })
            .from(activityFeed)
            .where(eq(activityFeed.id, idStr))
            .limit(1);
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "setPinned",
            id: idStr,
            cause: error,
          }),
      });

      const tripId = existing[0]?.tripId;

      // Verify admin access for pinning
      if (authCtx.isAuthenticated && tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "admin",
        });
      }

      const result = yield* Effect.tryPromise({
        try: async () => {
          const [r] = await self.db
            .update(activityFeed)
            .set({ isPinned, updatedAt: new Date() })
            .where(eq(activityFeed.id, idStr))
            .returning();
          if (!r) throw new Error("Failed to update activity pinned status");
          return r;
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "setPinned",
            id: idStr,
            cause: error,
          }),
      });

      return yield* activityFeedMapper.toDomain(result);
    });
  }

  exists(id: domain.ActivityFeedId) {
    const self = this;
    const idStr = domain.ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // For exists check, we need to verify read access if authenticated
      // First fetch to get tripId
      const existing = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select({ tripId: activityFeed.tripId })
            .from(activityFeed)
            .where(eq(activityFeed.id, idStr))
            .limit(1);
        },
        catch: (error) =>
          new domain.DatabaseError({
            operation: "exists",
            id: idStr,
            cause: error,
          }),
      });

      const tripId = existing[0]?.tripId;

      if (authCtx.isAuthenticated && tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return tripId !== undefined;
    });
  }
}
