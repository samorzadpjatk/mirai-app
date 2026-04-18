import { Effect } from "effect";
import {
  type ActivityReaction,
  type ActivityReactionId,
  type ActivityFeedId,
  type ActivityReactionType,
  ActivityReactionId as ActivityReactionIdFactory,
  ActivityFeedId as ActivityFeedIdFactory,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IActivityReactionPort } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * In-Memory ActivityReaction Gateway
 *
 * Implements IActivityReactionPort using in-memory Map storage for testing.
 * Supports the AuthContext pattern for authorization testing.
 */
export class InMemoryActivityReactionGateway implements IActivityReactionPort {
  private reactions: Map<string, ActivityReaction> = new Map();

  /**
    * Helper to get tripId from activityId for auth checks.
    * In the in-memory version, we store a mapping from activityId to tripId.
    */
  private activityToTripMap: Map<string, string> = new Map();

  /**
    * Set the tripId for an activity (for testing auth scenarios)
    */
  setActivityTripId(activityId: string, tripId: string): void {
    this.activityToTripMap.set(activityId, tripId);
  }

  /**
    * Helper to get tripId from activityId for auth checks
    */
  private getTripIdFromActivityId(activityId: string) {
    const self = this;
    return Effect.sync(() => {
      return self.activityToTripMap.get(activityId) ?? null;
    });
  }

  findById(id: ActivityReactionId) {
    const self = this;
    const idStr = ActivityReactionIdFactory.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch reaction first to get activityId for auth check
      const reaction = self.reactions.get(idStr) ?? null;

      // Verify access via activity's trip
      if (authCtx.isAuthenticated && reaction) {
        const activityIdStr = ActivityFeedIdFactory.toString(reaction.activityId);
        const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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

      return reaction;
    });
  }

  findByActivityId(activityId: ActivityFeedId) {
    const self = this;
    const activityIdStr = ActivityFeedIdFactory.toString(activityId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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

      const results = Array.from(self.reactions.values()).filter(
        (r) => ActivityFeedIdFactory.toString(r.activityId) === activityIdStr,
      );

      return results;
    });
  }

  findByActivityIdAndUserId(activityId: ActivityFeedId, userId: UserId) {
    const self = this;
    const activityIdStr = ActivityFeedIdFactory.toString(activityId);
    const userIdStr = UserId.toString(userId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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

      const result = Array.from(self.reactions.values()).find(
        (r) =>
          ActivityFeedIdFactory.toString(r.activityId) === activityIdStr &&
          UserId.toString(r.userId) === userIdStr,
      );

      return result ?? null;
    });
  }

  create(reaction: ActivityReaction) {
    const self = this;
    const activityIdStr = ActivityFeedIdFactory.toString(reaction.activityId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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
      if (authCtx.isAuthenticated && authCtx.userId !== UserId.toString(reaction.userId)) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "create",
            id: ActivityReactionIdFactory.toString(reaction.id),
            cause: new Error("Cannot create reaction for another user"),
          }),
        );
      }

      self.reactions.set(
        ActivityReactionIdFactory.toString(reaction.id),
        reaction,
      );

      return reaction;
    });
  }

  delete(id: ActivityReactionId) {
    const self = this;
    const idStr = ActivityReactionIdFactory.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch reaction first to get activityId and userId for auth check
      const reaction = self.reactions.get(idStr);

      if (reaction) {
        const activityIdStr = ActivityFeedIdFactory.toString(reaction.activityId);

        // Verify access to the activity's trip
        if (authCtx.isAuthenticated) {
          const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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
        const reactionUserId = UserId.toString(reaction.userId);
        if (
          authCtx.isAuthenticated &&
          authCtx.userId !== reactionUserId &&
          authCtx.role !== "ADMIN"
        ) {
          return yield* Effect.fail(
            new DatabaseError({
              operation: "delete",
              id: idStr,
              cause: new Error("Cannot delete another user's reaction"),
            }),
          );
        }
      }

      self.reactions.delete(idStr);
    });
  }

  deleteByActivityAndUser(activityId: ActivityFeedId, userId: UserId) {
    const self = this;
    const activityIdStr = ActivityFeedIdFactory.toString(activityId);
    const userIdStr = UserId.toString(userId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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
        authCtx.userId !== userIdStr &&
        authCtx.role !== "ADMIN"
      ) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "deleteByActivityAndUser",
            id: `${activityIdStr}:${userIdStr}`,
            cause: new Error("Cannot delete another user's reaction"),
          }),
        );
      }

      // Find and delete the reaction
      const reactionToDelete = Array.from(self.reactions.entries()).find(
        ([, r]) =>
          ActivityFeedIdFactory.toString(r.activityId) === activityIdStr &&
          UserId.toString(r.userId) === userIdStr,
      );

      if (reactionToDelete) {
        self.reactions.delete(reactionToDelete[0]);
      }
    });
  }

  countByActivityId(activityId: ActivityFeedId) {
    const self = this;
    const activityIdStr = ActivityFeedIdFactory.toString(activityId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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

      const count = Array.from(self.reactions.values()).filter(
        (r) => ActivityFeedIdFactory.toString(r.activityId) === activityIdStr,
      ).length;

      return count;
    });
  }

  countByActivityIdAndType(
    activityId: ActivityFeedId,
    reactionType: ActivityReactionType,
  ) {
    const self = this;
    const activityIdStr = ActivityFeedIdFactory.toString(activityId);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify access to the activity's trip first
      if (authCtx.isAuthenticated) {
        const tripId = yield* self.getTripIdFromActivityId(activityIdStr);
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

      const count = Array.from(self.reactions.values()).filter(
        (r) =>
          ActivityFeedIdFactory.toString(r.activityId) === activityIdStr &&
          r.reactionType === reactionType,
      ).length;

      return count;
    });
  }

  /**
    * Helper method to add a reaction (for testing)
    */
  addReaction(reaction: ActivityReaction): void {
    this.reactions.set(
      ActivityReactionIdFactory.toString(reaction.id),
      reaction,
    );
  }

  /**
    * Helper method to clear all data (for testing)
    */
  clear(): void {
    this.reactions.clear();
    this.activityToTripMap.clear();
  }
}
