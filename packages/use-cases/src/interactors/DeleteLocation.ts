import { Data, Effect } from "effect";
import type { LocationId } from "@mirai-app/domain";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Input for DeleteLocation use case
 */
export interface DeleteLocationInput {
  locationId: LocationId;
}

/**
 * Output DTO for DeleteLocation use case
 */
export interface DeleteLocationOutput {
  success: boolean;
  deletedLocationId: string;
}

/**
 * Error types for DeleteLocation use case - uses Data.TaggedError for Effect integration
 */
export class DeleteLocationNotFoundError extends Data.TaggedError(
  "DeleteLocationNotFoundError",
)<{ locationId: string }> {}

export class DeleteLocationError extends Data.TaggedError(
  "DeleteLocationError",
)<{
  message: string;
}> {}

/**
 * DeleteLocation Use Case
 *
 * Deletes a location by ID.
 * Fails with DeleteLocationNotFoundError if location not found.
 *
 * ## Effect.gen Pattern (Native)
 *
 * This use case uses Context.Tag for dependency injection and returns native Effect.Effect<T, E, R>:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteLocationUseCase({ locationId: "loc-123" });
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(LocationRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function deleteLocationUseCase(
  input: DeleteLocationInput,
): Effect.Effect<
  DeleteLocationOutput,
  DatabaseError | DeleteLocationNotFoundError | DeleteLocationError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    // Verify location exists before deleting
    const location = yield* locationRepo.findById(input.locationId);

    if (!location) {
      return yield* Effect.fail(
        new DeleteLocationNotFoundError({ locationId: input.locationId }),
      );
    }

    // Delete the location
    yield* locationRepo.delete(input.locationId);

    return {
      success: true,
      deletedLocationId: input.locationId as string,
    };
  });
}
