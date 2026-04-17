import { Effect } from "effect";
import {
  type Location,
  type LocationSharingRequest,
  type ILocationPort,
  type UserId,
  type LocationId,
  type LocationSharingRequestId,
  LocationId as LocationIdFactory,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
} from "@mirai-app/domain";
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

  findById(id: LocationId) {
    return Effect.sync(() => {
      const location = this.locations.get(LocationIdFactory.toString(id));
      return location ?? null;
    });
  }

  findByUserId(userId: UserId) {
    return Effect.sync(() => {
      for (const location of this.locations.values()) {
        if (UserIdFactory.equals(location.userId, userId)) {
          return location;
        }
      }
      return null;
    });
  }

  findSharing() {
    return Effect.sync(() => {
      return Array.from(this.locations.values()).filter(
        (location) => location.isSharingLocation,
      );
    });
  }

  findByUserInSharingList(userId: UserId) {
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

  create(location: Location) {
    return Effect.sync(() => {
      this.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  update(location: Location) {
    return Effect.sync(() => {
      this.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  upsert(location: Location) {
    return Effect.sync(() => {
      this.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  delete(id: LocationId) {
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

  findSharingRequestById(id: LocationSharingRequestId) {
    return Effect.sync(() => {
      const request = this.sharingRequests.get(
        LocationSharingRequestIdFactory.toString(id),
      );
      return request ?? null;
    });
  }

  findSharingRequestBySenderAndReceiver(senderId: UserId, receiverId: UserId) {
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

  findPendingSharingRequestsByReceiver(receiverId: UserId) {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter(
        (request) =>
          UserIdFactory.equals(request.receiverId, receiverId) &&
          request.status === "PENDING",
      );
    });
  }

  findSharingRequestsBySender(senderId: UserId) {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.senderId, senderId),
      );
    });
  }

  findSharingRequestsByReceiver(receiverId: UserId) {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.receiverId, receiverId),
      );
    });
  }

  createSharingRequest(request: LocationSharingRequest) {
    return Effect.sync(() => {
      this.sharingRequests.set(
        LocationSharingRequestIdFactory.toString(request.id),
        request,
      );
      return request;
    });
  }

  updateSharingRequest(request: LocationSharingRequest) {
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

  connectUserToSharing(locationOwnerId: UserId, userIdToShareWith: UserId) {
    return Effect.sync(() => {
      const ownerIdStr = UserIdFactory.toString(locationOwnerId);
      const userIdStr = UserIdFactory.toString(userIdToShareWith);

      if (!this.sharingLists.has(ownerIdStr)) {
        this.sharingLists.set(ownerIdStr, new Set());
      }

      this.sharingLists.get(ownerIdStr)!.add(userIdStr);
    });
  }

  disconnectUserFromSharing(locationOwnerId: UserId, userIdToRemove: UserId) {
    return Effect.sync(() => {
      const ownerIdStr = UserIdFactory.toString(locationOwnerId);
      const userIdStr = UserIdFactory.toString(userIdToRemove);

      this.sharingLists.get(ownerIdStr)?.delete(userIdStr);
    });
  }

  setUsersToShareWith(locationOwnerId: UserId, userIds: UserId[]) {
    return Effect.sync(() => {
      const ownerIdStr = UserIdFactory.toString(locationOwnerId);
      const userIdStrs = userIds.map((id) => UserIdFactory.toString(id));

      this.sharingLists.set(ownerIdStr, new Set(userIdStrs));
    });
  }
}

export const inMemoryLocationGateway = new InMemoryLocationGateway();
