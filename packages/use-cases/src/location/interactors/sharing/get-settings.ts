import { Effect, Data } from "effect";
import { LocationGatewayTag } from "../../ports/gateway";
import type { LocationDTO } from "../../dto";

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
export class GetSharingSettingsRepositoryError extends Data.TaggedError(
  "GetSharingSettingsRepositoryError",
)<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

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
 *   Effect.provideService(LocationGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getSharingSettingsUseCase(
  input: GetSharingSettingsInput,
): Effect.Effect<
  GetSharingSettingsOutput,
  GetSharingSettingsRepositoryError,
  LocationGatewayTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationGatewayTag;

    const location = yield* locationRepo.findByUserId(input.userId).pipe(
      Effect.mapError(
        (cause) =>
          new GetSharingSettingsRepositoryError({
            operation: "find location by user",
            cause,
          }),
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
      isSharingLocation: location.isSharingLocation,
      usersToShareWith: location.usersToShareWith,
    };
  });
}
