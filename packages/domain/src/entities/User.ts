import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

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
 * Validation rules for user data
 */
const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    noDigits: true,
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
  }): Result<User, string> {
    // Validate authUserId
    if (!props.authUserId || props.authUserId.trim() === "") {
      return err("authUserId is required");
    }

    // Validate firstName
    const firstNameValidation = validateName(props.firstName, "firstName");
    if (firstNameValidation.kind === "err") {
      return err(firstNameValidation.error);
    }

    // Validate lastName
    const lastNameValidation = validateName(props.lastName, "lastName");
    if (lastNameValidation.kind === "err") {
      return err(lastNameValidation.error);
    }

    const now = new Date();

    return ok(
      new User(
        props.id ?? crypto.randomUUID(),
        props.authUserId.trim(),
        firstNameValidation.value,
        lastNameValidation.value,
        props.role,
        props.hasAvatar ?? false,
        props.createdAt ?? now,
        props.updatedAt ?? now,
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
  }): Result<User, string> {
    // Validate firstName
    const firstNameValidation = validateName(props.firstName, "firstName");
    if (firstNameValidation.kind === "err") {
      return err(firstNameValidation.error);
    }

    // Validate lastName
    const lastNameValidation = validateName(props.lastName, "lastName");
    if (lastNameValidation.kind === "err") {
      return err(lastNameValidation.error);
    }

    return ok(
      new User(
        this.id,
        this.authUserId,
        firstNameValidation.value,
        lastNameValidation.value,
        this.role,
        this.hasAvatar,
        this.createdAt,
        new Date(), // updatedAt
        this.lastSeenOn,
      ),
    );
  }

  /**
   * Update the user's role
   * Returns a new User instance (immutable)
   */
  updateRole(newRole: UserRole): User {
    return new User(
      this.id,
      this.authUserId,
      this.firstName,
      this.lastName,
      newRole,
      this.hasAvatar,
      this.createdAt,
      new Date(), // updatedAt
      this.lastSeenOn,
    );
  }

  /**
   * Set whether the user has an avatar
   * Returns a new User instance (immutable)
   */
  setAvatar(hasAvatar: boolean): User {
    return new User(
      this.id,
      this.authUserId,
      this.firstName,
      this.lastName,
      this.role,
      hasAvatar,
      this.createdAt,
      new Date(), // updatedAt
      this.lastSeenOn,
    );
  }

  /**
   * Update last seen timestamp
   * Returns a new User instance (immutable)
   */
  updateLastSeen(timestamp: Date = new Date()): User {
    return new User(
      this.id,
      this.authUserId,
      this.firstName,
      this.lastName,
      this.role,
      this.hasAvatar,
      this.createdAt,
      new Date(), // updatedAt
      timestamp,
    );
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

/**
 * Validate a name field
 */
function validateName(name: string, fieldName: string): Result<string, string> {
  // Allow empty names (just spaces)
  const trimmed = name.trim();

  // If not empty, apply validation rules
  if (trimmed.length > 0) {
    if (trimmed.length < VALIDATION_RULES.name.minLength) {
      return err(
        `${fieldName} must be at least ${VALIDATION_RULES.name.minLength} characters`,
      );
    }

    if (trimmed.length > VALIDATION_RULES.name.maxLength) {
      return err(
        `${fieldName} must be at most ${VALIDATION_RULES.name.maxLength} characters`,
      );
    }

    if (VALIDATION_RULES.name.noDigits && /\d/.test(trimmed)) {
      return err(`${fieldName} cannot contain digits`);
    }
  }

  return ok(trimmed);
}
