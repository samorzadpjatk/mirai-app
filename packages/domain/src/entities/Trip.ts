import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

/**
 * Trip status
 */
export enum TripStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * State machine for Trip status transitions
 */
const stateMachine = createStateMachine<TripStatus>({
  transitions: {
    [TripStatus.PLANNING]: [TripStatus.ACTIVE, TripStatus.CANCELLED],
    [TripStatus.ACTIVE]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
    [TripStatus.COMPLETED]: [],
    [TripStatus.CANCELLED]: [],
  },
  terminalStates: [TripStatus.COMPLETED, TripStatus.CANCELLED],
});

/**
 * Trip entity - represents a trip/event in the system
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Trip {
  private constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public startDate: Date,
    public endDate: Date,
    public backgroundImagePath: string | null,
    public status: TripStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

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
  }): Result<Trip, ValidationError> {
    // Validate name
    const name = validate.string(props.name, "name", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(name)) return err(name.error);

    // Validate description (optional)
    const description = validate.string(
      props.description ?? "",
      "description",
      {
        required: false,
        maxLength: 2000,
        trim: true,
      },
    );
    if (isError(description)) return err(description.error);

    // Validate date range
    const dateRangeResult = validate.dateRange(props.startDate, props.endDate);
    if (isError(dateRangeResult)) {
      return err(
        new ValidationError("endDate must be after startDate", "endDate"),
      );
    }

    const ts = timestamps(props);

    return ok(
      new Trip(
        props.id ?? crypto.randomUUID(),
        name.value,
        description.value || null,
        props.startDate,
        props.endDate,
        props.backgroundImagePath ?? null,
        props.status ?? TripStatus.PLANNING,
        ts.createdAt,
        ts.updatedAt,
      ),
    );
  }

  /**
   * Update trip details
   * Returns a new Trip instance (immutable)
   */
  updateDetails(props: {
    name?: string;
    description?: string | null;
    backgroundImagePath?: string | null;
  }): Result<Trip, ValidationError | StateTransitionError> {
    // Cannot update completed or cancelled trips
    if (this.isTerminal()) {
      return err(new StateTransitionError(this.status, this.status));
    }

    const updates: Partial<Trip> = {};

    // Validate name if provided
    if (props.name !== undefined) {
      const validated = validate.string(props.name, "name", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.name = validated.value;
    }

    if (props.description !== undefined) {
      updates.description = props.description;
    }

    if (props.backgroundImagePath !== undefined) {
      updates.backgroundImagePath = props.backgroundImagePath;
    }

    return ok(updateEntity(this, updates, Trip));
  }

  /**
   * Update trip dates
   * Returns a new Trip instance (immutable)
   */
  updateDates(props: {
    startDate?: Date;
    endDate?: Date;
  }): Result<Trip, ValidationError | StateTransitionError> {
    // Cannot update completed or cancelled trips
    if (this.isTerminal()) {
      return err(new StateTransitionError(this.status, this.status));
    }

    const newStartDate = props.startDate ?? this.startDate;
    const newEndDate = props.endDate ?? this.endDate;

    // Validate date range
    const dateRangeResult = validate.dateRange(newStartDate, newEndDate);
    if (isError(dateRangeResult)) {
      return err(
        new ValidationError("endDate must be after startDate", "endDate"),
      );
    }

    const updates: Partial<Trip> = {};
    if (props.startDate !== undefined) updates.startDate = props.startDate;
    if (props.endDate !== undefined) updates.endDate = props.endDate;

    return ok(updateEntity(this, updates, Trip));
  }

  /**
   * Start the trip
   * Returns a Result with new Trip instance or StateTransitionError
   */
  start(): Result<Trip, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, TripStatus.ACTIVE)) {
      return err(new StateTransitionError(this.status, TripStatus.ACTIVE));
    }

    return ok(updateEntity(this, { status: TripStatus.ACTIVE }, Trip));
  }

  /**
   * Complete the trip
   * Returns a Result with new Trip instance or StateTransitionError
   */
  complete(): Result<Trip, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, TripStatus.COMPLETED)) {
      return err(new StateTransitionError(this.status, TripStatus.COMPLETED));
    }

    return ok(updateEntity(this, { status: TripStatus.COMPLETED }, Trip));
  }

  /**
   * Cancel the trip
   * Returns a Result with new Trip instance or StateTransitionError
   */
  cancel(): Result<Trip, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, TripStatus.CANCELLED)) {
      return err(new StateTransitionError(this.status, TripStatus.CANCELLED));
    }

    return ok(updateEntity(this, { status: TripStatus.CANCELLED }, Trip));
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
   * Check if trip is in a terminal state (COMPLETED or CANCELLED)
   */
  isTerminal(): boolean {
    return stateMachine.isTerminal(this.status);
  }

  /**
   * Check if trip has started (start date has passed)
   */
  hasStarted(): boolean {
    return new Date() >= this.startDate;
  }

  /**
   * Check if trip has ended (end date has passed)
   */
  hasEnded(): boolean {
    return new Date() > this.endDate;
  }

  /**
   * Check if trip is currently ongoing
   */
  isOngoing(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * Get duration of trip in days
   */
  getDurationInDays(): number {
    const diffTime = Math.abs(
      this.endDate.getTime() - this.startDate.getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get trip summary for display
   */
  getSummary(): string {
    const startStr = this.startDate.toLocaleDateString();
    const endStr = this.endDate.toLocaleDateString();
    return `${this.name} (${startStr} - ${endStr})`;
  }

  /**
   * Check if the trip can transition to a specific status
   */
  canTransitionTo(targetStatus: TripStatus): boolean {
    return stateMachine.canTransition(this.status, targetStatus);
  }

  /**
   * Update the trip status with validation
   * Returns a Result with new Trip instance or StateTransitionError
   */
  updateStatus(newStatus: TripStatus): Result<Trip, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, newStatus)) {
      return err(new StateTransitionError(this.status, newStatus));
    }

    return ok(updateEntity(this, { status: newStatus }, Trip));
  }
}
