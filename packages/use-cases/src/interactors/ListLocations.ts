import type { Result } from "@repo/domain";
import { ok, err, type Location } from "@repo/domain";
import type { LocationRepository } from "../ports/LocationRepository";

/**
 * Input for ListLocations use case
 */
export interface ListLocationsInput {
  viewerUserId: string;
  targetUserIds?: string[];
  radiusKm?: number;
  centerLatitude?: number;
  centerLongitude?: number;
}

/**
 * Output DTO for a location in ListLocations response
 */
export interface LocationOutput {
  id: string;
  userId: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  isSharingLocation: boolean;
  timestamp: Date;
  distanceKm?: number;
}

/**
 * Output DTO for ListLocations use case
 */
export interface ListLocationsOutput {
  locations: LocationOutput[];
  total: number;
}

/**
 * ListLocations Use Case
 *
 * Retrieves locations that a user can view.
 * - If targetUserIds provided, returns those users' locations (if viewable)
 * - If not provided, returns all locations sharing with the viewer
 * - Optionally filters by radius from center point
 */
export class ListLocationsUseCase {
  constructor(private locationRepository: LocationRepository) {}

  async execute(
    input: ListLocationsInput,
  ): Promise<Result<ListLocationsOutput, string>> {
    let locations: Location[] = [];

    if (input.targetUserIds && input.targetUserIds.length > 0) {
      // Get specific users' locations
      const allLocations = await this.locationRepository.findByUserIds(
        input.targetUserIds,
      );
      // Filter to only those the viewer can see
      locations = allLocations.filter(
        (loc) =>
          loc.canBeViewedBy(input.viewerUserId) ||
          loc.userId === input.viewerUserId,
      );
    } else {
      // Get all locations sharing with the viewer
      locations = await this.locationRepository.findSharingWithUser(
        input.viewerUserId,
      );
    }

    // Apply radius filter if provided
    if (
      input.radiusKm !== undefined &&
      input.centerLatitude !== undefined &&
      input.centerLongitude !== undefined
    ) {
      locations = locations.filter((loc) =>
        loc.isWithinRadius(
          input.centerLatitude!,
          input.centerLongitude!,
          input.radiusKm!,
        ),
      );
    }

    // Map to output DTOs
    const locationOutputs = locations.map((loc) => this.toOutput(loc, input));

    return ok({
      locations: locationOutputs,
      total: locationOutputs.length,
    });
  }

  private toOutput(
    location: Location,
    input: ListLocationsInput,
  ): LocationOutput {
    const output: LocationOutput = {
      id: location.id,
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      heading: location.heading,
      speed: location.speed,
      isSharingLocation: location.isSharingLocation(),
      timestamp: location.timestamp,
    };

    // Calculate distance if center point provided
    if (
      input.centerLatitude !== undefined &&
      input.centerLongitude !== undefined
    ) {
      const centerLoc = { ...location };
      // Create a temporary location at center for distance calculation
      // We'll use the calculateDistance function directly via toExpoFormat comparison
      const dist = location.distanceTo({
        id: "temp" as unknown as typeof location.id,
        userId: "temp",
        latitude: input.centerLatitude,
        longitude: input.centerLongitude,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        sharingLocation: false,
        timestamp: new Date(),
        lastInactivityNotification: null,
        usersToShareWith: [],
        // Stub methods
        isSharingLocation: () => false,
        hasCoordinates: () => true,
        isWithinRadius: () => false,
        distanceTo: () =>
          location.distanceTo({
            ...location,
            latitude: input.centerLatitude!,
            longitude: input.centerLongitude!,
          } as Location),
      } as Location);

      if (dist !== null) {
        output.distanceKm = dist;
      }
    }

    return output;
  }
}
