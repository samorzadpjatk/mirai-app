import { Effect } from "effect";
import {
  type LocationSharingRequest,
  ApplicationError,
  type UserId,
  type LocationSharingRequestId,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
} from "@mirai-app/domain";
import type { ILocationSharingRequestPort } from "@mirai-app/use-cases/location/ports";

/**
 * In-Memory Location Sharing Request Gateway
 *
 * Implements ILocationSharingRequestPort using in-memory Map storage.
 * Used for testing and development.
 */
export class InMemoryLocationSharingRequestGateway implements ILocationSharingRequestPort {
  private sharingRequests: Map<string, LocationSharingRequest> = new Map();

  findById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, ApplicationError, never> {
    return Effect.sync(() => {
      const request = this.sharingRequests.get(
        LocationSharingRequestIdFactory.toString(id),
      );
      return request ?? null;
    });
  }

  findBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, ApplicationError, never> {
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

  findPendingByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], ApplicationError, never> {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter(
        (request) =>
          UserIdFactory.equals(request.receiverId, receiverId) &&
          request.status === "PENDING",
      );
    });
  }

  findBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], ApplicationError, never> {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.senderId, senderId),
      );
    });
  }

  findByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], ApplicationError, never> {
    return Effect.sync(() => {
      return Array.from(this.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.receiverId, receiverId),
      );
    });
  }

  create(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, ApplicationError, never> {
    return Effect.sync(() => {
      this.sharingRequests.set(
        LocationSharingRequestIdFactory.toString(request.id),
        request,
      );
      return request;
    });
  }

  update(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, ApplicationError, never> {
    return Effect.sync(() => {
      this.sharingRequests.set(
        LocationSharingRequestIdFactory.toString(request.id),
        request,
      );
      return request;
    });
  }

  delete(
    id: LocationSharingRequestId,
  ): Effect.Effect<void, ApplicationError, never> {
    return Effect.sync(() => {
      this.sharingRequests.delete(LocationSharingRequestIdFactory.toString(id));
    });
  }

  /**
   * Clear all sharing requests - useful for test cleanup
   */
  clear(): void {
    this.sharingRequests.clear();
  }
}

export const inMemoryLocationSharingRequestGateway =
  new InMemoryLocationSharingRequestGateway();
