import type { Location, Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import { Effect } from "effect";
import type { LocationRepository } from "../ports/LocationRepository";

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
 * ## Effect.gen Pattern
 *
 * This use case uses constructor injection and returns Effect.Effect<Result<T,E>, never, never>:
 *
 * ```typescript
 * const useCase = new GetLocationUseCase(locationRepository);
 * const result = await Effect.runPromise(useCase.execute({ userId: "123" }));
 *
 * if (result.kind === "ok") {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export class GetLocationUseCase {
  constructor(private readonly locationRepo: LocationRepository) {}

  execute(
    input: GetLocationInput,
  ): Effect.Effect<
    Result<GetLocationOutput, LocationNotFoundError>,
    never,
    never
  > {
    return Effect.gen(this, function* () {
      const location = yield* this.locationRepo.findByUserId(input.userId);

      if (!location) {
        return err(new LocationNotFoundError());
      }

      return ok(toOutput(location));
    });
  }
}

/**
 * Legacy function-based API for backward compatibility during migration
 * @deprecated Use GetLocationUseCase class instead
 */
export function getLocationUseCase(
  input: GetLocationInput,
  locationRepo: LocationRepository,
): Effect.Effect<
  Result<GetLocationOutput, LocationNotFoundError>,
  never,
  never
> {
  const useCase = new GetLocationUseCase(locationRepo);
  return useCase.execute(input);
}
