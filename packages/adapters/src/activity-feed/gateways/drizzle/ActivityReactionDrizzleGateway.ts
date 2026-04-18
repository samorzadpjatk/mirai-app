import { Effect } from "effect";
import { eq, and, sql } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  activityReactions,
  activityFeed,
  type ActivityReactionSelect,
} from "../../../infrastructure/drizzle";
import {
  DatabaseError,
  ActivityReactionIdFactory,
  ActivityFeedIdFactory,
  UserId,
} from "@mirai-app/domain";
import {
  type IActivityReactionPort,
  type ActivityReaction,
  type ActivityReactionType,
} from "@mirai-app/use-cases/activity-feed/ports";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * ActivityReaction Drizzle Gateway
 *
 * Implements IActivityReactionPort using Drizzle ORM for database operations.
 *
 * Authorization Pattern:
 * This gateway uses the AuthContext pattern for authorization. All methods
 * access authentication context via `yield* AuthContextTag` and perform strict
 * authorization checks via `yield* AuthZPortTag.verifyAccess()` before executing
 * database operations.
 *
 * Activity reactions are trip-scoped (via activityId -> activityFeed -> tripId):
 * - Users can only react to activities in trips they're members of
 * - Reactions are user-specific (users can only modify their own reactions)
 * - Uses "read" permission for all query operations
 * - Uses "write" permission for mutations (create, delete)
 */
export class ActivityReactionDrizzleGateway
  extends BaseDrizzleGateway
  implements IActivityReactionPort
{
  /**
   * Helper to get tripId from activityId for auth checks
   */
  private getTripIdFromActivityId(activityId: string) {
    const self = this;
    return Effect.tryPromise({
      try: async () => {
        const result = await self.db
          .select({ tripId: activityFeed.tripId })
          .from(activityFeed)
          .where(eq(activityFeed.id, activityId))
          .limit(1);
        return result[0]?.tripId ?? null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getTripIdFromActivityId",
          id: activityId,
          cause: error,
        }),
    });
  }

  findById(id: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch reaction first to get activityId for auth check
      const result = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select()
            .from(activityReactions)
            .where(eq(activityReactions.id, id))
            .limit(1);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findById",
            id,
            cause: error,
          }),
      });

      const dbReaction = result[0] ?? null;

      // Verify access via activity's trip
      if (authCtx.isAuthenticated && dbReaction) {
        const tripId = yield* self.getTripIdFromActivityId(
          dbReaction.activityId,
        );
        if (tripId) {
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
      }

      return dbReaction ? self.toDomain(dbReaction) : null;
    });
  }

  findByActivityId(activityId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityId);
        if (tripId) {
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
      }

      const results = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select()
            .from(activityReactions)
            .where(eq(activityReactions.activityId, activityId))
            .orderBy(activityReactions.createdAt);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByActivityId",
            id: activityId,
            cause: error,
          }),
      });

      return results.map((r) => self.toDomain(r));
    });
  }

  findByActivityIdAndUserId(activityId: string, userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityId);
        if (tripId) {
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
      }

      const result = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select()
            .from(activityReactions)
            .where(
              and(
                eq(activityReactions.activityId, activityId),
                eq(activityReactions.userId, userId),
              ),
            )
            .limit(1);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByActivityIdAndUserId",
            id: `${activityId}:${userId}`,
            cause: error,
          }),
      });

      const dbReaction = result[0] ?? null;
      return dbReaction ? self.toDomain(dbReaction) : null;
    });
  }

  create(reaction: ActivityReaction) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(reaction.activityId);
        if (tripId) {
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
      }

      // Users can only create reactions for themselves
      if (authCtx.isAuthenticated && authCtx.userId !== reaction.userId) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "create",
            id: reaction.id,
            cause: new Error("Cannot create reaction for another user"),
          }),
        );
      }

      const result = yield* Effect.tryPromise({
        try: async () => {
          const [r] = await self.db
            .insert(activityReactions)
            .values({
              id: reaction.id,
              activityId: reaction.activityId,
              userId: reaction.userId,
              reactionType: reaction.reactionType,
              createdAt: reaction.createdAt,
            })
            .returning();
          if (!r) throw new Error("Failed to create reaction");
          return r;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: reaction.id,
            cause: error,
          }),
      });

      return self.toDomain(result);
    });
  }

  delete(id: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch reaction first to get activityId and userId for auth check
      const existing = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select({
              activityId: activityReactions.activityId,
              userId: activityReactions.userId,
            })
            .from(activityReactions)
            .where(eq(activityReactions.id, id))
            .limit(1);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id,
            cause: error,
          }),
      });

      const reaction = existing[0];

      if (reaction) {
        // Verify access to the activity's trip
        if (authCtx.isAuthenticated) {
          const tripId = yield* self.getTripIdFromActivityId(
            reaction.activityId,
          );
          if (tripId) {
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
        }

        // Users can only delete their own reactions (or admin)
        if (
          authCtx.isAuthenticated &&
          authCtx.userId !== reaction.userId &&
          authCtx.role !== "ADMIN"
        ) {
          return yield* Effect.fail(
            new DatabaseError({
              operation: "delete",
              id,
              cause: new Error("Cannot delete another user's reaction"),
            }),
          );
        }
      }

      yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .delete(activityReactions)
            .where(eq(activityReactions.id, id));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id,
            cause: error,
          }),
      });
    });
  }

  deleteByActivityAndUser(activityId: string, userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityId);
        if (tripId) {
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
      }

      // Users can only delete their own reactions (or admin)
      if (
        authCtx.isAuthenticated &&
        authCtx.userId !== userId &&
        authCtx.role !== "ADMIN"
      ) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "deleteByActivityAndUser",
            id: `${activityId}:${userId}`,
            cause: new Error("Cannot delete another user's reaction"),
          }),
        );
      }

      yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .delete(activityReactions)
            .where(
              and(
                eq(activityReactions.activityId, activityId),
                eq(activityReactions.userId, userId),
              ),
            );
        },
        catch: (error) =>
          new DatabaseError({
            operation: "deleteByActivityAndUser",
            id: `${activityId}:${userId}`,
            cause: error,
          }),
      });
    });
  }

  countByActivityId(activityId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityId);
        if (tripId) {
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
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ count: sql<number>`count(*)` })
            .from(activityReactions)
            .where(eq(activityReactions.activityId, activityId));
          return result[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "countByActivityId",
            id: activityId,
            cause: error,
          }),
      });
    });
  }

  countByActivityIdAndType(
    activityId: string,
    reactionType: ActivityReactionType,
  ) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityId);
        if (tripId) {
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
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ count: sql<number>`count(*)` })
            .from(activityReactions)
            .where(
              and(
                eq(activityReactions.activityId, activityId),
                eq(activityReactions.reactionType, reactionType),
              ),
            );
          return result[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "countByActivityIdAndType",
            id: `${activityId}:${reactionType}`,
            cause: error,
          }),
      });
    });
  }

  private toDomain(dbReaction: ActivityReactionSelect): ActivityReaction {
    return {
      id: ActivityReactionIdFactory.unsafeCreate(dbReaction.id),
      activityId: ActivityFeedIdFactory.unsafeCreate(dbReaction.activityId),
      userId: UserId.unsafeCreate(dbReaction.userId),
      reactionType: dbReaction.reactionType as ActivityReactionType,
      createdAt: dbReaction.createdAt,
    };
  }
}
