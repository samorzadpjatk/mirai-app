import type { Result } from "@mirai-app/domain";
import { ok, err, type Location } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";

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
 * UpdateLocation Use Case
 *
 * Updates an existing location.
 * Creates new location if none exists for the user.
 * Returns error if validation fails.
 */
export class UpdateLocationUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: UpdateLocationInput,
  ): Promise<Result<UpdateLocationOutput, string>> {
    // Find existing location
    let location = await this.locationRepository.findByUserId(input.userId);

    if (!location) {
      // Create new location if none exists
      const { Location } = await import("@mirai-app/domain");
      const createResult = Location.create({
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

      if (createResult.kind === "err") {
        return err(createResult.error);
      }

      const saved = await this.locationRepository.create(createResult.value);
      return ok(this.toOutput(saved));
    }

    // Apply updates
    let updatedLocation: Location = location;

    // Update coordinates if provided
    if (
      input.latitude !== undefined ||
      input.longitude !== undefined ||
      input.accuracy !== undefined ||
      input.altitude !== undefined ||
      input.heading !== undefined ||
      input.speed !== undefined
    ) {
      const coordResult = updatedLocation.updateCoordinates({
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.accuracy !== undefined && { accuracy: input.accuracy }),
        ...(input.altitude !== undefined && { altitude: input.altitude }),
        ...(input.heading !== undefined && { heading: input.heading }),
        ...(input.speed !== undefined && { speed: input.speed }),
      });

      if (coordResult.kind === "err") {
        return err(coordResult.error);
      }

      updatedLocation = coordResult.value;
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
    const saved = await this.locationRepository.save(updatedLocation);

    return ok(this.toOutput(saved));
  }

  private toOutput(location: Location): UpdateLocationOutput {
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
