import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors";

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
    return Effect.gen(function* () {
      // Validate tripId
      const tripId = yield* validate.id(props.tripId, "tripId");

      // Validate name
      const name = yield* validate.string(props.name, "name", {
        required: true,
        maxLength: 100,
        trim: true,
      });

      // Validate organizerId
      const organizerId = yield* validate.id(props.organizerId, "organizerId");

      // Validate code
      const code = yield* validate.string(props.code, "code", {
        required: true,
        maxLength: 50,
        trim: true,
      });

      // Validate coins
      const coins = yield* validate.number(props.coins ?? 0, "coins", {
        required: true,
        min: 0,
      });

      // Validate description (optional)
      const description = yield* validate.string(
        props.description ?? "",
        "description",
        {
          required: false,
          maxLength: 500,
          trim: true,
        },
      );

      const ts = timestamps(props);

      return new Group(
        props.id ?? crypto.randomUUID(),
        tripId,
        name,
        description || null,
        props.image ?? null,
        organizerId,
        code,
        coins,
        props.status ?? GroupStatus.ACTIVE,
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Factory method to reconstitute a Group from persistence
   * Bypasses validation for loading existing data
   */
  static reconstitute(data: {
    id: string;
    tripId: string;
    name: string;
    description: string | null;
    image: string | null;
    organizerId: string;
    code: string;
    coins: number;
    status: GroupStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Group {
    return new Group(
      data.id,
      data.tripId,
      data.name,
      data.description,
      data.image,
      data.organizerId,
      data.code,
      data.coins,
      data.status,
      data.createdAt,
      data.updatedAt,
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      // Cannot update deleted group
      if (self.isDeleted()) {
        return yield* Effect.fail(
          new StateTransitionError({
            from: self.status,
            to: self.status,
            entityType: "Group",
            message: `Cannot update details: group is already deleted`,
          }),
        );
      }

      const updates: Partial<Group> = {};

      // Validate name if provided
      if (props.name !== undefined) {
        const validated = yield* validate.string(props.name, "name", {
          required: true,
          maxLength: 100,
          trim: true,
        });
        updates.name = validated;
      }

      // Validate description if provided
      if (props.description !== undefined && props.description !== null) {
        const validated = yield* validate.string(
          props.description,
          "description",
          {
            required: false,
            maxLength: 500,
            trim: true,
          },
        );
        updates.description = validated;
      } else if (props.description === null) {
        updates.description = null;
      }

      if (props.image !== undefined) {
        updates.image = props.image;
      }

      return updateEntity(self, updates, Group);
    });
  }

  /**
   * Change group organizer
   * Returns an Effect with new Group instance or ValidationError
   */
  changeOrganizer(
    newOrganizerId: string,
  ): Effect.Effect<Group, ValidationError, never> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const organizerId = yield* validate.id(newOrganizerId, "organizerId");

      return updateEntity(self, { organizerId }, Group);
    });
  }

  /**
   * Add coins to group balance
   * Returns an Effect with new Group instance or ValidationError
   */
  addCoins = (amount: number): Effect.Effect<Group, ValidationError, never> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const validated = yield* validate.number(amount, "amount", {
        required: true,
        min: 0,
      });

      return updateEntity(self, { coins: self.coins + validated }, Group);
    });
  };

  /**
   * Spend coins from group balance
   * Returns a new Group instance (immutable)
   * Returns error if insufficient balance
   */
  spendCoins = (
    amount: number,
  ): Effect.Effect<Group, ValidationError, never> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const validated = yield* validate.number(amount, "amount", {
        required: true,
        min: 0,
      });

      if (validated > self.coins) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Insufficient balance: ${self.coins} coins available, ${validated} required`,
            field: "coins",
          }),
        );
      }

      return updateEntity(self, { coins: self.coins - validated }, Group);
    });
  };

  /**
   * Mark group as deleted (soft delete)
   * Returns an Effect with new Group instance or StateTransitionError
   */
  markAsDeleted = (): Effect.Effect<Group, StateTransitionError, never> => {
    if (!stateMachine.canTransition(this.status, GroupStatus.DELETED)) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: GroupStatus.DELETED,
          entityType: "Group",
          message: `Cannot transition from ${this.status} to DELETED: invalid state transition`,
        }),
      );
    }

    return Effect.succeed(
      updateEntity(this, { status: GroupStatus.DELETED }, Group),
    );
  };

  /**
   * Check if group is active (not deleted)
   */
  isActive = (): boolean => {
    return this.status === GroupStatus.ACTIVE && !this.isDeleted();
  };

  /**
   * Check if group is deleted
   */
  isDeleted = (): boolean => {
    return this.status === GroupStatus.DELETED;
  };

  /**
   * Check if group has enough coins
   */
  hasEnoughCoins = (amount: number): boolean => {
    return this.coins >= amount;
  };

  /**
   * Get current coin balance
   */
  getBalance = (): number => {
    return this.coins;
  };

  /**
   * Get group summary for display
   */
  getSummary = (): string => {
    return `${this.name} (${this.code}) - ${this.coins} coins`;
  };
}
