import { Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import type { Location } from "@mirai-app/domain";

/**
 * Input for UpdateSharingSettings use case
 */
export interface UpdateSharingSettingsInput {
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith?: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * Output DTO for UpdateSharingSettings use case
 */
export interface UpdateSharingSettingsOutput {
  id: string;
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
  timestamp: Date;
}

/**
 * Error when domain validation fails
 */
export class UpdateSharingSettingsValidationError extends Error {
  readonly _tag = "UpdateSharingSettingsValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error when repository operation fails
 */
export class UpdateSharingSettingsRepositoryError extends Error {
  readonly _tag = "UpdateSharingSettingsRepositoryError";
  constructor(
    public readonly operation: string,
    public override readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

/**
 * UpdateSharingSettings Use Case (Effect-based)
 *
 * Updates location sharing settings for a user.
 * Creates location record if it doesn't exist.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = updateSharingSettingsUseCase(input).pipe(
 *   Effect.provideService(LocationRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateSharingSettingsUseCase(
  input: UpdateSharingSettingsInput,
): Effect.Effect<
  UpdateSharingSettingsOutput,
  UpdateSharingSettingsValidationError | UpdateSharingSettingsRepositoryError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;
    const { Location } = yield* Effect.promise(
      () => import("@mirai-app/domain"),
    );

    // Find existing location
    let location = yield* locationRepo
      .findByUserId(input.userId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdateSharingSettingsRepositoryError(
              "find location by user",
              cause,
            ),
        ),
      );

    if (!location) {
      // Create new location if none exists
      const newLocation = yield* Location.create({
        userId: input.userId,
        isSharingLocation: input.isSharingLocation,
        ...(input.usersToShareWith !== undefined && {
          usersToShareWith: input.usersToShareWith,
        }),
      }).pipe(
        Effect.mapError(
          (error) => new UpdateSharingSettingsValidationError(error.message),
        ),
      );

      // Persist the new location
      const saved = yield* locationRepo
        .create(newLocation)
        .pipe(
          Effect.mapError(
            (cause) =>
              new UpdateSharingSettingsRepositoryError(
                "create location",
                cause,
              ),
          ),
        );

      return toOutput(saved);
    } else {
      // Update sharing status
      if (input.isSharingLocation) {
        location = location.startSharing();
      } else {
        location = location.stopSharing();
      }

      // Update sharing users if provided
      if (input.usersToShareWith !== undefined) {
        location = yield* location
          .updateSharingUsers(input.usersToShareWith)
          .pipe(
            Effect.mapError(
              (validationError) =>
                new UpdateSharingSettingsValidationError(
                  validationError.message,
                ),
            ),
          );
      }
    }

    // Persist changes
    const saved = yield* locationRepo
      .save(location)
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdateSharingSettingsRepositoryError("save location", cause),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(location: Location): UpdateSharingSettingsOutput {
  return {
    id: location.id,
    userId: location.userId,
    isSharingLocation: location.isSharingLocation(),
    usersToShareWith: location.usersToShareWith,
    timestamp: location.timestamp,
  };
}
