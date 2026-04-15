import type { Location } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Input for GetLocation use case
 */
export interface GetLocationInput {
  userId: string;
}

/**
 * Output DTO for GetLocation use case
 */
export interface GetLocationOutput {
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
 * Error types for GetLocation use case - uses Data.TaggedError for Effect integration
 */
export class LocationNotFoundError extends Data.TaggedError(
  "LocationNotFoundError",
)<{ userId: string }> {}

/**
 * Helper function to convert Location to output DTO
 */
function toOutput(location: Location): GetLocationOutput {
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

/**
 * GetLocation Use Case
 *
 * Retrieves a location by user ID.
 * Fails with LocationNotFoundError if location not found.
 *
 * ## Effect.gen Pattern (Native)
 *
 * This use case uses Context.Tag for dependency injection and returns native Effect.Effect<T, E, R>:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getLocationUseCase({ userId: "123" });
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
export function getLocationUseCase(
  input: GetLocationInput,
): Effect.Effect<
  GetLocationOutput,
  DatabaseError | LocationNotFoundError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationRepositoryTag;

    const location = yield* locationRepo.findByUserId(input.userId);

    if (!location) {
      return yield* Effect.fail(
        new LocationNotFoundError({ userId: input.userId }),
      );
    }

    return toOutput(location);
  });
}
