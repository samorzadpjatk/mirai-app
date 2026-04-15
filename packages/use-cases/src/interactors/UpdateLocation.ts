import { Data, Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { Location } from "@mirai-app/domain";
import type { Location as LocationType } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Input for UpdateLocation use case
 */
export interface UpdateLocationInput {
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  isSharingLocation?: boolean;
}

/**
 * Output DTO for UpdateLocation use case
 */
export interface UpdateLocationOutput {
  id: string;
  userId: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  isSharingLocation: boolean;
  timestamp: Date;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * Error types for UpdateLocation use case - uses Data.TaggedError for Effect integration
 */
export class LocationNotFoundError extends Data.TaggedError(
  "LocationNotFoundError",
)<{ userId: string }> {}

export class LocationUpdateValidationError extends Data.TaggedError(
  "LocationUpdateValidationError",
)<{ message: string }> {}

export class LocationCreateError extends Data.TaggedError(
  "LocationCreateError",
)<{
  message: string;
}> {}

/**
 * UpdateLocation Use Case
 *
 * Updates an existing location.
 * Creates new location if none exists for the user.
 * Returns error if validation fails.
 *
 * ## Effect.gen Pattern (Native)
 *
 * This use case uses Context.Tag for dependency injection and returns native Effect.Effect<T, E, R>:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateLocationUseCase(input);
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
export function updateLocationUseCase(
  input: UpdateLocationInput,
): Effect.Effect<
  UpdateLocationOutput,
  DatabaseError | LocationUpdateValidationError | LocationCreateError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    // Find existing location
    const location = yield* locationRepo.findByUserId(input.userId);

    if (!location) {
      // Create new location if none exists
      const createEffect = Location.create({
        userId: input.userId,
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.accuracy !== undefined && { accuracy: input.accuracy }),
        ...(input.altitude !== undefined && { altitude: input.altitude }),
        ...(input.altitudeAccuracy !== undefined && {
          altitudeAccuracy: input.altitudeAccuracy,
        }),
        ...(input.heading !== undefined && { heading: input.heading }),
        ...(input.speed !== undefined && { speed: input.speed }),
        ...(input.isSharingLocation !== undefined && {
          isSharingLocation: input.isSharingLocation,
        }),
      });

      // Run validation effect and map errors
      const newLocation = yield* createEffect.pipe(
        Effect.mapError(
          (validationError) =>
            new LocationCreateError({ message: validationError.message }),
        ),
      );

      const saved = yield* locationRepo.create(newLocation);
      return toOutput(saved);
    }

    // Apply updates
    let updatedLocation: LocationType = location;

    // Update coordinates if provided
    if (
      input.latitude !== undefined ||
      input.longitude !== undefined ||
      input.accuracy !== undefined ||
      input.altitude !== undefined ||
      input.heading !== undefined ||
      input.speed !== undefined
    ) {
      const coordEffect = updatedLocation.updateCoordinates({
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.accuracy !== undefined && { accuracy: input.accuracy }),
        ...(input.altitude !== undefined && { altitude: input.altitude }),
        ...(input.heading !== undefined && { heading: input.heading }),
        ...(input.speed !== undefined && { speed: input.speed }),
      });

      // Run validation effect and map errors
      updatedLocation = yield* coordEffect.pipe(
        Effect.mapError(
          (validationError) =>
            new LocationUpdateValidationError({
              message: validationError.message,
            }),
        ),
      );
    }

    // Update sharing status if provided
    if (input.isSharingLocation !== undefined) {
      if (input.isSharingLocation) {
        updatedLocation = updatedLocation.startSharing();
      } else {
        updatedLocation = updatedLocation.stopSharing();
      }
    }

    // Persist changes
    const saved = yield* locationRepo.save(updatedLocation);

    return toOutput(saved);
  });
}

function toOutput(location: LocationType): UpdateLocationOutput {
  return {
    id: location.id,
    userId: location.userId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    altitude: location.altitude,
    altitudeAccuracy: location.altitudeAccuracy,
    heading: location.heading,
    speed: location.speed,
    isSharingLocation: location.isSharingLocation(),
    timestamp: location.timestamp,
    usersToShareWith: location.usersToShareWith,
  };
}
