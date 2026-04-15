/**
 * AuthContext - Immutable Value Object for authentication context
 *
 * Represents the authentication state of a user in the system.
 * This is a pure domain value object with no external dependencies.
 *
 * Features:
 * - Branded UserId type prevents mixing IDs across aggregates
 * - Immutable - all properties are readonly
 * - Factory method with Effect for explicit error handling
 * - No exceptions thrown during creation
 *
 * @module value-objects
 */

import { Effect } from "effect";
import type { Id } from "./id";
import { UserRole } from "../../enums/user";
import { ValidationError } from "../../errors";

/**
 * AuthContext represents the authenticated state of a user
 */
export class AuthContext {
  /**
   * Private constructor - use AuthContext.create() factory method
   */
  private constructor(
    /** Unique identifier of the authenticated user */
    readonly userId: Id,
    /** Role of the authenticated user */
    readonly role: UserRole,
    /** Timestamp when the authentication was established */
    readonly authenticatedAt: Date,
    /** Optional session identifier */
    readonly sessionId?: string,
  ) {}

  /**
   * Factory method to create an AuthContext
   *
   * Validates inputs and returns an Effect instead of throwing.
   * This ensures explicit error handling at the call site.
   *
   * @param props - Object containing userId, role, and optional sessionId
   * @returns Effect<AuthContext, ValidationError>
   *
   * @example
   * ```typescript
   * const effect = AuthContext.create({
   *   userId: Id.create("550e8400-e29b-41d4-a716-446655440000"),
   *   role: UserRole.USER,
   *   authenticatedAt: new Date(),
   * });
   *
   * const authContext = yield* effect;
   * // Use authContext...
   * ```
   */
  static create(props: {
    userId: Id;
    role: UserRole;
    authenticatedAt: Date;
    sessionId?: string;
  }): Effect.Effect<AuthContext, ValidationError, never> {
    // Validate userId is provided
    if (!props.userId) {
      return Effect.fail(
        new ValidationError({
          field: "userId",
          message: "UserId is required",
        }),
      );
    }

    // Validate role is a valid UserRole
    if (!Object.values(UserRole).includes(props.role)) {
      return Effect.fail(
        new ValidationError({
          field: "role",
          message: `Invalid role: ${props.role}`,
        }),
      );
    }

    // Validate authenticatedAt is a valid Date
    if (!(props.authenticatedAt instanceof Date)) {
      return Effect.fail(
        new ValidationError({
          field: "authenticatedAt",
          message: "authenticatedAt must be a valid Date",
        }),
      );
    }

    // Validate authenticatedAt is not in the future
    if (props.authenticatedAt.getTime() > Date.now()) {
      return Effect.fail(
        new ValidationError({
          field: "authenticatedAt",
          message: "authenticatedAt cannot be in the future",
        }),
      );
    }

    // Validate sessionId if provided
    if (props.sessionId !== undefined) {
      if (typeof props.sessionId !== "string") {
        return Effect.fail(
          new ValidationError({
            field: "sessionId",
            message: "sessionId must be a string",
          }),
        );
      }

      if (props.sessionId.trim().length === 0) {
        return Effect.fail(
          new ValidationError({
            field: "sessionId",
            message: "sessionId cannot be empty",
          }),
        );
      }
    }

    return Effect.succeed(
      new AuthContext(
        props.userId,
        props.role,
        props.authenticatedAt,
        props.sessionId,
      ),
    );
  }

  /**
   * Check if the authenticated user has admin role
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if the authenticated user has moderator or admin role
   */
  isModerator(): boolean {
    return this.role === UserRole.MODERATOR || this.role === UserRole.ADMIN;
  }

  /**
   * Check if the authenticated user has the specified role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Check if the authenticated user has at least the specified role level
   * Role hierarchy: ADMIN > MODERATOR > USER
   */
  hasRoleAtLeast(role: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 3,
      [UserRole.MODERATOR]: 2,
      [UserRole.USER]: 1,
      [UserRole.SERVICE]: 3,
    };

    return roleHierarchy[this.role] >= roleHierarchy[role];
  }

  /**
   * Create a new AuthContext with a different role
   * Returns a new instance (immutable update)
   */
  withRole(role: UserRole): AuthContext {
    return new AuthContext(
      this.userId,
      role,
      this.authenticatedAt,
      this.sessionId,
    );
  }

  /**
   * Create a new AuthContext with a different session ID
   * Returns a new instance (immutable update)
   */
  withSessionId(sessionId: string | undefined): AuthContext {
    return new AuthContext(
      this.userId,
      this.role,
      this.authenticatedAt,
      sessionId,
    );
  }

  /**
   * Convert AuthContext to a plain object for serialization
   */
  toJSON(): {
    userId: string;
    role: UserRole;
    authenticatedAt: string;
    sessionId?: string;
  } {
    return {
      userId: this.userId as string,
      role: this.role,
      authenticatedAt: this.authenticatedAt.toISOString(),
      sessionId: this.sessionId,
    };
  }

  /**
   * Check if two AuthContexts are equal
   */
  equals(other: AuthContext): boolean {
    return (
      this.userId === other.userId &&
      this.role === other.role &&
      this.authenticatedAt.getTime() === other.authenticatedAt.getTime() &&
      this.sessionId === other.sessionId
    );
  }
}
