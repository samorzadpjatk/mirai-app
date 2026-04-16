import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import { UserRole } from "../../user/enums";

/**
 * Validation rules for User data
 */
const VALIDATION_RULES = {
  firstName: {
    minLength: 1,
    maxLength: 255,
  },
  lastName: {
    minLength: 1,
    maxLength: 255,
  },
  authUserId: {
    minLength: 1,
    maxLength: 255,
  },
};

/**
 * User entity - represents a user in the system
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly authUserId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly hasAvatar: boolean,
    public readonly role: UserRole,
    public readonly lastSeenOn: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new User
   * Validates all input data
   */
  static create(props: {
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    hasAvatar?: boolean;
    role?: UserRole;
    lastSeenOn?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Effect.Effect<User, ValidationError, never> {
    // Validate authUserId
    if (!props.authUserId || props.authUserId.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "authUserId is required",
          field: "authUserId",
        }),
      );
    }
    if (props.authUserId.length > VALIDATION_RULES.authUserId.maxLength) {
      return Effect.fail(
        new ValidationError({
          message: `authUserId must be at most ${VALIDATION_RULES.authUserId.maxLength} characters`,
          field: "authUserId",
        }),
      );
    }

    // Validate firstName
    if (!props.firstName || props.firstName.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "firstName is required",
          field: "firstName",
        }),
      );
    }
    if (props.firstName.length > VALIDATION_RULES.firstName.maxLength) {
      return Effect.fail(
        new ValidationError({
          message: `firstName must be at most ${VALIDATION_RULES.firstName.maxLength} characters`,
          field: "firstName",
        }),
      );
    }

    // Validate lastName
    if (!props.lastName || props.lastName.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "lastName is required",
          field: "lastName",
        }),
      );
    }
    if (props.lastName.length > VALIDATION_RULES.lastName.maxLength) {
      return Effect.fail(
        new ValidationError({
          message: `lastName must be at most ${VALIDATION_RULES.lastName.maxLength} characters`,
          field: "lastName",
        }),
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(props.role ?? UserRole.USER)) {
      return Effect.fail(
        new ValidationError({
          message: `Invalid role: ${props.role}`,
          field: "role",
        }),
      );
    }

    return Effect.succeed(
      new User(
        props.id,
        props.authUserId.trim(),
        props.firstName.trim(),
        props.lastName.trim(),
        props.hasAvatar ?? false,
        props.role ?? UserRole.USER,
        props.lastSeenOn ?? null,
        props.createdAt,
        props.updatedAt,
      ),
    );
  }

  /**
   * Update the user's profile information
   * Returns a new User instance with updated values
   */
  updateProfile(props: {
    firstName?: string;
    lastName?: string;
    hasAvatar?: boolean;
  }): Effect.Effect<User, ValidationError, never> {
    // Validate firstName if provided
    if (props.firstName !== undefined) {
      if (props.firstName.trim() === "") {
        return Effect.fail(
          new ValidationError({
            message: "firstName cannot be empty",
            field: "firstName",
          }),
        );
      }
      if (props.firstName.length > VALIDATION_RULES.firstName.maxLength) {
        return Effect.fail(
          new ValidationError({
            message: `firstName must be at most ${VALIDATION_RULES.firstName.maxLength} characters`,
            field: "firstName",
          }),
        );
      }
    }

    // Validate lastName if provided
    if (props.lastName !== undefined) {
      if (props.lastName.trim() === "") {
        return Effect.fail(
          new ValidationError({
            message: "lastName cannot be empty",
            field: "lastName",
          }),
        );
      }
      if (props.lastName.length > VALIDATION_RULES.lastName.maxLength) {
        return Effect.fail(
          new ValidationError({
            message: `lastName must be at most ${VALIDATION_RULES.lastName.maxLength} characters`,
            field: "lastName",
          }),
        );
      }
    }

    const now = new Date();
    return Effect.succeed(
      new User(
        this.id,
        this.authUserId,
        props.firstName?.trim() ?? this.firstName,
        props.lastName?.trim() ?? this.lastName,
        props.hasAvatar ?? this.hasAvatar,
        this.role,
        this.lastSeenOn,
        this.createdAt,
        now,
      ),
    );
  }

  /**
   * Update the user's role
   * Returns a new User instance with updated role
   */
  updateRole(role: UserRole): Effect.Effect<User, ValidationError, never> {
    if (!Object.values(UserRole).includes(role)) {
      return Effect.fail(
        new ValidationError({
          message: `Invalid role: ${role}`,
          field: "role",
        }),
      );
    }

    const now = new Date();
    return Effect.succeed(
      new User(
        this.id,
        this.authUserId,
        this.firstName,
        this.lastName,
        this.hasAvatar,
        role,
        this.lastSeenOn,
        this.createdAt,
        now,
      ),
    );
  }

  /**
   * Record that the user was seen now
   * Returns a new User instance with updated lastSeenOn
   */
  markAsSeen(): User {
    const now = new Date();
    return new User(
      this.id,
      this.authUserId,
      this.firstName,
      this.lastName,
      this.hasAvatar,
      this.role,
      now,
      this.createdAt,
      now,
    );
  }

  /**
   * Update avatar status
   * Returns a new User instance with updated hasAvatar
   */
  setHasAvatar(hasAvatar: boolean): User {
    const now = new Date();
    return new User(
      this.id,
      this.authUserId,
      this.firstName,
      this.lastName,
      hasAvatar,
      this.role,
      this.lastSeenOn,
      this.createdAt,
      now,
    );
  }

  /**
   * Get the user's full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Get the user's initials
   */
  getInitials(): string {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * Check if the user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Check if the user is an admin
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if the user is a moderator
   */
  isModerator(): boolean {
    return this.role === UserRole.MODERATOR || this.role === UserRole.ADMIN;
  }

  /**
   * Check if the user is a service account
   */
  isService(): boolean {
    return this.role === UserRole.SERVICE;
  }

  /**
   * Check if the user is a regular user
   */
  isRegularUser(): boolean {
    return this.role === UserRole.USER;
  }

  /**
   * Check if the user has been seen recently (within given milliseconds)
   */
  wasSeenRecently(withinMs: number): boolean {
    if (!this.lastSeenOn) return false;
    return Date.now() - this.lastSeenOn.getTime() < withinMs;
  }

  /**
   * Check if the user is online (seen within last 5 minutes)
   */
  isOnline(): boolean {
    return this.wasSeenRecently(5 * 60 * 1000); // 5 minutes
  }

  /**
   * Check if the user has an avatar
   */
  hasProfileAvatar(): boolean {
    return this.hasAvatar;
  }

  /**
   * Check if this user matches a given auth user ID
   */
  matchesAuthUserId(authUserId: string): boolean {
    return this.authUserId === authUserId;
  }

  /**
   * Check if the user was created before a given date
   */
  wasCreatedBefore(date: Date): boolean {
    return this.createdAt < date;
  }

  /**
   * Check if the user was created after a given date
   */
  wasCreatedAfter(date: Date): boolean {
    return this.createdAt > date;
  }

  /**
   * Get the account age in milliseconds
   */
  getAccountAgeMs(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Get the time since last seen in milliseconds
   * Returns null if never seen
   */
  getTimeSinceLastSeenMs(): number | null {
    if (!this.lastSeenOn) return null;
    return Date.now() - this.lastSeenOn.getTime();
  }
}
