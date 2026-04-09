import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Group status
 */
export enum GroupStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

/**
 * Validation rules for group data
 */
const VALIDATION_RULES = {
  name: {
    minLength: 1,
    maxLength: 100,
  },
  code: {
    minLength: 1,
    maxLength: 50,
  },
  description: {
    maxLength: 500,
  },
};

/**
 * Group entity - represents a participant group in a trip
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Group {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly image: string | null,
    public readonly organizerId: string,
    public readonly code: string,
    public readonly coins: number,
    public readonly status: GroupStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Group
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId: string;
    name: string;
    description?: string | null;
    image?: string | null;
    organizerId: string;
    code: string;
    coins?: number;
    status?: GroupStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<Group, string> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate name
    if (!props.name || props.name.trim() === "") {
      return err("name is required");
    }
    if (props.name.length > VALIDATION_RULES.name.maxLength) {
      return err(
        `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
      );
    }

    // Validate organizerId
    if (!props.organizerId || props.organizerId.trim() === "") {
      return err("organizerId is required");
    }

    // Validate code
    if (!props.code || props.code.trim() === "") {
      return err("code is required");
    }
    if (props.code.length > VALIDATION_RULES.code.maxLength) {
      return err(
        `code must be at most ${VALIDATION_RULES.code.maxLength} characters`,
      );
    }

    // Validate coins
    const coins = props.coins ?? 0;
    if (coins < 0) {
      return err("coins must be non-negative");
    }

    // Validate description length
    if (
      props.description &&
      props.description.length > VALIDATION_RULES.description.maxLength
    ) {
      return err(
        `description must be at most ${VALIDATION_RULES.description.maxLength} characters`,
      );
    }

    const now = new Date();

    return ok(
      new Group(
        props.id ?? crypto.randomUUID(),
        props.tripId.trim(),
        props.name.trim(),
        props.description ?? null,
        props.image ?? null,
        props.organizerId.trim(),
        props.code.trim(),
        coins,
        props.status ?? GroupStatus.ACTIVE,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Update group details (name, description, image)
   * Returns a new Group instance (immutable)
   * Cannot update if group is deleted
   */
  updateDetails(props: {
    name?: string;
    description?: string | null;
    image?: string | null;
  }): Result<Group, string> {
    // Cannot update deleted group
    if (this.isDeleted()) {
      return err("Cannot update a deleted group");
    }

    // Validate name if provided
    if (props.name !== undefined) {
      if (props.name.trim() === "") {
        return err("name is required");
      }
      if (props.name.length > VALIDATION_RULES.name.maxLength) {
        return err(
          `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
        );
      }
    }

    // Validate description if provided
    if (props.description !== undefined && props.description !== null) {
      if (props.description.length > VALIDATION_RULES.description.maxLength) {
        return err(
          `description must be at most ${VALIDATION_RULES.description.maxLength} characters`,
        );
      }
    }

    return ok(
      new Group(
        this.id,
        this.tripId,
        props.name ?? this.name,
        props.description !== undefined ? props.description : this.description,
        props.image !== undefined ? props.image : this.image,
        this.organizerId,
        this.code,
        this.coins,
        this.status,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Change group organizer
   * Returns a new Group instance (immutable)
   */
  changeOrganizer(newOrganizerId: string): Group {
    if (!newOrganizerId || newOrganizerId.trim() === "") {
      throw new Error("organizerId is required");
    }

    return new Group(
      this.id,
      this.tripId,
      this.name,
      this.description,
      this.image,
      newOrganizerId.trim(),
      this.code,
      this.coins,
      this.status,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Add coins to group balance
   * Returns a new Group instance (immutable)
   */
  addCoins(amount: number): Group {
    if (amount < 0) {
      throw new Error("Cannot add negative coins");
    }

    return new Group(
      this.id,
      this.tripId,
      this.name,
      this.description,
      this.image,
      this.organizerId,
      this.code,
      this.coins + amount,
      this.status,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Spend coins from group balance
   * Returns a new Group instance (immutable)
   * Returns error if insufficient balance
   */
  spendCoins(amount: number): Result<Group, string> {
    if (amount < 0) {
      return err("Cannot spend negative coins");
    }

    if (amount > this.coins) {
      return err(
        `Insufficient balance: ${this.coins} coins available, ${amount} required`,
      );
    }

    return ok(
      new Group(
        this.id,
        this.tripId,
        this.name,
        this.description,
        this.image,
        this.organizerId,
        this.code,
        this.coins - amount,
        this.status,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Mark group as deleted (soft delete)
   * Returns a new Group instance (immutable)
   */
  markAsDeleted(): Group {
    return new Group(
      this.id,
      this.tripId,
      this.name,
      this.description,
      this.image,
      this.organizerId,
      this.code,
      this.coins,
      GroupStatus.DELETED,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Check if group is active (not deleted)
   */
  isActive(): boolean {
    return this.status === GroupStatus.ACTIVE && !this.isDeleted();
  }

  /**
   * Check if group is deleted
   */
  isDeleted(): boolean {
    return this.status === GroupStatus.DELETED;
  }

  /**
   * Check if group has enough coins
   */
  hasEnoughCoins(amount: number): boolean {
    return this.coins >= amount;
  }

  /**
   * Get current coin balance
   */
  getBalance(): number {
    return this.coins;
  }

  /**
   * Get group summary for display
   */
  getSummary(): string {
    return `${this.name} (${this.code}) - ${this.coins} coins`;
  }
}
