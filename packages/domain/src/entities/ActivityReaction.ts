import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Validation rules for ActivityReaction data
 */
const VALIDATION_RULES = {
  reactionType: {
    minLength: 1,
    maxLength: 50,
  },
};

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
  }): Result<ActivityReaction, string> {
    // Validate activityId
    if (!props.activityId || props.activityId.trim() === "") {
      return err("activityId is required");
    }

    // Validate userId
    if (!props.userId || props.userId.trim() === "") {
      return err("userId is required");
    }

    // Validate reactionType
    if (!props.reactionType || props.reactionType.trim() === "") {
      return err("reactionType is required");
    }
    if (props.reactionType.length > VALIDATION_RULES.reactionType.maxLength) {
      return err(
        `reactionType must be at most ${VALIDATION_RULES.reactionType.maxLength} characters`,
      );
    }

    const now = new Date();

    return ok(
      new ActivityReaction(
        props.id ?? crypto.randomUUID(),
        props.activityId.trim(),
        props.userId.trim(),
        props.reactionType.trim(),
        props.createdAt ?? now,
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
  isLike(): boolean {
    return this.isOfType("like");
  }

  isLove(): boolean {
    return this.isOfType("love");
  }

  isCelebrate(): boolean {
    return this.isOfType("celebrate");
  }

  isFunny(): boolean {
    return this.isOfType("funny");
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
