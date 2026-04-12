import { Trip } from "@mirai-app/domain";
import { Effect } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";

/**
 * Input for GetTripById use case
 */
export interface GetTripByIdInput {
  tripId: string;
}

/**
 * Output DTO for GetTripById use case
 */
export interface GetTripByIdOutput {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  backgroundImagePath: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isPlanning: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isOngoing: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  durationInDays: number;
  summary: string;
}

/**
 * Error types for GetTripById use case
 */
export class GetTripByIdNotFoundError extends Error {
  readonly _tag = "GetTripByIdNotFoundError";
  constructor() {
    super("Trip not found");
  }
}

/**
 * GetTripById Use Case
 *
 * Retrieves a trip by its ID.
 * Returns error if trip not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getTripByIdUseCase({ tripId: "123" });
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
export function getTripByIdUseCase(
  input: GetTripByIdInput,
): Effect.Effect<
  GetTripByIdOutput,
  GetTripByIdNotFoundError,
  TripRepositoryTag
> {
  return Effect.gen(function* () {
    const tripRepo = yield* TripRepositoryTag;

    // Load trip
    const trip = yield* tripRepo.findById(input.tripId);

    if (!trip) {
      return yield* Effect.fail(new GetTripByIdNotFoundError());
    }

    return toOutput(trip);
  });
}

function toOutput(trip: Trip): GetTripByIdOutput {
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
    isOngoing: trip.isOngoing(),
    hasStarted: trip.hasStarted(),
    hasEnded: trip.hasEnded(),
    durationInDays: trip.getDurationInDays(),
    summary: trip.getSummary(),
  };
}
