import { Effect } from "effect";
import { ValidationError, StateTransitionError } from "../../system/errors";
import { TripStatus, isTerminalTripStatus } from "../../trip/enums";
import { validate } from "../../system/utils/entity-validation";
import { createStateMachine } from "../../system/utils/state-machine";
import { timestamps, updateEntity } from "../../system/utils/immutable";

/**
 * Trip entity - represents a trip in the system
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Trip {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly backgroundImagePath: string | null,
    public readonly status: TripStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * State machine for trip status transitions
   */
  private static readonly stateMachine = createStateMachine<TripStatus>({
    transitions: {
      [TripStatus.PLANNING]: [TripStatus.ACTIVE, TripStatus.CANCELLED],
      [TripStatus.ACTIVE]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
      [TripStatus.COMPLETED]: [],
      [TripStatus.CANCELLED]: [],
    },
    terminalStates: [TripStatus.COMPLETED, TripStatus.CANCELLED],
  });

  /**
   * Factory method to create a new Trip
   * Validates all input data
   */
  static create(props: {
    id?: string;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    backgroundImagePath?: string | null;
    status?: TripStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<Trip, ValidationError, never> {
    return Effect.gen(function* () {
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
          maxLength: 2000,
        });
      }

      // Validate dates
      const startDate = props.startDate;
      const endDate = props.endDate;

      if (endDate < startDate) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endDate must be after startDate",
            field: "endDate",
          }),
        );
      }

      // Validate status
      const status = props.status ?? TripStatus.PLANNING;
      if (!Object.values(TripStatus).includes(status)) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid status: ${status}`,
            field: "status",
          }),
        );
      }

      // Validate background image path if provided
      let backgroundImagePath: string | null = null;
      if (props.backgroundImagePath) {
        backgroundImagePath = yield* validate.string(
          props.backgroundImagePath,
          "backgroundImagePath",
          {
            required: false,
            maxLength: 1000,
          },
        );
      }

      const ts = timestamps(props);

      return new Trip(
        props.id ?? crypto.randomUUID(),
        name,
        description,
        startDate,
        endDate,
        backgroundImagePath,
        status,
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Transition trip to a new status
   */
  transitionStatus(
    newStatus: TripStatus,
  ): Effect.Effect<Trip, StateTransitionError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (!Trip.stateMachine.canTransition(self.status, newStatus)) {
        return yield* Effect.fail(
          new StateTransitionError({
            message: `Cannot transition from ${self.status} to ${newStatus}`,
            from: self.status,
            to: newStatus,
            entityType: "Trip",
          }),
        );
      }

      return updateEntity(self, { status: newStatus }, Trip);
    });
  }

  /**
   * Activate the trip (transition from PLANNING to ACTIVE)
   */
  activate(): Effect.Effect<Trip, StateTransitionError, never> {
    return this.transitionStatus(TripStatus.ACTIVE);
  }

  /**
   * Complete the trip (transition from ACTIVE to COMPLETED)
   */
  complete(): Effect.Effect<Trip, StateTransitionError, never> {
    return this.transitionStatus(TripStatus.COMPLETED);
  }

  /**
   * Cancel the trip
   */
  cancel(): Effect.Effect<Trip, StateTransitionError, never> {
    return this.transitionStatus(TripStatus.CANCELLED);
  }

  /**
   * Update trip details
   */
  update(props: {
    name?: string;
    description?: string | null;
    startDate?: Date;
    endDate?: Date;
    backgroundImagePath?: string | null;
  }): Effect.Effect<Trip, ValidationError, never> {
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
              maxLength: 2000,
            },
          );
        } else {
          description = null;
        }
      }

      // Validate dates
      const startDate = props.startDate ?? self.startDate;
      const endDate = props.endDate ?? self.endDate;

      if (endDate < startDate) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endDate must be after startDate",
            field: "endDate",
          }),
        );
      }

      // Validate background image path if provided
      let backgroundImagePath = self.backgroundImagePath;
      if (props.backgroundImagePath !== undefined) {
        if (props.backgroundImagePath) {
          backgroundImagePath = yield* validate.string(
            props.backgroundImagePath,
            "backgroundImagePath",
            {
              required: false,
              maxLength: 1000,
            },
          );
        } else {
          backgroundImagePath = null;
        }
      }

      return updateEntity(
        self,
        {
          name,
          description,
          startDate,
          endDate,
          backgroundImagePath,
        },
        Trip,
      );
    });
  }

  /**
   * Check if trip is in planning phase
   */
  isPlanning(): boolean {
    return this.status === TripStatus.PLANNING;
  }

  /**
   * Check if trip is active
   */
  isActive(): boolean {
    return this.status === TripStatus.ACTIVE;
  }

  /**
   * Check if trip is completed
   */
  isCompleted(): boolean {
    return this.status === TripStatus.COMPLETED;
  }

  /**
   * Check if trip is cancelled
   */
  isCancelled(): boolean {
    return this.status === TripStatus.CANCELLED;
  }

  /**
   * Check if trip is in a terminal state
   */
  isTerminal(): boolean {
    return isTerminalTripStatus(this.status);
  }

  /**
   * Check if trip is ongoing (between start and end dates)
   */
  isOngoing(now: Date = new Date()): boolean {
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * Check if trip has started
   */
  hasStarted(now: Date = new Date()): boolean {
    return now >= this.startDate;
  }

  /**
   * Check if trip has ended
   */
  hasEnded(now: Date = new Date()): boolean {
    return now > this.endDate;
  }

  /**
   * Get trip duration in days
   */
  getDurationInDays(): number {
    const diffTime = Math.abs(
      this.endDate.getTime() - this.startDate.getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if trip can be modified (not in terminal state)
   */
  canBeModified(): boolean {
    return !this.isTerminal();
  }

  /**
   * Check if user can join trip
   */
  canBeJoined(): boolean {
    return (
      this.status === TripStatus.PLANNING || this.status === TripStatus.ACTIVE
    );
  }
}
