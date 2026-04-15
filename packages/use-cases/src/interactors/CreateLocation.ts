import { Data, Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { Location } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Input for CreateLocation use case
 */
export interface CreateLocationInput {
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
 * Output DTO for CreateLocation use case
 */
export interface CreateLocationOutput {
  id: string;
  userId: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isSharingLocation: boolean;
  timestamp: Date;
  usersToShareWith: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
}

/**
 * Error types for CreateLocation use case - uses Data.TaggedError for Effect integration
 */
export class LocationAlreadyExistsError extends Data.TaggedError(
  "LocationAlreadyExistsError",
)<{ userId: string }> {}

export class LocationCreationError extends Data.TaggedError(
  "LocationCreationError",
)<{
  message: string;
}> {}

export class LocationUpdateError extends Data.TaggedError(
  "LocationUpdateError",
)<{
  message: string;
}> {}

/**
 * CreateLocation Use Case
 *
 * Creates or updates a location for a user (upsert pattern).
 * If location exists for user, updates it; otherwise creates new.
 *
 * ## Effect.gen Pattern (Native)
 *
 * This use case uses Context.Tag for dependency injection and returns native Effect.Effect<T, E, R>:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createLocationUseCase(input);
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
export function createLocationUseCase(
  input: CreateLocationInput,
): Effect.Effect<
  CreateLocationOutput,
  DatabaseError | LocationCreationError | LocationUpdateError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    // Check if location already exists for this user
    const existingLocation = yield* locationRepo.findByUserId(input.userId);

    if (existingLocation) {
      // Update existing location with new coordinates
      const updateEffect = existingLocation.updateCoordinates({
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.accuracy !== undefined && { accuracy: input.accuracy }),
        ...(input.altitude !== undefined && { altitude: input.altitude }),
        ...(input.heading !== undefined && { heading: input.heading }),
        ...(input.speed !== undefined && { speed: input.speed }),
      });

      // Run validation effect and map errors
      const updated = yield* updateEffect.pipe(
        Effect.mapError(
          (validationError) =>
            new LocationUpdateError({ message: validationError.message }),
        ),
      );

      const saved = yield* locationRepo.save(updated);
      return toOutput(saved);
    }

    // Create new location
    const locationEffect = Location.create({
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
    const location = yield* locationEffect.pipe(
      Effect.mapError(
        (validationError) =>
          new LocationCreationError({ message: validationError.message }),
      ),
    );

    // Persist location
    const saved = yield* locationRepo.create(location);
    return toOutput(saved);
  });
}

function toOutput(location: Location): CreateLocationOutput {
  return {
    id: location.id,
    userId: location.userId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    isSharingLocation: location.isSharingLocation(),
    timestamp: location.timestamp,
    usersToShareWith: location.usersToShareWith,
  };
}
