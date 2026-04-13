import { Effect } from "effect";
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
export class LocationNotFoundError extends Error {
  readonly _tag = "LocationNotFoundError";
  constructor() {
    super("Location not found");
  }
}

/**
 * Error when repository operation fails
 */
export class RemoveSharingUserRepositoryError extends Error {
  readonly _tag = "RemoveSharingUserRepositoryError";
  constructor(
    public readonly operation: string,
    public override readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

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
    const location = yield* locationRepo
      .findByUserId(input.ownerUserId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new RemoveSharingUserRepositoryError(
              "find location by user",
              cause,
            ),
        ),
      );

    if (!location) {
      return yield* Effect.fail(new LocationNotFoundError());
    }

    // Remove user from sharing list
    const updated = location.removeSharingUser(input.userToRemoveId);

    // Persist changes
    const saved = yield* locationRepo
      .save(updated)
      .pipe(
        Effect.mapError(
          (cause) =>
            new RemoveSharingUserRepositoryError("save location", cause),
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
