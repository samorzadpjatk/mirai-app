import { Effect } from "effect";
import { validate } from "../../utils/entity-validation";
import { timestamps } from "../../utils/immutable";
import { ValidationError } from "../../errors";
import { REACTION_TYPES } from "../../enums/activity";

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
   *
   * Returns Effect<ActivityReaction, ValidationError, never>
   */
  static create(props: {
    id?: string;
    activityId: string;
    userId: string;
    reactionType: string;
    createdAt?: Date;
  }): Effect.Effect<ActivityReaction, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate activityId
      const activityId = yield* validate.id(props.activityId, "activityId");

      // Validate userId
      const userId = yield* validate.id(props.userId, "userId");

      // Validate reactionType
      const reactionType = yield* validate.string(
        props.reactionType,
        "reactionType",
        {
          required: true,
          maxLength: 50,
          trim: true,
        },
      );

      // Validate reaction type is one of the allowed types
      if (
        !REACTION_TYPES.includes(
          reactionType as (typeof REACTION_TYPES)[number],
        )
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid reaction type: ${reactionType}. Must be one of: ${REACTION_TYPES.join(", ")}`,
            field: "reactionType",
          }),
        );
      }

      const ts = timestamps(props);

      return new ActivityReaction(
        props.id ?? crypto.randomUUID(),
        activityId,
        userId,
        reactionType,
        ts.createdAt,
      );
    });
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
