import { Trip, TripStatus, ValidationError } from "@mirai-app/domain";
import { Effect } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";

/**
 * Input for CreateTrip use case
 */
export interface CreateTripInput {
  name: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  backgroundImagePath?: string | null;
  status?: TripStatus;
}

/**
 * Output DTO for CreateTrip use case
 */
export interface CreateTripOutput {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  backgroundImagePath: string | null;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isPlanning: boolean;
  durationInDays: number;
}

/**
 * Error types for CreateTrip use case
 */
export class TripCreationError extends Error {
  readonly _tag = "TripCreationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * CreateTrip Use Case
 *
 * Creates a new trip in the system.
 * Returns error if validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createTripUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(TripRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createTripUseCase(
  input: CreateTripInput,
): Effect.Effect<CreateTripOutput, TripCreationError, TripRepositoryTag> {
  return Effect.gen(function* () {
    const tripRepo = yield* TripRepositoryTag;

    // Create domain entity using Effect-based static create method
    const trip = yield* Trip.create({
      name: input.name,
      description: input.description ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      backgroundImagePath: input.backgroundImagePath ?? null,
      status: input.status ?? TripStatus.PLANNING,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new TripCreationError(validationError.message),
      ),
    );

    // Save to repository
    const saved = yield* tripRepo.create(trip);

    return toOutput(saved);
  });
}

function toOutput(trip: Trip): CreateTripOutput {
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    backgroundImagePath: trip.backgroundImagePath,
    status: trip.status,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    isActive: trip.isActive(),
    isPlanning: trip.isPlanning(),
    durationInDays: trip.getDurationInDays(),
  };
}
