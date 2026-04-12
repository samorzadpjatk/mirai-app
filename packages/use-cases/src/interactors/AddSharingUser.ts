import { Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
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
export class CannotShareWithSelfError extends Error {
  readonly _tag = "CannotShareWithSelfError";
  constructor() {
    super("Cannot share location with yourself");
  }
}

/**
 * Error when domain validation fails
 */
export class AddSharingUserValidationError extends Error {
  readonly _tag = "AddSharingUserValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error when repository operation fails
 */
export class AddSharingUserRepositoryError extends Error {
  readonly _tag = "AddSharingUserRepositoryError";
  constructor(
    public readonly operation: string,
    public readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

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
 *   Effect.provideService(LocationRepositoryTag, repository)
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
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;
    const { Location } = yield* Effect.promise(
      () => import("@mirai-app/domain"),
    );

    // Prevent self-sharing
    if (input.ownerUserId === input.userToAddId) {
      return yield* Effect.fail(new CannotShareWithSelfError());
    }

    // Find existing location
    let location = yield* locationRepo
      .findByUserId(input.ownerUserId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new AddSharingUserRepositoryError("find location by user", cause),
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
          (error) => new AddSharingUserValidationError(error.message),
        ),
      );

      const saved = yield* locationRepo
        .create(newLocation)
        .pipe(
          Effect.mapError(
            (cause) =>
              new AddSharingUserRepositoryError("create location", cause),
          ),
        );
      return toOutput(saved);
    }

    // Add user to sharing list
    const addResult = location.addSharingUser({
      id: input.userToAddId,
      firstName: input.userFirstName,
      lastName: input.userLastName,
    });

    if (addResult.kind === "err") {
      return yield* Effect.fail(
        new AddSharingUserValidationError(addResult.error.message),
      );
    }

    // Persist changes
    const saved = yield* locationRepo
      .save(addResult.value)
      .pipe(
        Effect.mapError(
          (cause) => new AddSharingUserRepositoryError("save location", cause),
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
