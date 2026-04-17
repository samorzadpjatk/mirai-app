import type { ActivityFeedId } from "../value-objects/ActivityId";
import type { TripId } from "../../trip/value-objects/TripId";
import type { UserId } from "../../user/value-objects/UserId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Activity Feed Item Type Enum
 */
export type ActivityType =
  | "SUBMISSION"
  | "CHALLENGE"
  | "RANK_CHANGE"
  | "USER_POST";

/**
 * Activity Feed Domain Entity
 *
 * Represents an item in the trip's activity feed.
 */
export class ActivityFeed {
  private constructor(
    readonly id: ActivityFeedId,
    readonly tripId: TripId,
    readonly activityType: ActivityType,
    readonly title: string,
    readonly description: string | null,
    readonly imageUrl: string | null,
    readonly isPinned: boolean,
    readonly isHidden: boolean,
    readonly hiddenByAdmin: UserId | null,
    readonly hiddenAt: Date | null,
    readonly hiddenReason: string | null,
    readonly createdByAdmin: UserId | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create an ActivityFeed entity
   */
  static create(props: {
    id: ActivityFeedId;
    tripId: TripId;
    activityType: ActivityType;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    isPinned?: boolean;
    isHidden?: boolean;
    hiddenByAdmin?: UserId | null;
    hiddenAt?: Date | null;
    hiddenReason?: string | null;
    createdByAdmin?: UserId | null;
    createdAt: Date;
    updatedAt: Date;
  }): Effect.Effect<ActivityFeed, ValidationError, never> {
    const trimmedTitle = props.title.trim();

    if (trimmedTitle.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "title",
          message: "Title is required",
          value: props.title,
        }),
      );
    }

    if (trimmedTitle.length > 300) {
      return Effect.fail(
        new ValidationError({
          field: "title",
          message: "Title must be at most 300 characters",
          value: props.title,
        }),
      );
    }

    return Effect.succeed(
      new ActivityFeed(
        props.id,
        props.tripId,
        props.activityType,
        trimmedTitle,
        props.description ?? null,
        props.imageUrl ?? null,
        props.isPinned ?? false,
        props.isHidden ?? false,
        props.hiddenByAdmin ?? null,
        props.hiddenAt ?? null,
        props.hiddenReason ?? null,
        props.createdByAdmin ?? null,
        props.createdAt,
        props.updatedAt,
      ),
    );
  }

  /**
   * Pin the activity
   */
  pin(): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      true,
      this.isHidden,
      this.hiddenByAdmin,
      this.hiddenAt,
      this.hiddenReason,
      this.createdByAdmin,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Unpin the activity
   */
  unpin(): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      false,
      this.isHidden,
      this.hiddenByAdmin,
      this.hiddenAt,
      this.hiddenReason,
      this.createdByAdmin,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Hide the activity
   */
  hide(adminId: UserId, reason: string | null = null): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      this.isPinned,
      true,
      adminId,
      new Date(),
      reason,
      this.createdByAdmin,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Unhide the activity
   */
  unhide(): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      this.isPinned,
      false,
      null,
      null,
      null,
      this.createdByAdmin,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Check if activity is visible to users
   */
  isVisible(): boolean {
    return !this.isHidden;
  }
}
