import { Effect, Data } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import type { Location } from "@mirai-app/domain";

/**
 * Input for RemoveSharingUser use case
 */
export interface RemoveSharingUserInput {
  ownerUserId: string;
  userToRemoveId: string;
}

/**
 * Output DTO for RemoveSharingUser use case
 */
export interface RemoveSharingUserOutput {
  id: string;
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * Error when location is not found
 */
export class LocationNotFoundError extends Data.TaggedError(
  "LocationNotFoundError",
)<{}> {}

/**
 * Error when repository operation fails
 */
export class RemoveSharingUserRepositoryError extends Data.TaggedError(
  "RemoveSharingUserRepositoryError",
)<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

/**
 * RemoveSharingUser Use Case (Effect-based)
 *
 * Removes a user from the location sharing list.
 * Returns error if location not found.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = removeSharingUserUseCase(input).pipe(
 *   Effect.provideService(LocationRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function removeSharingUserUseCase(
  input: RemoveSharingUserInput,
): Effect.Effect<
  RemoveSharingUserOutput,
  LocationNotFoundError | RemoveSharingUserRepositoryError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    // Find existing location
    const location = yield* locationRepo.findByUserId(input.ownerUserId).pipe(
      Effect.mapError(
        (cause) =>
          new RemoveSharingUserRepositoryError({
            operation: "find location by user",
            cause,
          }),
      ),
    );

    if (!location) {
      return yield* Effect.fail(new LocationNotFoundError({}));
    }

    // Remove user from sharing list
    const updated = location.removeSharingUser(input.userToRemoveId);

    // Persist changes
    const saved = yield* locationRepo
      .save(updated)
      .pipe(
        Effect.mapError(
          (cause) =>
            new RemoveSharingUserRepositoryError({
              operation: "save location",
              cause,
            }),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(location: Location): RemoveSharingUserOutput {
  return {
    id: location.id,
    userId: location.userId,
    isSharingLocation: location.isSharingLocation(),
    usersToShareWith: location.usersToShareWith,
  };
}
