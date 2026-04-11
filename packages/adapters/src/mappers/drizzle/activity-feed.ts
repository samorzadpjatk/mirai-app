import { ActivityFeed, ActivityReaction } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type {
  activityFeed as activityFeedTable,
  activityReactions as activityReactionsTable,
  ActivityFeedSelect,
  ActivityFeedInsert,
  ActivityReactionSelect,
  ActivityReactionInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * ActivityFeedDrizzleMapper
 *
 * Maps between Drizzle database records and domain ActivityFeed entities.
 */
export class ActivityFeedDrizzleMapper implements DrizzleEntityMapper<
  ActivityFeed,
  ActivityFeedSelect,
  ActivityFeedInsert
> {
  /**
   * Convert a Drizzle ActivityFeed record to a domain ActivityFeed entity
   */
  toDomain(record: ActivityFeedSelect): ActivityFeed {
    const result = ActivityFeed.create({
      id: record.id as any, // ActivityId branded type
      tripId: record.tripId,
      activityType: record.activityType as any, // ActivityType branded type
      title: record.title,
      description: record.description,
      imageUrl: record.imageUrl,
      isPinned: record.isPinned,
      isHidden: record.isHidden,
      hiddenByAdmin: record.hiddenByAdmin,
      hiddenAt: record.hiddenAt,
      hiddenReason: record.hiddenReason,
      createdByAdmin: record.createdByAdmin,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      // reactions loaded separately
    } as any);

    if (result.kind === "err") {
      throw new Error(
        `Failed to map ActivityFeed from Drizzle: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain ActivityFeed entity to Drizzle insert input
   */
  toDrizzleInsert(activity: ActivityFeed): ActivityFeedInsert {
    return {
      id: activity.id,
      tripId: activity.tripId,
      activityType: activity.activityType,
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl,
      isPinned: activity.isPinned,
      isHidden: activity.isHidden,
      hiddenByAdmin: activity.hiddenByAdmin,
      hiddenAt: activity.hiddenAt,
      hiddenReason: activity.hiddenReason,
      createdByAdmin: activity.createdByAdmin,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  /**
   * Convert a domain ActivityFeed entity to Drizzle update input
   */
  toDrizzleUpdate(activity: ActivityFeed): Partial<ActivityFeedInsert> {
    return {
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl,
      isPinned: activity.isPinned,
      isHidden: activity.isHidden,
      hiddenByAdmin: activity.hiddenByAdmin,
      hiddenAt: activity.hiddenAt,
      hiddenReason: activity.hiddenReason,
      updatedAt: new Date(),
    };
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new ActivityFeedDrizzleMapper();
}

/**
 * ActivityReactionDrizzleMapper
 *
 * Maps between Drizzle database records and domain ActivityReaction entities.
 */
export class ActivityReactionDrizzleMapper implements DrizzleEntityMapper<
  ActivityReaction,
  ActivityReactionSelect,
  ActivityReactionInsert
> {
  toDomain(record: ActivityReactionSelect): ActivityReaction {
    const result = ActivityReaction.create({
      id: record.id,
      activityId: record.activityId,
      userId: record.userId,
      reactionType: record.reactionType,
      createdAt: record.createdAt,
    });

    if (result.kind === "err") {
      throw new Error(
        `Failed to map ActivityReaction from Drizzle: ${result.error}`,
      );
    }

    return result.value;
  }

  toDrizzleInsert(reaction: ActivityReaction): ActivityReactionInsert {
    return {
      id: reaction.id,
      activityId: reaction.activityId,
      userId: reaction.userId,
      reactionType: reaction.reactionType,
      createdAt: reaction.createdAt,
    };
  }

  toDrizzleUpdate(reaction: ActivityReaction): Partial<ActivityReactionInsert> {
    return {
      reactionType: reaction.reactionType,
    };
  }

  static readonly instance = new ActivityReactionDrizzleMapper();
}
