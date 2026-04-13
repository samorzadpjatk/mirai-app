import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

/**
 * Group status
 */
export enum GroupStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

/**
 * State machine for Group status transitions
 */
const stateMachine = createStateMachine<GroupStatus>({
  transitions: {
    [GroupStatus.ACTIVE]: [GroupStatus.DELETED],
    [GroupStatus.DELETED]: [],
  },
  terminalStates: [GroupStatus.DELETED],
});

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
    public name: string,
    public description: string | null,
    public image: string | null,
    public readonly organizerId: string,
    public readonly code: string,
    public coins: number,
    public status: GroupStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Group
   * Validates all input data
   *
   * Returns Effect<Group, ValidationError, never> - pure synchronous effect
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
  }): Effect.Effect<Group, ValidationError, never> {
    // Validate tripId
    const tripId = validate.id(props.tripId, "tripId");
    if (isError(tripId)) {
      return Effect.fail(
        new ValidationError({
          message: tripId.error.message,
          field: "tripId",
        }),
      );
    }

    // Validate name
    const name = validate.string(props.name, "name", {
      required: true,
      maxLength: 100,
      trim: true,
    });
    if (isError(name)) {
      return Effect.fail(
        new ValidationError({
          message: name.error.message,
          field: "name",
        }),
      );
    }

    // Validate organizerId
    const organizerId = validate.id(props.organizerId, "organizerId");
    if (isError(organizerId)) {
      return Effect.fail(
        new ValidationError({
          message: organizerId.error.message,
          field: "organizerId",
        }),
      );
    }

    // Validate code
    const code = validate.string(props.code, "code", {
      required: true,
      maxLength: 50,
      trim: true,
    });
    if (isError(code)) {
      return Effect.fail(
        new ValidationError({
          message: code.error.message,
          field: "code",
        }),
      );
    }

    // Validate coins
    const coins = validate.number(props.coins ?? 0, "coins", {
      required: true,
      min: 0,
    });
    if (isError(coins)) {
      return Effect.fail(
        new ValidationError({
          message: coins.error.message,
          field: "coins",
        }),
      );
    }

    // Validate description (optional)
    const description = validate.string(
      props.description ?? "",
      "description",
      {
        required: false,
        maxLength: 500,
        trim: true,
      },
    );
    if (isError(description)) {
      return Effect.fail(
        new ValidationError({
          message: description.error.message,
          field: "description",
        }),
      );
    }

    const ts = timestamps(props);

    return Effect.succeed(
      new Group(
        props.id ?? crypto.randomUUID(),
        tripId.value,
        name.value,
        description.value || null,
        props.image ?? null,
        organizerId.value,
        code.value,
        coins.value,
        props.status ?? GroupStatus.ACTIVE,
        ts.createdAt,
        ts.updatedAt,
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
  }): Effect.Effect<Group, ValidationError | StateTransitionError, never> {
    // Cannot update deleted group
    if (this.isDeleted()) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: this.status,
          entityType: "Group",
        }),
      );
    }

    const updates: Partial<Group> = {};

    // Validate name if provided
    if (props.name !== undefined) {
      const validated = validate.string(props.name, "name", {
        required: true,
        maxLength: 100,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "name",
          }),
        );
      }
      updates.name = validated.value;
    }

    // Validate description if provided
    if (props.description !== undefined && props.description !== null) {
      const validated = validate.string(props.description, "description", {
        required: false,
        maxLength: 500,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "description",
          }),
        );
      }
      updates.description = validated.value;
    } else if (props.description === null) {
      updates.description = null;
    }

    if (props.image !== undefined) {
      updates.image = props.image;
    }

    return Effect.succeed(updateEntity(this, updates, Group));
  }

  /**
   * Change group organizer
   * Returns an Effect with new Group instance or ValidationError
   */
  changeOrganizer(
    newOrganizerId: string,
  ): Effect.Effect<Group, ValidationError, never> {
    const organizerId = validate.id(newOrganizerId, "organizerId");
    if (isError(organizerId)) {
      return Effect.fail(
        new ValidationError({
          message: organizerId.error.message,
          field: "organizerId",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(this, { organizerId: organizerId.value }, Group),
    );
  }

  /**
   * Add coins to group balance
   * Returns an Effect with new Group instance or ValidationError
   */
  addCoins(amount: number): Effect.Effect<Group, ValidationError, never> {
    const validated = validate.number(amount, "amount", {
      required: true,
      min: 0,
    });
    if (isError(validated)) {
      return Effect.fail(
        new ValidationError({
          message: validated.error.message,
          field: "amount",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(this, { coins: this.coins + amount }, Group),
    );
  }

  /**
   * Spend coins from group balance
   * Returns a new Group instance (immutable)
   * Returns error if insufficient balance
   */
  spendCoins(amount: number): Effect.Effect<Group, ValidationError, never> {
    const validated = validate.number(amount, "amount", {
      required: true,
      min: 0,
    });
    if (isError(validated)) {
      return Effect.fail(
        new ValidationError({
          message: validated.error.message,
          field: "amount",
        }),
      );
    }

    if (amount > this.coins) {
      return Effect.fail(
        new ValidationError({
          message: `Insufficient balance: ${this.coins} coins available, ${amount} required`,
          field: "coins",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(this, { coins: this.coins - amount }, Group),
    );
  }

  /**
   * Mark group as deleted (soft delete)
   * Returns an Effect with new Group instance or StateTransitionError
   */
  markAsDeleted(): Effect.Effect<Group, StateTransitionError, never> {
    if (!stateMachine.canTransition(this.status, GroupStatus.DELETED)) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: GroupStatus.DELETED,
          entityType: "Group",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(this, { status: GroupStatus.DELETED }, Group),
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
