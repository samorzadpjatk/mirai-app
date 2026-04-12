import {
  Trip,
  TripStatus,
  ValidationError,
  StateTransitionError,
} from "@mirai-app/domain";
import { Effect } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";

/**
 * Input for UpdateTrip use case
 */
export interface UpdateTripInput {
  tripId: string;
  name?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  backgroundImagePath?: string | null;
  status?: TripStatus;
}

/**
 * Output DTO for UpdateTrip use case
 */
export interface UpdateTripOutput {
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
  isCompleted: boolean;
  isCancelled: boolean;
  durationInDays: number;
  summary: string;
}

/**
 * Error types for UpdateTrip use case
 */
export class UpdateTripNotFoundError extends Error {
  readonly _tag = "UpdateTripNotFoundError";
  constructor() {
    super("Trip not found");
  }
}

export class UpdateTripValidationError extends Error {
  readonly _tag = "UpdateTripValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class UpdateTripStateError extends Error {
  readonly _tag = "UpdateTripStateError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * UpdateTrip Use Case
 *
 * Updates a trip's details.
 * Returns error if trip not found, is in terminal state, or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateTripUseCase({ tripId: "123", name: "New Name" });
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
export function updateTripUseCase(
  input: UpdateTripInput,
): Effect.Effect<
  UpdateTripOutput,
  UpdateTripNotFoundError | UpdateTripValidationError | UpdateTripStateError,
  TripRepositoryTag
> {
  return Effect.gen(function* () {
    const tripRepo = yield* TripRepositoryTag;

    // Load trip
    const trip = yield* tripRepo.findById(input.tripId);

    if (!trip) {
      return yield* Effect.fail(new UpdateTripNotFoundError());
    }

    // Cannot update completed or cancelled trips
    if (trip.isTerminal()) {
      return yield* Effect.fail(
        new UpdateTripStateError("Cannot update a completed or cancelled trip"),
      );
    }

    let updatedTrip: Trip = trip;

    // Update basic details if provided
    if (
      input.name !== undefined ||
      input.description !== undefined ||
      input.backgroundImagePath !== undefined
    ) {
      updatedTrip = yield* updatedTrip
        .updateDetails({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.backgroundImagePath !== undefined && {
            backgroundImagePath: input.backgroundImagePath,
          }),
        })
        .pipe(
          Effect.mapError((error: ValidationError | StateTransitionError) => {
            if (error instanceof StateTransitionError) {
              return new UpdateTripStateError(error.message);
            }
            return new UpdateTripValidationError(error.message);
          }),
        );
    }

    // Update dates if provided
    if (input.startDate !== undefined || input.endDate !== undefined) {
      updatedTrip = yield* updatedTrip
        .updateDates({
          ...(input.startDate !== undefined && { startDate: input.startDate }),
          ...(input.endDate !== undefined && { endDate: input.endDate }),
        })
        .pipe(
          Effect.mapError((error: ValidationError | StateTransitionError) => {
            if (error instanceof StateTransitionError) {
              return new UpdateTripStateError(error.message);
            }
            return new UpdateTripValidationError(error.message);
          }),
        );
    }

    // Update status if provided (using state machine transitions)
    if (input.status !== undefined && input.status !== trip.status) {
      updatedTrip = yield* updatedTrip.updateStatus(input.status).pipe(
        Effect.mapError((error: StateTransitionError) => {
          return new UpdateTripStateError(
            `Invalid status transition from ${error.from} to ${error.to}`,
          );
        }),
      );
    }

    // Save updated trip
    const saved = yield* tripRepo.update(updatedTrip);

    return toOutput(saved);
  });
}

function toOutput(trip: Trip): UpdateTripOutput {
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
    isCompleted: trip.isCompleted(),
    isCancelled: trip.isCancelled(),
    durationInDays: trip.getDurationInDays(),
    summary: trip.getSummary(),
  };
}
