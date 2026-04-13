import { Effect } from "effect";
import { ValidationError } from "../errors/effect-errors";

/**
 * Validation rules for PushSubscription data
 */
const VALIDATION_RULES = {
  token: {
    minLength: 10,
    maxLength: 500,
  },
};

/**
 * PushSubscription entity - stores push notification tokens for users
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class PushSubscription {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new PushSubscription
   * Validates all input data
   */
  static create(props: {
    id?: string;
    userId: string;
    token: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<PushSubscription, ValidationError, never> {
    // Validate userId
    if (!props.userId || props.userId.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "userId is required",
          field: "userId",
        }),
      );
    }

    // Validate token
    if (!props.token || props.token.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "token is required",
          field: "token",
        }),
      );
    }
    if (props.token.length < VALIDATION_RULES.token.minLength) {
      return Effect.fail(
        new ValidationError({
          message: `token must be at least ${VALIDATION_RULES.token.minLength} characters`,
          field: "token",
        }),
      );
    }
    if (props.token.length > VALIDATION_RULES.token.maxLength) {
      return Effect.fail(
        new ValidationError({
          message: `token must be at most ${VALIDATION_RULES.token.maxLength} characters`,
          field: "token",
        }),
      );
    }

    const now = new Date();

    return Effect.succeed(
      new PushSubscription(
        props.id ?? crypto.randomUUID(),
        props.userId.trim(),
        props.token.trim(),
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Get composite identifier (userId + token)
   * Unique constraint: (userId, token)
   */
  getCompositeId(): string {
    return `${this.userId}:${this.token}`;
  }

  /**
   * Check if subscription belongs to a specific user
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if subscription has specific token
   */
  hasToken(token: string): boolean {
    return this.token === token;
  }

  /**
   * Check if this matches given user and token
   */
  matches(userId: string, token: string): boolean {
    return this.userId === userId && this.token === token;
  }

  /**
   * Get masked token for display (security)
   */
  getMaskedToken(): string {
    if (this.token.length <= 8) {
      return "****";
    }
    return `${this.token.slice(0, 4)}****${this.token.slice(-4)}`;
  }
}
