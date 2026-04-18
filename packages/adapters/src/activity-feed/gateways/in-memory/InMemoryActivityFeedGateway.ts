import { Effect } from "effect";
import {
  type ActivityFeed,
  ActivityFeedId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IActivityFeedPort } from "@mirai-app/use-cases/activity-feed/ports";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * In-Memory ActivityFeed Gateway
 *
 * Implements IActivityFeedPort using in-memory Map storage for testing.
 * Supports the AuthContext pattern for authorization testing.
 */
export class InMemoryActivityFeedGateway implements IActivityFeedPort {
  private activities = new Map<string, ActivityFeed>();

  findById(id: ActivityFeedId) {
    const self = this;
    const idStr = ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const activity = self.activities.get(idStr) ?? null;

      // Verify access if authenticated and activity exists
      if (authCtx.isAuthenticated && activity) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(activity.tripId),
          requiredPermission: "read",
        });
      }

      return activity;
    });
  }

  findByTripId(tripId: TripId) {
    const self = this;
    const tripIdStr = TripId.toString(tripId);

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

      return Array.from(self.activities.values())
        .filter((activity) => TripId.toString(activity.tripId) === tripIdStr)
        .sort((a, b) => {
          // Sort by isPinned first (pinned items first), then by createdAt desc
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
    });
  }

  findByTripIdPaginated(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
      includeHidden?: boolean;
    },
  ) {
    const self = this;
    const tripIdStr = TripId.toString(tripId);

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

      const limit = params.limit;
      const includeHidden = params.includeHidden ?? false;

      let filtered = Array.from(self.activities.values()).filter(
        (activity) => TripId.toString(activity.tripId) === tripIdStr,
      );

      if (!includeHidden) {
        filtered = filtered.filter((activity) => !activity.isHidden);
      }

      if (params.cursor) {
        const cursorDate = new Date(params.cursor);
        filtered = filtered.filter(
          (activity) => activity.createdAt > cursorDate,
        );
      }

      // Sort by isPinned desc, then createdAt desc
      filtered.sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const hasMore = filtered.length > limit;
      const activitiesToReturn = hasMore ? filtered.slice(0, limit) : filtered;

      const lastActivity = activitiesToReturn[activitiesToReturn.length - 1];
      const nextCursor =
        hasMore && lastActivity ? lastActivity.createdAt.toISOString() : null;

      return {
        activities: activitiesToReturn,
        nextCursor,
        hasMore,
      };
    });
  }

  findByTripIdForModeration(
    tripId: TripId,
    params: {
      limit: number;
      cursor?: string | null;
    },
  ) {
    const self = this;
    const tripIdStr = TripId.toString(tripId);

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

      const limit = params.limit;

      let filtered = Array.from(self.activities.values()).filter(
        (activity) => TripId.toString(activity.tripId) === tripIdStr,
      );

      if (params.cursor) {
        const cursorDate = new Date(params.cursor);
        filtered = filtered.filter(
          (activity) => activity.createdAt > cursorDate,
        );
      }

      // Sort by createdAt desc for moderation
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const hasMore = filtered.length > limit;
      const activitiesToReturn = hasMore ? filtered.slice(0, limit) : filtered;

      const lastActivity = activitiesToReturn[activitiesToReturn.length - 1];
      const nextCursor =
        hasMore && lastActivity ? lastActivity.createdAt.toISOString() : null;

      return {
        activities: activitiesToReturn,
        nextCursor,
        hasMore,
      };
    });
  }

  findVisibleByTripId(tripId: TripId) {
    const self = this;
    const tripIdStr = TripId.toString(tripId);

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

      return Array.from(self.activities.values())
        .filter((activity) => TripId.toString(activity.tripId) === tripIdStr)
        .filter((activity) => !activity.isHidden)
        .sort((a, b) => {
          // Sort by isPinned first (pinned items first), then by createdAt desc
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
    });
  }

  findPinnedByTripId(tripId: TripId) {
    const self = this;
    const tripIdStr = TripId.toString(tripId);

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

      return Array.from(self.activities.values())
        .filter((activity) => TripId.toString(activity.tripId) === tripIdStr)
        .filter((activity) => activity.isPinned && !activity.isHidden)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  create(activity: ActivityFeed) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify write permission for the trip
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(activity.tripId),
          requiredPermission: "write",
        });
      }

      self.activities.set(
        ActivityFeedId.toString(activity.id),
        activity,
      );
      return activity;
    });
  }

  update(activity: ActivityFeed) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify write permission for the trip
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(activity.tripId),
          requiredPermission: "write",
        });
      }

      self.activities.set(
        ActivityFeedId.toString(activity.id),
        activity,
      );
      return activity;
    });
  }

  delete(id: ActivityFeedId) {
    const self = this;
    const idStr = ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch activity first to get tripId for auth check
      const activity = self.activities.get(idStr);

      // Verify admin permission for delete
      if (authCtx.isAuthenticated && activity) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(activity.tripId),
          requiredPermission: "admin",
        });
      }

      self.activities.delete(idStr);
    });
  }

  setPinned(id: ActivityFeedId, isPinned: boolean) {
    const self = this;
    const idStr = ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const activity = self.activities.get(idStr);
      if (!activity) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "setPinned",
            id: idStr,
            cause: new Error(`Activity not found: ${idStr}`),
          }),
        );
      }

      // Verify admin permission for pinning
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(activity.tripId),
          requiredPermission: "admin",
        });
      }

      const updated = isPinned ? activity.pin() : activity.unpin();
      self.activities.set(idStr, updated);
      return updated;
    });
  }

  exists(id: ActivityFeedId) {
    const self = this;
    const idStr = ActivityFeedId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const activity = self.activities.get(idStr);

      // Verify access if authenticated and activity exists
      if (authCtx.isAuthenticated && activity) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(activity.tripId),
          requiredPermission: "read",
        });
      }

      return activity !== undefined;
    });
  }

  /**
   * Helper method to add an activity (for testing)
   */
  addActivity(activity: ActivityFeed): void {
    this.activities.set(ActivityFeedId.toString(activity.id), activity);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.activities.clear();
  }
}
