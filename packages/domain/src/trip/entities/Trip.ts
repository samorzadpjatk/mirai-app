import type { TripId } from "../value-objects/TripId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Trip Domain Entity
 *
 * Represents a trip with its date range and metadata.
 */
export class Trip {
  private constructor(
    readonly id: TripId,
    readonly name: string,
    readonly description: string | null,
    readonly startDate: Date,
    readonly endDate: Date,
    readonly backgroundImagePath: string | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a Trip entity
   */
  static create(props: {
    id: TripId;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    backgroundImagePath?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Effect.Effect<Trip, ValidationError, never> {
    const trimmedName = props.name.trim();

    if (trimmedName.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "name",
          message: "Trip name is required",
          value: props.name,
        }),
      );
    }

    if (trimmedName.length > 200) {
      return Effect.fail(
        new ValidationError({
          field: "name",
          message: "Trip name must be at most 200 characters",
          value: props.name,
        }),
      );
    }

    if (props.endDate < props.startDate) {
      return Effect.fail(
        new ValidationError({
          field: "endDate",
          message: "End date must be after start date",
          value: props.endDate,
        }),
      );
    }

    return Effect.succeed(
      new Trip(
        props.id,
        trimmedName,
        props.description ?? null,
        props.startDate,
        props.endDate,
        props.backgroundImagePath ?? null,
        props.createdAt,
        props.updatedAt,
      ),
    );
  }

  /**
   * Check if the trip is currently active (within date range)
   */
  isActive(atDate: Date = new Date()): boolean {
    return atDate >= this.startDate && atDate <= this.endDate;
  }

  /**
   * Check if the trip has ended
   */
  hasEnded(atDate: Date = new Date()): boolean {
    return atDate > this.endDate;
  }

  /**
   * Check if the trip has started
   */
  hasStarted(atDate: Date = new Date()): boolean {
    return atDate >= this.startDate;
  }

  /**
   * Get trip duration in days
   */
  getDurationInDays(): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return (
      Math.ceil(
        (this.endDate.getTime() - this.startDate.getTime()) / msPerDay,
      ) + 1
    );
  }

  /**
   * Update trip details
   */
  withDetails(props: {
    name?: string;
    description?: string | null;
    backgroundImagePath?: string | null;
  }): Effect.Effect<Trip, ValidationError, never> {
    return Trip.create({
      id: this.id,
      name: props.name ?? this.name,
      description:
        props.description !== undefined ? props.description : this.description,
      startDate: this.startDate,
      endDate: this.endDate,
      backgroundImagePath:
        props.backgroundImagePath !== undefined
          ? props.backgroundImagePath
          : this.backgroundImagePath,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Update trip dates
   */
  withDates(props: {
    startDate?: Date;
    endDate?: Date;
  }): Effect.Effect<Trip, ValidationError, never> {
    return Trip.create({
      id: this.id,
      name: this.name,
      description: this.description,
      startDate: props.startDate ?? this.startDate,
      endDate: props.endDate ?? this.endDate,
      backgroundImagePath: this.backgroundImagePath,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
