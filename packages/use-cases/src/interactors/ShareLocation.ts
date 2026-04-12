import { Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import type { Location } from "@mirai-app/domain";

/**
 * Input for ShareLocation use case
 */
export interface ShareLocationInput {
  userId: string;
  targetUserId: string;
  targetUserFirstName: string | null;
  targetUserLastName: string | null;
}

/**
 * Output DTO for ShareLocation use case
 */
export interface ShareLocationOutput {
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
 * Error types for ShareLocation use case
 */
export class ShareLocationNotFoundError extends Error {
  readonly _tag = "ShareLocationNotFoundError";
  constructor() {
    super("Location not found for user");
  }
}

export class ShareLocationValidationError extends Error {
  readonly _tag = "ShareLocationValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class ShareLocationSelfShareError extends Error {
  readonly _tag = "ShareLocationSelfShareError";
  constructor() {
    super("Cannot share location with yourself");
  }
}

/**
 * ShareLocation Use Case
 *
 * Shares a user's location with another user.
 * If location doesn't exist, fails with error.
 * Adds the target user to the sharing list.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* shareLocationUseCase(input);
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
export function shareLocationUseCase(
  input: ShareLocationInput,
): Effect.Effect<
  ShareLocationOutput,
  | ShareLocationNotFoundError
  | ShareLocationValidationError
  | ShareLocationSelfShareError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    // Check for self-sharing
    if (input.userId === input.targetUserId) {
      return yield* Effect.fail(new ShareLocationSelfShareError());
    }

    // Find existing location or fail
    const location = yield* locationRepo.findByUserId(input.userId);

    if (!location) {
      return yield* Effect.fail(new ShareLocationNotFoundError());
    }

    // Add user to sharing list using Effect
    const addUserEffect = location.addSharingUser({
      id: input.targetUserId,
      firstName: input.targetUserFirstName,
      lastName: input.targetUserLastName,
    });

    let updatedLocation = yield* addUserEffect.pipe(
      Effect.mapError(
        (validationError) =>
          new ShareLocationValidationError(validationError.message),
      ),
    );

    // Ensure sharing is enabled
    if (!updatedLocation.isSharingLocation()) {
      updatedLocation = updatedLocation.startSharing();
    }

    // Persist changes
    const saved = yield* locationRepo.save(updatedLocation);

    return toOutput(saved);
  });
}

function toOutput(location: Location): ShareLocationOutput {
  return {
    id: location.id,
    userId: location.userId,
    isSharingLocation: location.isSharingLocation(),
    usersToShareWith: location.usersToShareWith,
  };
}
