import type { Result } from "@mirai-app/domain";
import { ok, err, type Location } from "@mirai-app/domain";
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
 * GetLocation Use Case
 *
 * Retrieves a location by user ID.
 * Returns error if location not found.
 */
export class GetLocationUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: GetLocationInput,
  ): Promise<Result<GetLocationOutput, string>> {
    const location = await this.locationRepository.findByUserId(input.userId);

    if (!location) {
      return err("Location not found");
    }

    return ok(this.toOutput(location));
  }

  private toOutput(location: Location): GetLocationOutput {
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
}
