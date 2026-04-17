import { Effect } from "effect";
import { UserId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import type {
  FriendLocationEventDTO,
  LocationWithUserDTO,
} from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";

/**
 * Input for GetFriendsLocationsStreamUseCase
 */
export interface GetFriendsLocationsStreamInput {
  userId: string;
  connectionId?: string;
  radiusKm?: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Options for streaming friends locations
 */
export interface GetFriendsLocationsStreamOptions {
  /**
   * Called when a new location event is available
   */
  onEvent: (event: FriendLocationEventDTO) => void;

  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Called when the stream ends
   */
  onComplete?: () => void;
}

/**
 * Initial friends locations result
 */
export interface InitialFriendsLocationsResult {
  connectionId: string;
  locations: LocationWithUserDTO[];
  friendUserIds: string[];
}

/**
 * Get Friends Locations Stream Use Case
 *
 * Retrieves initial friends locations and provides the foundation
 * for streaming real-time location updates. The actual streaming
 * mechanism (WebSocket, SSE, etc.) is handled by the adapter layer.
 */
export class GetFriendsLocationsStreamUseCase {
  execute(
    input: GetFriendsLocationsStreamInput,
  ): Effect.Effect<
    InitialFriendsLocationsResult,
    ApplicationError,
    LocationPort | TripPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;
      const participantPort = yield* TripParticipantPort;

      const userId = UserId.unsafeCreate(input.userId);
      const connectionId = input.connectionId ?? crypto.randomUUID();

      // Validate radius parameters
      if (
        input.radiusKm !== undefined &&
        (input.latitude === undefined || input.longitude === undefined)
      ) {
        return yield* Effect.fail(
          new Error(
            "When providing radiusKm, both latitude and longitude are required",
          ) as ApplicationError,
        );
      }

      // Get friends locations where user is in sharing list
      const locations = yield* locationPort.findByUserInSharingList(userId);

      // Filter only locations with sharing enabled
      const sharingLocations = locations.filter((loc) => loc.isSharingLocation);

      // Calculate distances and filter by radius if provided
      const locationDTOs: LocationWithUserDTO[] = [];
      const inRadiusUserIds = new Set<string>();

      for (const location of sharingLocations) {
        const dto: LocationWithUserDTO = {
          id: location.id,
          userId: location.userId,
          timestamp: location.timestamp,
          isSharingLocation: location.isSharingLocation,
          accuracy: location.accuracy,
          altitude: location.altitude,
          altitudeAccuracy: location.altitudeAccuracy,
          heading: location.heading,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          lastInactivityNotification: location.lastInactivityNotification,
          user: null, // Will be hydrated by adapter
        };

        if (
          input.radiusKm !== undefined &&
          input.latitude !== undefined &&
          input.longitude !== undefined &&
          location.latitude !== null &&
          location.longitude !== null
        ) {
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            input.latitude,
            input.longitude,
            location.latitude,
            location.longitude,
          );

          if (distance <= input.radiusKm) {
            locationDTOs.push(dto);
            inRadiusUserIds.add(location.userId);
          }
        } else {
          locationDTOs.push(dto);
          inRadiusUserIds.add(location.userId);
        }
      }

      return {
        connectionId,
        locations: locationDTOs,
        friendUserIds: Array.from(inRadiusUserIds),
      };
    });
  }
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
