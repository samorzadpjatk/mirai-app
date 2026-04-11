import type { Result } from "@mirai-app/domain";
import { ok, err, Location } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";

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
 * CreateLocation Use Case
 *
 * Creates or updates a location for a user (upsert pattern).
 * If location exists for user, updates it; otherwise creates new.
 */
export class CreateLocationUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: CreateLocationInput,
  ): Promise<Result<CreateLocationOutput, string>> {
    // Check if location already exists for this user
    const existingLocation = await this.locationRepository.findByUserId(
      input.userId,
    );

    if (existingLocation) {
      // Update existing location with new coordinates
      const updateResult = existingLocation.updateCoordinates({
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.accuracy !== undefined && { accuracy: input.accuracy }),
        ...(input.altitude !== undefined && { altitude: input.altitude }),
        ...(input.heading !== undefined && { heading: input.heading }),
        ...(input.speed !== undefined && { speed: input.speed }),
      });

      if (updateResult.kind === "err") {
        return err(updateResult.error.message);
      }

      const saved = await this.locationRepository.save(updateResult.value);
      return ok(this.toOutput(saved));
    }

    // Create new location
    const locationResult = Location.create({
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

    if (locationResult.kind === "err") {
      return err(locationResult.error.message);
    }

    // Persist location
    const saved = await this.locationRepository.create(locationResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(location: Location): CreateLocationOutput {
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
}
