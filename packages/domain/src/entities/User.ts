import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { timestamps, updateEntity } from "../utils/immutable";
import { ValidationError } from "../errors/domain-errors";

/**
 * User roles in the system
 * Ordered by permission level (USER < MODERATOR < ADMIN < SERVICE)
 */
export enum UserRole {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
  SERVICE = "SERVICE",
}

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SERVICE]: 4,
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
    public readonly role: UserRole,
    public readonly hasAvatar: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastSeenOn: Date | null,
  ) {}

  /**
   * Factory method to create a new User
   * Validates all input data
   */
  static create(props: {
    id?: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    hasAvatar?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    lastSeenOn?: Date | null;
  }): Result<User, ValidationError> {
    // Validate authUserId
    const authUserId = validate.id(props.authUserId, "authUserId");
    if (isError(authUserId)) return err(authUserId.error);

    // Validate firstName (allow empty, but validate if non-empty)
    let firstName = props.firstName.trim();
    if (firstName.length > 0) {
      const firstNameValidated = validate.string(firstName, "firstName", {
        trim: true,
        minLength: 2,
        maxLength: 100,
      });
      if (isError(firstNameValidated)) return err(firstNameValidated.error);
      firstName = firstNameValidated.value;

      // Check for digits
      if (/\d/.test(firstName)) {
        return err(
          new ValidationError("firstName cannot contain digits", "firstName"),
        );
      }
    }

    // Validate lastName (allow empty, but validate if non-empty)
    let lastName = props.lastName.trim();
    if (lastName.length > 0) {
      const lastNameValidated = validate.string(lastName, "lastName", {
        trim: true,
        minLength: 2,
        maxLength: 100,
      });
      if (isError(lastNameValidated)) return err(lastNameValidated.error);
      lastName = lastNameValidated.value;

      // Check for digits
      if (/\d/.test(lastName)) {
        return err(
          new ValidationError("lastName cannot contain digits", "lastName"),
        );
      }
    }

    const ts = timestamps(props);

    return ok(
      new User(
        props.id ?? crypto.randomUUID(),
        authUserId.value,
        firstName,
        lastName,
        props.role,
        props.hasAvatar ?? false,
        ts.createdAt,
        ts.updatedAt,
        props.lastSeenOn ?? null,
      ),
    );
  }

  /**
   * Update the user's name
   * Returns a new User instance (immutable)
   */
  updateName(props: {
    firstName: string;
    lastName: string;
  }): Result<User, ValidationError> {
    // Validate firstName (allow empty, but validate if non-empty)
    let firstName = props.firstName.trim();
    if (firstName.length > 0) {
      const firstNameValidated = validate.string(firstName, "firstName", {
        trim: true,
        minLength: 2,
        maxLength: 100,
      });
      if (isError(firstNameValidated)) return err(firstNameValidated.error);
      firstName = firstNameValidated.value;

      // Check for digits
      if (/\d/.test(firstName)) {
        return err(
          new ValidationError("firstName cannot contain digits", "firstName"),
        );
      }
    }

    // Validate lastName (allow empty, but validate if non-empty)
    let lastName = props.lastName.trim();
    if (lastName.length > 0) {
      const lastNameValidated = validate.string(lastName, "lastName", {
        trim: true,
        minLength: 2,
        maxLength: 100,
      });
      if (isError(lastNameValidated)) return err(lastNameValidated.error);
      lastName = lastNameValidated.value;

      // Check for digits
      if (/\d/.test(lastName)) {
        return err(
          new ValidationError("lastName cannot contain digits", "lastName"),
        );
      }
    }

    return ok(updateEntity(this, { firstName, lastName }, User));
  }

  /**
   * Update the user's role
   * Returns a new User instance (immutable)
   */
  updateRole(newRole: UserRole): User {
    return updateEntity(this, { role: newRole }, User);
  }

  /**
   * Set whether the user has an avatar
   * Returns a new User instance (immutable)
   */
  setAvatar(hasAvatar: boolean): User {
    return updateEntity(this, { hasAvatar }, User);
  }

  /**
   * Update last seen timestamp
   * Returns a new User instance (immutable)
   */
  updateLastSeen(timestamp: Date = new Date()): User {
    return updateEntity(this, { lastSeenOn: timestamp }, User);
  }

  /**
   * Get the user's full name
   */
  getFullName(): string {
    const fullName = [this.firstName, this.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || "Unknown";
  }

  /**
   * Get display name (full name or first name or Unknown)
   */
  getDisplayName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || "Unknown";
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Check if user has at least the specified role level
   * (e.g., ADMIN has at least USER level)
   */
  hasAtLeastRole(minRole: UserRole): boolean {
    return ROLE_HIERARCHY[this.role] >= ROLE_HIERARCHY[minRole];
  }

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.hasAtLeastRole(UserRole.ADMIN);
  }

  /**
   * Check if user is a moderator or higher
   */
  isModerator(): boolean {
    return this.hasAtLeastRole(UserRole.MODERATOR);
  }

  /**
   * Check if user is banned (always false for regular users)
   * Ban status is managed by Supabase Auth, not domain entity
   */
  isBanned(): boolean {
    return false;
  }

  /**
   * Get initials for avatar placeholder
   */
  getInitials(): string {
    const first = this.firstName?.charAt(0)?.toUpperCase() ?? "";
    const last = this.lastName?.charAt(0)?.toUpperCase() ?? "";
    return first + last || "?";
  }
}
