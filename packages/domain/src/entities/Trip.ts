import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

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
 * Validation rules for trip data
 */
const VALIDATION_RULES = {
  name: {
    minLength: 1,
    maxLength: 200,
  },
  description: {
    maxLength: 2000,
  },
};

/**
 * Trip entity - represents a trip/event in the system
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
  }): Result<Trip, string> {
    // Validate name
    if (!props.name || props.name.trim() === "") {
      return err("name is required");
    }
    if (props.name.length > VALIDATION_RULES.name.maxLength) {
      return err(
        `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
      );
    }

    // Validate dates
    if (props.endDate.getTime() < props.startDate.getTime()) {
      return err("endDate must be after startDate");
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
      new Trip(
        props.id ?? crypto.randomUUID(),
        props.name.trim(),
        props.description ?? null,
        props.startDate,
        props.endDate,
        props.backgroundImagePath ?? null,
        props.status ?? TripStatus.PLANNING,
        props.createdAt ?? now,
        props.updatedAt ?? now,
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
  }): Result<Trip, string> {
    // Cannot update completed or cancelled trips
    if (this.isTerminal()) {
      return err("Cannot update a completed or cancelled trip");
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

    return ok(
      new Trip(
        this.id,
        props.name ?? this.name,
        props.description !== undefined ? props.description : this.description,
        this.startDate,
        this.endDate,
        props.backgroundImagePath !== undefined
          ? props.backgroundImagePath
          : this.backgroundImagePath,
        this.status,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update trip dates
   * Returns a new Trip instance (immutable)
   */
  updateDates(props: {
    startDate?: Date;
    endDate?: Date;
  }): Result<Trip, string> {
    // Cannot update completed or cancelled trips
    if (this.isTerminal()) {
      return err("Cannot update a completed or cancelled trip");
    }

    const newStartDate = props.startDate ?? this.startDate;
    const newEndDate = props.endDate ?? this.endDate;

    if (newEndDate.getTime() < newStartDate.getTime()) {
      return err("endDate must be after startDate");
    }

    return ok(
      new Trip(
        this.id,
        this.name,
        this.description,
        newStartDate,
        newEndDate,
        this.backgroundImagePath,
        this.status,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Start the trip
   * Returns a new Trip instance (immutable)
   */
  start(): Trip {
    if (this.status !== TripStatus.PLANNING) {
      throw new Error(`Cannot start trip from status: ${this.status}`);
    }

    return new Trip(
      this.id,
      this.name,
      this.description,
      this.startDate,
      this.endDate,
      this.backgroundImagePath,
      TripStatus.ACTIVE,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Complete the trip
   * Returns a new Trip instance (immutable)
   */
  complete(): Trip {
    if (this.status !== TripStatus.ACTIVE) {
      throw new Error(`Cannot complete trip from status: ${this.status}`);
    }

    return new Trip(
      this.id,
      this.name,
      this.description,
      this.startDate,
      this.endDate,
      this.backgroundImagePath,
      TripStatus.COMPLETED,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Cancel the trip
   * Returns a new Trip instance (immutable)
   */
  cancel(): Trip {
    if (this.status === TripStatus.COMPLETED) {
      throw new Error("Cannot cancel a completed trip");
    }

    return new Trip(
      this.id,
      this.name,
      this.description,
      this.startDate,
      this.endDate,
      this.backgroundImagePath,
      TripStatus.CANCELLED,
      this.createdAt,
      new Date(), // updatedAt
    );
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
    return this.isCompleted() || this.isCancelled();
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
}
