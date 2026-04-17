import type {
  ActivityFeedSelect,
  ActivityFeedInsert,
} from "@mirai-app/frameworks/drizzle";
import {
  ActivityFeed,
  type ActivityFeedId,
  ActivityFeedIdFactory,
  TripId,
  UserId,
  type ValidationError,
  type ActivityType,
} from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * ActivityFeed Mapper
 *
 * Maps between database ActivityFeed records and domain ActivityFeed entities.
 */
export class ActivityFeedMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbActivity: ActivityFeedSelect,
  ): Effect.Effect<ActivityFeed, ValidationError, never> {
    return ActivityFeed.create({
      id: ActivityFeedIdFactory.unsafeCreate(dbActivity.id),
      tripId: TripId.unsafeCreate(dbActivity.tripId),
      activityType: dbActivity.activityType as ActivityType,
      title: dbActivity.title,
      description: dbActivity.description ?? null,
      imageUrl: dbActivity.imageUrl ?? null,
      isPinned: dbActivity.isPinned,
      isHidden: dbActivity.isHidden,
      hiddenByAdmin: dbActivity.hiddenByAdmin
        ? UserId.unsafeCreate(dbActivity.hiddenByAdmin)
        : null,
      hiddenAt: dbActivity.hiddenAt ?? null,
      hiddenReason: dbActivity.hiddenReason ?? null,
      createdByAdmin: dbActivity.createdByAdmin
        ? UserId.unsafeCreate(dbActivity.createdByAdmin)
        : null,
      createdAt: dbActivity.createdAt,
      updatedAt: dbActivity.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(activity: ActivityFeed): ActivityFeedInsert {
    return {
      id: ActivityFeedIdFactory.toString(activity.id),
      tripId: TripId.toString(activity.tripId),
      activityType: activity.activityType,
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl,
      isPinned: activity.isPinned,
      isHidden: activity.isHidden,
      hiddenByAdmin: activity.hiddenByAdmin
        ? UserId.toString(activity.hiddenByAdmin)
        : null,
      hiddenAt: activity.hiddenAt,
      hiddenReason: activity.hiddenReason,
      createdByAdmin: activity.createdByAdmin
        ? UserId.toString(activity.createdByAdmin)
        : null,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(
    activity: ActivityFeed,
  ): Omit<ActivityFeedInsert, "id" | "tripId" | "createdAt"> {
    return {
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl,
      activityType: activity.activityType,
      isPinned: activity.isPinned,
      isHidden: activity.isHidden,
      hiddenByAdmin: activity.hiddenByAdmin
        ? UserId.toString(activity.hiddenByAdmin)
        : null,
      hiddenAt: activity.hiddenAt,
      hiddenReason: activity.hiddenReason,
      createdByAdmin: activity.createdByAdmin
        ? UserId.toString(activity.createdByAdmin)
        : null,
      updatedAt: new Date(),
    };
  }
}

export const activityFeedMapper = new ActivityFeedMapper();
