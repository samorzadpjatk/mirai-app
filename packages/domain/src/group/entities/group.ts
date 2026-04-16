import { Effect } from "effect";
import { ValidationError, StateTransitionError } from "../../system/errors";
import { GroupStatus } from "../../group/enums";
import { validate } from "../../system/utils/entity-validation";
import { createStateMachine } from "../../system/utils/state-machine";
import { timestamps, updateEntity } from "../../system/utils/immutable";

/**
 * Group entity - represents a group participating in a trip
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
    public readonly isDeleted: boolean,
    public readonly organizerId: string,
    public readonly code: string,
    public readonly coins: number,
    public readonly status: GroupStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * State machine for group status transitions
   */
  private static readonly stateMachine = createStateMachine<GroupStatus>({
    transitions: {
      [GroupStatus.ACTIVE]: [GroupStatus.DELETED],
      [GroupStatus.DELETED]: [],
    },
    terminalStates: [GroupStatus.DELETED],
  });

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
    isDeleted?: boolean;
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
        minLength: 1,
        maxLength: 255,
      });

      // Validate description if provided
      let description: string | null = null;
      if (props.description) {
        description = yield* validate.string(props.description, "description", {
          required: false,
          maxLength: 1000,
        });
      }

      // Validate image URL if provided
      let image: string | null = null;
      if (props.image) {
        image = yield* validate.string(props.image, "image", {
          required: false,
          maxLength: 1000,
        });
      }

      // Validate organizerId
      const organizerId = yield* validate.id(props.organizerId, "organizerId");

      // Validate code (unique join code)
      const code = yield* validate.string(props.code, "code", {
        required: true,
        minLength: 3,
        maxLength: 50,
      });

      // Validate coins (must be non-negative)
      const coins = props.coins ?? 0;
      if (coins < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "coins must be non-negative",
            field: "coins",
          }),
        );
      }

      // Validate status
      const status = props.status ?? GroupStatus.ACTIVE;
      if (!Object.values(GroupStatus).includes(status)) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid status: ${status}`,
            field: "status",
          }),
        );
      }

      const ts = timestamps(props);

      return new Group(
        props.id ?? crypto.randomUUID(),
        tripId,
        name,
        description,
        image,
        props.isDeleted ?? false,
        organizerId,
        code,
        coins,
        status,
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Transition group to a new status
   */
  transitionStatus(
    newStatus: GroupStatus,
  ): Effect.Effect<Group, StateTransitionError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (!Group.stateMachine.canTransition(self.status, newStatus)) {
        return yield* Effect.fail(
          new StateTransitionError({
            message: `Cannot transition from ${self.status} to ${newStatus}`,
            from: self.status,
            to: newStatus,
            entityType: "Group",
          }),
        );
      }

      return updateEntity(self, { status: newStatus }, Group);
    });
  }

  /**
   * Mark group as deleted (soft delete)
   */
  markAsDeleted(): Effect.Effect<Group, StateTransitionError, never> {
    return this.transitionStatus(GroupStatus.DELETED);
  }

  /**
   * Update group details
   */
  update(props: {
    name?: string;
    description?: string | null;
    image?: string | null;
    code?: string;
  }): Effect.Effect<Group, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Validate name if provided
      let name = self.name;
      if (props.name !== undefined) {
        name = yield* validate.string(props.name, "name", {
          required: true,
          minLength: 1,
          maxLength: 255,
        });
      }

      // Validate description if provided
      let description = self.description;
      if (props.description !== undefined) {
        if (props.description) {
          description = yield* validate.string(
            props.description,
            "description",
            {
              required: false,
              maxLength: 1000,
            },
          );
        } else {
          description = null;
        }
      }

      // Validate image if provided
      let image = self.image;
      if (props.image !== undefined) {
        if (props.image) {
          image = yield* validate.string(props.image, "image", {
            required: false,
            maxLength: 1000,
          });
        } else {
          image = null;
        }
      }

      // Validate code if provided
      let code = self.code;
      if (props.code !== undefined) {
        code = yield* validate.string(props.code, "code", {
          required: true,
          minLength: 3,
          maxLength: 50,
        });
      }

      return updateEntity(
        self,
        {
          name,
          description,
          image,
          code,
        },
        Group,
      );
    });
  }

  /**
   * Add coins to the group's balance
   */
  addCoins(amount: number): Effect.Effect<Group, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (amount <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "amount must be positive",
            field: "amount",
          }),
        );
      }

      return updateEntity(
        self,
        {
          coins: self.coins + amount,
        },
        Group,
      );
    });
  }

  /**
   * Subtract coins from the group's balance
   */
  subtractCoins(amount: number): Effect.Effect<Group, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (amount <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "amount must be positive",
            field: "amount",
          }),
        );
      }

      if (amount > self.coins) {
        return yield* Effect.fail(
          new ValidationError({
            message: "insufficient coins",
            field: "amount",
          }),
        );
      }

      return updateEntity(
        self,
        {
          coins: self.coins - amount,
        },
        Group,
      );
    });
  }

  /**
   * Check if group is active
   */
  isActive(): boolean {
    return this.status === GroupStatus.ACTIVE && !this.isDeleted;
  }

  /**
   * Check if group is deleted
   */
  isDeletedGroup(): boolean {
    return this.status === GroupStatus.DELETED || this.isDeleted;
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
  getCoinBalance(): number {
    return this.coins;
  }

  /**
   * Check if user is the organizer
   */
  isOrganizer(userId: string): boolean {
    return this.organizerId === userId;
  }

  /**
   * Check if group belongs to a specific trip
   */
  belongsToTrip(tripId: string): boolean {
    return this.tripId === tripId;
  }

  /**
   * Get join code
   */
  getJoinCode(): string {
    return this.code;
  }

  /**
   * Check if join code matches
   */
  matchesJoinCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * Update organizer
   */
  changeOrganizer(
    newOrganizerId: string,
  ): Effect.Effect<Group, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      const validatedOrganizerId = yield* validate.id(
        newOrganizerId,
        "organizerId",
      );

      return updateEntity(
        self,
        {
          organizerId: validatedOrganizerId,
        },
        Group,
      );
    });
  }

  /**
   * Get a summary of the group
   */
  getSummary(): string {
    return `${this.name} (${this.code}) - ${this.coins} coins`;
  }
}
