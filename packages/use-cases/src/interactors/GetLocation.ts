import type { Location } from "@mirai-app/domain";
import { Effect } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";

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
 * Error types for GetLocation use case
 */
export class LocationNotFoundError extends Error {
  readonly _tag = "LocationNotFoundError";
  constructor() {
    super("Location not found");
  }
}

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
 * Returns error if location not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getLocationUseCase(input).pipe(
 *   Effect.provideService(LocationRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getLocationUseCase(
  input: GetLocationInput,
): Effect.Effect<
  GetLocationOutput,
  LocationNotFoundError,
  LocationRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* LocationRepositoryTag;

    const location = yield* repo.findByUserId(input.userId);

    if (!location) {
      return yield* Effect.fail(new LocationNotFoundError());
    }

    return toOutput(location);
  });
}
