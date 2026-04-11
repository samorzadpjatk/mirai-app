import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { timestamps } from "../utils/immutable";
import { ValidationError } from "../errors/domain-errors";
import { REACTION_TYPES } from "./ActivityFeed";

/**
 * ActivityReaction entity - represents a user's reaction to an activity feed item
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class ActivityReaction {
  private constructor(
    public readonly id: string,
    public readonly activityId: string,
    public readonly userId: string,
    public readonly reactionType: string,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method to create a new ActivityReaction
   * Validates all input data
   */
  static create(props: {
    id?: string;
    activityId: string;
    userId: string;
    reactionType: string;
    createdAt?: Date;
  }): Result<ActivityReaction, ValidationError> {
    // Validate activityId
    const activityId = validate.id(props.activityId, "activityId");
    if (isError(activityId)) return err(activityId.error);

    // Validate userId
    const userId = validate.id(props.userId, "userId");
    if (isError(userId)) return err(userId.error);

    // Validate reactionType
    const reactionType = validate.string(props.reactionType, "reactionType", {
      required: true,
      maxLength: 50,
      trim: true,
    });
    if (isError(reactionType)) return err(reactionType.error);

    // Validate reaction type is one of the allowed types
    if (
      !REACTION_TYPES.includes(
        reactionType.value as (typeof REACTION_TYPES)[number],
      )
    ) {
      return err(
        new ValidationError(
          `Invalid reaction type: ${reactionType.value}. Must be one of: ${REACTION_TYPES.join(", ")}`,
          "reactionType",
        ),
      );
    }

    const ts = timestamps(props);

    return ok(
      new ActivityReaction(
        props.id ?? crypto.randomUUID(),
        activityId.value,
        userId.value,
        reactionType.value,
        ts.createdAt,
      ),
    );
  }

  /**
   * Get unique composite identifier
   * One user can have multiple reaction types per activity
   */
  getCompositeId(): string {
    return `${this.activityId}:${this.userId}:${this.reactionType}`;
  }

  /**
   * Check if this reaction is of a specific type
   */
  isOfType(type: string): boolean {
    return this.reactionType.toLowerCase() === type.toLowerCase();
  }

  /**
   * Common reaction type checks
   */
  isHeart(): boolean {
    return this.isOfType("heart");
  }

  isFire(): boolean {
    return this.isOfType("fire");
  }

  isClap(): boolean {
    return this.isOfType("clap");
  }

  isStar(): boolean {
    return this.isOfType("star");
  }

  /**
   * Check if reaction is for a specific activity
   */
  isForActivity(activityId: string): boolean {
    return this.activityId === activityId;
  }

  /**
   * Check if reaction is from a specific user
   */
  isFromUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if this matches given activity, user, and type
   */
  matches(activityId: string, userId: string, reactionType: string): boolean {
    return (
      this.activityId === activityId &&
      this.userId === userId &&
      this.reactionType.toLowerCase() === reactionType.toLowerCase()
    );
  }
}
