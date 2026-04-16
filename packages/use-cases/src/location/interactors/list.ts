import type { Location } from "@mirai-app/domain";
import { Effect } from "effect";
import { LocationGatewayTag } from "../ports/gateway";
import { calculateDistance } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";

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
 * Helper function to convert Location to output DTO
 */
function toOutput(
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
    input.centerLongitude !== undefined &&
    location.latitude !== null &&
    location.longitude !== null
  ) {
    const dist = calculateDistance(
      location.latitude,
      location.longitude,
      input.centerLatitude,
      input.centerLongitude,
    );

    if (dist !== null) {
      output.distanceKm = dist;
    }
  }

  return output;
}

/**
 * ListLocations Use Case
 *
 * Retrieves locations that a user can view.
 * - If targetUserIds provided, returns those users' locations (if viewable)
 * - If not provided, returns all locations sharing with the viewer
 * - Optionally filters by radius from center point
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = listLocationsUseCase(input).pipe(
 *   Effect.provideService(LocationGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function listLocationsUseCase(
  input: ListLocationsInput,
): Effect.Effect<ListLocationsOutput, DatabaseError, LocationGatewayTag> {
  return Effect.gen(function* () {
    const repo = yield* LocationGatewayTag;

    let locations: Location[] = [];

    if (input.targetUserIds && input.targetUserIds.length > 0) {
      // Get specific users' locations
      const allLocations = yield* repo.findByUserIds(input.targetUserIds);
      // Filter to only those the viewer can see
      locations = allLocations.filter(
        (loc) =>
          loc.canBeViewedBy(input.viewerUserId) ||
          loc.userId === input.viewerUserId,
      );
    } else {
      // Get all locations sharing with the viewer
      locations = yield* repo.findSharingWithUser(input.viewerUserId);
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
    const locationOutputs = locations.map((loc) => toOutput(loc, input));

    return {
      locations: locationOutputs,
      total: locationOutputs.length,
    };
  });
}
