import { Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import type { Location } from "@mirai-app/domain";

/**
 * Input for GetSharingSettings use case
 */
export interface GetSharingSettingsInput {
  userId: string;
}

/**
 * Output DTO for GetSharingSettings use case
 */
export interface GetSharingSettingsOutput {
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * Error when repository operation fails
 */
export class GetSharingSettingsRepositoryError extends Error {
  readonly _tag = "GetSharingSettingsRepositoryError";
  constructor(
    public readonly operation: string,
    public readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

/**
 * GetSharingSettings Use Case (Effect-based)
 *
 * Retrieves location sharing settings for a user.
 * Returns default settings if no location exists.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = getSharingSettingsUseCase(input).pipe(
 *   Effect.provideService(LocationRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getSharingSettingsUseCase(
  input: GetSharingSettingsInput,
): Effect.Effect<
  GetSharingSettingsOutput,
  GetSharingSettingsRepositoryError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    const location = yield* locationRepo
      .findByUserId(input.userId)
      .pipe(
        Effect.mapError(
          (cause) =>
            new GetSharingSettingsRepositoryError(
              "find location by user",
              cause,
            ),
        ),
      );

    if (!location) {
      // Return default settings
      return {
        isSharingLocation: false,
        usersToShareWith: [],
      };
    }

    return {
      isSharingLocation: location.isSharingLocation(),
      usersToShareWith: location.usersToShareWith,
    };
  });
}
