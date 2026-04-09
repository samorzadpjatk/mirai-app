/**
 * AuthContext - Immutable Value Object for authentication context
 *
 * Represents the authentication state of a user in the system.
 * This is a pure domain value object with no external dependencies.
 *
 * Features:
 * - Branded UserId type prevents mixing IDs across aggregates
 * - Immutable - all properties are readonly
 * - Factory method with Result type for explicit error handling
 * - No exceptions thrown during creation
 *
 * @module value-objects
 */

import type { UserId } from "./UserId";
import { UserRole } from "../enums/UserRole";
import { AppError, type ValidationError } from "../errors/DomainErrors";
import { Result, ok, err } from "../types/Result";

/**
 * AuthContext represents the authenticated state of a user
 */
export class AuthContext {
  /**
   * Private constructor - use AuthContext.create() factory method
   */
  private constructor(
    /** Unique identifier of the authenticated user */
    readonly userId: UserId,
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
   * Validates inputs and returns a Result type instead of throwing.
   * This ensures explicit error handling at the call site.
   *
   * @param props - Object containing userId, role, and optional sessionId
   * @returns Result<AuthContext, ValidationError>
   *
   * @example
   * ```typescript
   * const result = AuthContext.create({
   *   userId: UserId.create("550e8400-e29b-41d4-a716-446655440000"),
   *   role: UserRole.USER,
   *   authenticatedAt: new Date(),
   * });
   *
   * if (isOk(result)) {
   *   const authContext = result.value;
   *   // Use authContext...
   * } else {
   *   console.error(result.error.message);
   * }
   * ```
   */
  static create(props: {
    userId: UserId;
    role: UserRole;
    authenticatedAt: Date;
    sessionId?: string;
  }): Result<AuthContext, ValidationError> {
    // Validate userId is provided
    if (!props.userId) {
      return err(
        AppError.validation({
          field: "userId",
          message: "UserId is required",
        }),
      );
    }

    // Validate role is a valid UserRole
    if (!Object.values(UserRole).includes(props.role)) {
      return err(
        AppError.validation({
          field: "role",
          message: `Invalid role: ${props.role}`,
        }),
      );
    }

    // Validate authenticatedAt is a valid Date
    if (!(props.authenticatedAt instanceof Date)) {
      return err(
        AppError.validation({
          field: "authenticatedAt",
          message: "authenticatedAt must be a valid Date",
        }),
      );
    }

    // Validate authenticatedAt is not in the future
    if (props.authenticatedAt.getTime() > Date.now()) {
      return err(
        AppError.validation({
          field: "authenticatedAt",
          message: "authenticatedAt cannot be in the future",
        }),
      );
    }

    // Validate sessionId if provided
    if (props.sessionId !== undefined) {
      if (typeof props.sessionId !== "string") {
        return err(
          AppError.validation({
            field: "sessionId",
            message: "sessionId must be a string",
          }),
        );
      }

      if (props.sessionId.trim().length === 0) {
        return err(
          AppError.validation({
            field: "sessionId",
            message: "sessionId cannot be empty",
          }),
        );
      }
    }

    return ok(
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
    const roleHierarchy = {
      [UserRole.ADMIN]: 3,
      [UserRole.MODERATOR]: 2,
      [UserRole.USER]: 1,
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
