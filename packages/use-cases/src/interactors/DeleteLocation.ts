import { Effect } from "effect";
import {
  LocationRepositoryTag,
  type LocationId,
} from "../ports/LocationRepository";

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
 * Error types for DeleteLocation use case
 */
export class DeleteLocationNotFoundError extends Error {
  readonly _tag = "DeleteLocationNotFoundError";
  constructor() {
    super("Location not found");
  }
}

export class DeleteLocationError extends Error {
  readonly _tag = "DeleteLocationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * DeleteLocation Use Case
 *
 * Deletes a location by ID.
 * Returns error if location not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
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
  DeleteLocationNotFoundError | DeleteLocationError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    // Verify location exists before deleting
    const location = yield* locationRepo.findById(input.locationId);

    if (!location) {
      return yield* Effect.fail(new DeleteLocationNotFoundError());
    }

    // Delete the location
    yield* locationRepo.delete(input.locationId);

    return {
      success: true,
      deletedLocationId: input.locationId as string,
    };
  });
}
