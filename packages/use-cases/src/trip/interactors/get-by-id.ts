import type { TripDTO } from "../dto";
import { Effect, Data } from "effect";
import { TripGatewayTag } from "../ports/gateway";
import { DatabaseError, TripStatus } from "@mirai-app/domain";

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
export class GetTripByIdNotFoundError extends Data.TaggedError(
  "GetTripByIdNotFoundError",
)<{ tripId: string }> {}

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
 *   Effect.provideService(TripGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getTripByIdUseCase(
  input: GetTripByIdInput,
): Effect.Effect<
  GetTripByIdOutput,
  DatabaseError | GetTripByIdNotFoundError,
  TripGatewayTag
> {
  return Effect.gen(function* () {
    const tripRepo = yield* TripGatewayTag;

    // Load trip
    const trip = yield* tripRepo.findById(input.tripId);

    if (!trip) {
      return yield* Effect.fail(
        new GetTripByIdNotFoundError({ tripId: input.tripId }),
      );
    }

    return toOutput(trip);
  });
}

function toOutput(trip: TripDTO): GetTripByIdOutput {
  const now = new Date();
  const isActive = trip.status === TripStatus.ACTIVE;
  const isPlanning = trip.status === TripStatus.PLANNING;
  const isCompleted = trip.status === TripStatus.COMPLETED;
  const isCancelled = trip.status === TripStatus.CANCELLED;
  const hasStarted = trip.startDate <= now;
  const hasEnded = trip.endDate <= now;
  const isOngoing = isActive && hasStarted && !hasEnded;

  // Calculate duration in days
  const msPerDay = 1000 * 60 * 60 * 24;
  const durationInDays = Math.ceil(
    (trip.endDate.getTime() - trip.startDate.getTime()) / msPerDay,
  );

  // Generate summary
  const summary = `${trip.name} (${durationInDays} days)`;

  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    backgroundImagePath: trip.imageUrl,
    status: trip.status,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    isActive,
    isPlanning,
    isCompleted,
    isCancelled,
    isOngoing,
    hasStarted,
    hasEnded,
    durationInDays,
    summary,
  };
}
