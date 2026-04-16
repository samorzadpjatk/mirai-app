import { Data, Effect } from "effect";
import { LocationGatewayTag } from "../.././ports/location/gateway";
import type { Location } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";

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
 * Error types for ShareLocation use case - uses Data.TaggedError for Effect integration
 */
export class ShareLocationNotFoundError extends Data.TaggedError(
  "ShareLocationNotFoundError",
)<{ userId: string }> {}

export class ShareLocationValidationError extends Data.TaggedError(
  "ShareLocationValidationError",
)<{ message: string }> {}

export class ShareLocationSelfShareError extends Data.TaggedError(
  "ShareLocationSelfShareError",
)<{}> {}

/**
 * ShareLocation Use Case
 *
 * Shares a user's location with another user.
 * If location doesn't exist, fails with error.
 * Adds the target user to the sharing list.
 *
 * ## Effect.gen Pattern (Native)
 *
 * This use case uses Context.Tag for dependency injection and returns native Effect.Effect<T, E, R>:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* shareLocationUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(LocationGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function shareLocationUseCase(
  input: ShareLocationInput,
): Effect.Effect<
  ShareLocationOutput,
  | DatabaseError
  | ShareLocationNotFoundError
  | ShareLocationValidationError
  | ShareLocationSelfShareError,
  LocationGatewayTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationGatewayTag;

    // Check for self-sharing
    if (input.userId === input.targetUserId) {
      return yield* Effect.fail(new ShareLocationSelfShareError({}));
    }

    // Find existing location or fail
    const location = yield* locationRepo.findByUserId(input.userId);

    if (!location) {
      return yield* Effect.fail(
        new ShareLocationNotFoundError({ userId: input.userId }),
      );
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
          new ShareLocationValidationError({
            message: validationError.message,
          }),
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
