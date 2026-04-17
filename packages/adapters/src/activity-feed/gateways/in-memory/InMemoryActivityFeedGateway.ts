import { Effect } from "effect";
import {
  ActivityFeed,
  type ActivityFeedId,
  ActivityFeedIdFactory,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IActivityFeedPort } from "@mirai-app/use-cases/activity-feed/ports";

/**
 * In-Memory ActivityFeed Gateway
 *
 * Implements IActivityFeedPort using in-memory Map storage for testing.
 */
export class InMemoryActivityFeedGateway implements IActivityFeedPort {
  private activities: Map<string, ActivityFeed> = new Map();

  findById(id: ActivityFeedId) {
    return Effect.sync(() => {
      const activity = this.activities.get(ActivityFeedIdFactory.toString(id));
      return activity ?? null;
    });
  }

  findByTripId(tripId: TripId) {
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      return Array.from(this.activities.values())
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
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      const limit = params.limit;
      const includeHidden = params.includeHidden ?? false;

      let filtered = Array.from(this.activities.values()).filter(
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
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      const limit = params.limit;

      let filtered = Array.from(this.activities.values()).filter(
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

  create(activity: ActivityFeed) {
    return Effect.sync(() => {
      this.activities.set(
        ActivityFeedIdFactory.toString(activity.id),
        activity,
      );
      return activity;
    });
  }

  update(activity: ActivityFeed) {
    return Effect.sync(() => {
      this.activities.set(
        ActivityFeedIdFactory.toString(activity.id),
        activity,
      );
      return activity;
    });
  }

  delete(id: ActivityFeedId) {
    return Effect.sync(() => {
      this.activities.delete(ActivityFeedIdFactory.toString(id));
    });
  }

  setPinned(id: ActivityFeedId, isPinned: boolean) {
    return Effect.sync(() => {
      const idStr = ActivityFeedIdFactory.toString(id);
      const activity = this.activities.get(idStr);
      if (!activity) {
        throw new Error(`Activity not found: ${idStr}`);
      }

      const updated = isPinned ? activity.pin() : activity.unpin();
      this.activities.set(idStr, updated);
      return updated;
    });
  }

  exists(id: ActivityFeedId) {
    return Effect.sync(() => {
      return this.activities.has(ActivityFeedIdFactory.toString(id));
    });
  }

  /**
   * Helper method to add an activity (for testing)
   */
  addActivity(activity: ActivityFeed): void {
    this.activities.set(ActivityFeedIdFactory.toString(activity.id), activity);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.activities.clear();
  }
}
