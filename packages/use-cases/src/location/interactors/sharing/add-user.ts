import { Effect, Data } from "effect";
import { LocationGatewayTag } from "../.././ports/location/gateway";
import type { Location } from "@mirai-app/domain";

/**
 * Input for AddSharingUser use case
 */
export interface AddSharingUserInput {
  ownerUserId: string;
  userToAddId: string;
  userFirstName: string | null;
  userLastName: string | null;
}

/**
 * Output DTO for AddSharingUser use case
 */
export interface AddSharingUserOutput {
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
 * Error when trying to add self
 */
export class CannotShareWithSelfError extends Data.TaggedError(
  "CannotShareWithSelfError",
)<{}> {}

/**
 * Error when domain validation fails
 */
export class AddSharingUserValidationError extends Data.TaggedError(
  "AddSharingUserValidationError",
)<{
  readonly message: string;
}> {}

/**
 * Error when repository operation fails
 */
export class AddSharingUserRepositoryError extends Data.TaggedError(
  "AddSharingUserRepositoryError",
)<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

/**
 * AddSharingUser Use Case (Effect-based)
 *
 * Adds a user to the location sharing list.
 * Creates location record if it doesn't exist.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = addSharingUserUseCase(input).pipe(
 *   Effect.provideService(LocationGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function addSharingUserUseCase(
  input: AddSharingUserInput,
): Effect.Effect<
  AddSharingUserOutput,
  | CannotShareWithSelfError
  | AddSharingUserValidationError
  | AddSharingUserRepositoryError,
  LocationGatewayTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationGatewayTag;
    const { Location } = yield* Effect.promise(
      () => import("@mirai-app/domain"),
    );

    // Prevent self-sharing
    if (input.ownerUserId === input.userToAddId) {
      return yield* Effect.fail(new CannotShareWithSelfError({}));
    }

    // Find existing location
    let location = yield* locationRepo
      .findByUserId(input.ownerUserId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new AddSharingUserRepositoryError({
              operation: "find location by user",
              cause,
            }),
        ),
      );

    if (!location) {
      // Create new location with sharing enabled
      const newLocation = yield* Location.create({
        userId: input.ownerUserId,
        isSharingLocation: true,
        usersToShareWith: [
          {
            id: input.userToAddId,
            firstName: input.userFirstName,
            lastName: input.userLastName,
          },
        ],
      }).pipe(
        Effect.mapError(
          (error) =>
            new AddSharingUserValidationError({ message: error.message }),
        ),
      );

      const saved = yield* locationRepo
        .create(newLocation)
        .pipe(
          Effect.mapError(
            (cause) =>
              new AddSharingUserRepositoryError({
                operation: "create location",
                cause,
              }),
          ),
        );
      return toOutput(saved);
    }

    // Add user to sharing list
    const updatedLocation = yield* location
      .addSharingUser({
        id: input.userToAddId,
        firstName: input.userFirstName,
        lastName: input.userLastName,
      })
      .pipe(
        Effect.mapError(
          (validationError) =>
            new AddSharingUserValidationError({
              message: validationError.message,
            }),
        ),
      );

    // Persist changes
    const saved = yield* locationRepo
      .save(updatedLocation)
      .pipe(
        Effect.mapError(
          (cause) =>
            new AddSharingUserRepositoryError({
              operation: "save location",
              cause,
            }),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(location: Location): AddSharingUserOutput {
  return {
    id: location.id,
    userId: location.userId,
    isSharingLocation: location.isSharingLocation(),
    usersToShareWith: location.usersToShareWith,
  };
}
