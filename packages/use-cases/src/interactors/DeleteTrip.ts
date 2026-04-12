import { Trip } from "@mirai-app/domain";
import { Effect } from "effect";
import { TripRepositoryTag } from "../ports/TripRepository";

/**
 * Input for DeleteTrip use case
 */
export interface DeleteTripInput {
  tripId: string;
}

/**
 * Output DTO for DeleteTrip use case
 */
export interface DeleteTripOutput {
  success: boolean;
  deletedTripId: string;
}

/**
 * Error types for DeleteTrip use case
 */
export class DeleteTripNotFoundError extends Error {
  readonly _tag = "DeleteTripNotFoundError";
  constructor() {
    super("Trip not found");
  }
}

/**
 * DeleteTrip Use Case
 *
 * Deletes a trip from the system.
 * Returns error if trip not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteTripUseCase({ tripId: "123" });
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
export function deleteTripUseCase(
  input: DeleteTripInput,
): Effect.Effect<DeleteTripOutput, DeleteTripNotFoundError, TripRepositoryTag> {
  return Effect.gen(function* () {
    const tripRepo = yield* TripRepositoryTag;

    // Check if trip exists
    const exists = yield* tripRepo.exists(input.tripId);

    if (!exists) {
      return yield* Effect.fail(new DeleteTripNotFoundError());
    }

    // Delete from repository
    yield* tripRepo.delete(input.tripId);

    return {
      success: true,
      deletedTripId: input.tripId,
    };
  });
}
