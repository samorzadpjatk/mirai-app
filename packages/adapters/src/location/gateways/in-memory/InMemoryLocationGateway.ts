import { Effect } from "effect";
import {
  type Location,
  type LocationSharingRequest,
  DatabaseError,
  type UserId,
  type LocationId,
  type LocationSharingRequestId,
  LocationId as LocationIdFactory,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
} from "@mirai-app/domain";
import type { ILocationPort } from "@mirai-app/use-cases";
import { locationMapper } from "../../mappers/LocationMapper";
import { locationSharingRequestMapper } from "../../mappers/LocationSharingRequestMapper";

/**
 * In-Memory Location Gateway
 *
 * Implements ILocationPort using in-memory Map storage.
 * Used for testing and development.
 */
export class InMemoryLocationGateway implements ILocationPort {
  private locations: Map<string, Location> = new Map();
  private sharingRequests: Map<string, LocationSharingRequest> = new Map();
  // Maps location owner userId -> Set of userIds they share with
  private sharingLists: Map<string, Set<string>> = new Map();

  // ============================================================================
  // Location Operations
  // ============================================================================

  findById(
    id: LocationId,
  ): Effect.Effect<Location | null, DatabaseError, never> {
    return Effect.sync(() => {
      const location = this.locations.get(LocationIdFactory.toString(id));
      return location ?? null;
    });
  }

  findByUserId(
    userId: UserId,
  ): Effect.Effect<Location | null, DatabaseError, never> {
    return Effect.sync(() => {
      for (const location of this.locations.values()) {
        if (UserIdFactory.equals(location.userId, userId)) {
          return location;
        }
      }
      return null;
    });
  }

  findSharing(): Effect.Effect<Location[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.locations.values()).filter(
        (location) => location.isSharingLocation,
      );
    });
  }

  findByUserInSharingList(
    userId: UserId,
  ): Effect.Effect<Location[], DatabaseError, never> {
    return Effect.sync(() => {
      const userIdStr = UserIdFactory.toString(userId);
      const result: Location[] = [];

      for (const location of this.locations.values()) {
        const ownerIdStr = UserIdFactory.toString(location.userId);
        const sharingList = this.sharingLists.get(ownerIdStr);
        if (sharingList?.has(userIdStr)) {
          result.push(location);
        }
      }

      return result;
    });
  }

  create(location: Location): Effect.Effect<Location, DatabaseError, never> {
    return Effect.sync(() => {
      this.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  update(location: Location): Effect.Effect<Location, DatabaseError, never> {
    return Effect.sync(() => {
      this.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  upsert(location: Location): Effect.Effect<Location, DatabaseError, never> {
    return Effect.sync(() => {
      this.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  delete(id: LocationId): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.locations.delete(LocationIdFactory.toString(id));
      // Clean up sharing list for this location owner
      const location = Array.from(this.locations.values()).find((loc) =>
        LocationIdFactory.equals(loc.id, id),
      );
      if (location) {
        this.sharingLists.delete(UserIdFactory.toString(location.userId));
      }
    });
  }

  // ============================================================================
  // Location Sharing Request Operations
  // ============================================================================

  findSharingRequestById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never> {
    return Effect.sync(() => {
      const request = this.sharingRequests.get(
        LocationSharingRequestIdFactory.toString(id),
      );
      return request ?? null;
    });
  }

  findSharingRequestBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never> {
    return Effect.sync(() => {
      for (const request of this.sharingRequests.values()) {
        if (
          UserIdFactory.equals(request.senderId, senderId) &&
          UserIdFactory.equals(request.receiverId, receiverId)
        ) {
          return request;
        }
      }
      return null;
    });
  }

  findPendingSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter(
        (request) =>
          UserIdFactory.equals(request.receiverId, receiverId) &&
          request.status === "PENDING",
      );
    });
  }

  findSharingRequestsBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.senderId, senderId),
      );
    });
  }

  findSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.receiverId, receiverId),
      );
    });
  }

  createSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never> {
    return Effect.sync(() => {
      this.sharingRequests.set(
        LocationSharingRequestIdFactory.toString(request.id),
        request,
      );
      return request;
    });
  }

  updateSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never> {
    return Effect.sync(() => {
      this.sharingRequests.set(
        LocationSharingRequestIdFactory.toString(request.id),
        request,
      );
      return request;
    });
  }

  // ============================================================================
  // Sharing List Operations
  // ============================================================================

  connectUserToSharing(
    locationOwnerId: UserId,
    userIdToShareWith: UserId,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const ownerIdStr = UserIdFactory.toString(locationOwnerId);
      const userIdStr = UserIdFactory.toString(userIdToShareWith);

      if (!this.sharingLists.has(ownerIdStr)) {
        this.sharingLists.set(ownerIdStr, new Set());
      }

      this.sharingLists.get(ownerIdStr)!.add(userIdStr);
    });
  }

  disconnectUserFromSharing(
    locationOwnerId: UserId,
    userIdToRemove: UserId,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const ownerIdStr = UserIdFactory.toString(locationOwnerId);
      const userIdStr = UserIdFactory.toString(userIdToRemove);

      this.sharingLists.get(ownerIdStr)?.delete(userIdStr);
    });
  }

  setUsersToShareWith(
    locationOwnerId: UserId,
    userIds: UserId[],
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const ownerIdStr = UserIdFactory.toString(locationOwnerId);
      const userIdStrs = userIds.map((id) => UserIdFactory.toString(id));

      this.sharingLists.set(ownerIdStr, new Set(userIdStrs));
    });
  }
}

export const inMemoryLocationGateway = new InMemoryLocationGateway();
