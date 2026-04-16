import { Effect, Data } from "effect";
import { LocationGatewayTag } from "../../ports/gateway";
import type { LocationDTO, SharingUserInfo } from "../../dto";

/**
 * Input for UpdateSharingSettings use case
 */
export interface UpdateSharingSettingsInput {
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith?: SharingUserInfo[];
}

/**
 * Output DTO for UpdateSharingSettings use case
 */
export interface UpdateSharingSettingsOutput {
  id: string;
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith: SharingUserInfo[];
  timestamp: Date;
}

/**
 * Error when domain validation fails
 */
export class UpdateSharingSettingsValidationError extends Data.TaggedError(
  "UpdateSharingSettingsValidationError",
)<{
  readonly message: string;
}> {}

/**
 * Error when repository operation fails
 */
export class UpdateSharingSettingsRepositoryError extends Data.TaggedError(
  "UpdateSharingSettingsRepositoryError",
)<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

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
 *   Effect.provideService(LocationGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateSharingSettingsUseCase(
  input: UpdateSharingSettingsInput,
): Effect.Effect<
  UpdateSharingSettingsOutput,
  UpdateSharingSettingsValidationError | UpdateSharingSettingsRepositoryError,
  LocationGatewayTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationGatewayTag;

    // Find existing location
    let location = yield* locationRepo.findByUserId(input.userId).pipe(
      Effect.mapError(
        (cause) =>
          new UpdateSharingSettingsRepositoryError({
            operation: "find location by user",
            cause,
          }),
      ),
    );

    const now = new Date();

    if (!location) {
      // Create new location if none exists
      const newLocation: LocationDTO = {
        id: crypto.randomUUID(),
        userId: input.userId,
        latitude: 0,
        longitude: 0,
        accuracy: null,
        altitude: null,
        speed: null,
        heading: null,
        recordedAt: now,
        createdAt: now,
        isSharingLocation: input.isSharingLocation,
        usersToShareWith: input.usersToShareWith ?? [],
      };

      // Persist the new location
      const saved = yield* locationRepo.create(newLocation).pipe(
        Effect.mapError(
          (cause) =>
            new UpdateSharingSettingsRepositoryError({
              operation: "create location",
              cause,
            }),
        ),
      );

      return toOutput(saved);
    }

    // Update sharing settings
    const updatedLocation: LocationDTO = {
      ...location,
      isSharingLocation: input.isSharingLocation,
      ...(input.usersToShareWith !== undefined && {
        usersToShareWith: input.usersToShareWith,
      }),
    };

    // Persist changes
    const saved = yield* locationRepo.save(updatedLocation).pipe(
      Effect.mapError(
        (cause) =>
          new UpdateSharingSettingsRepositoryError({
            operation: "save location",
            cause,
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(location: LocationDTO): UpdateSharingSettingsOutput {
  return {
    id: location.id,
    userId: location.userId,
    isSharingLocation: location.isSharingLocation,
    usersToShareWith: location.usersToShareWith,
    timestamp: location.recordedAt,
  };
}
