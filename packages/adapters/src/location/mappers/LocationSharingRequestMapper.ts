import type {
  LocationSharingRequestSelect,
  LocationSharingRequestInsert,
} from "@mirai-app/frameworks/drizzle";
import {
  LocationSharingRequest,
  LocationSharingRequestId,
  UserId,
} from "@mirai-app/domain";
import type { ValidationError } from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * LocationSharingRequest Mapper
 *
 * Maps between database LocationSharingRequest records and domain entities.
 */
export class LocationSharingRequestMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbRequest: LocationSharingRequestSelect,
  ): Effect.Effect<LocationSharingRequest, ValidationError, never> {
    return LocationSharingRequest.create({
      id: LocationSharingRequestId.unsafeCreate(dbRequest.id),
      senderId: UserId.unsafeCreate(dbRequest.requesterId),
      receiverId: UserId.unsafeCreate(dbRequest.targetId),
      status: dbRequest.status,
      createdAt: dbRequest.createdAt,
      updatedAt: dbRequest.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(request: LocationSharingRequest): LocationSharingRequestInsert {
    return {
      id: LocationSharingRequestId.toString(request.id),
      requesterId: UserId.toString(request.senderId),
      targetId: UserId.toString(request.receiverId),
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(
    request: LocationSharingRequest,
  ): Omit<
    LocationSharingRequestInsert,
    "id" | "requesterId" | "targetId" | "createdAt"
  > {
    return {
      status: request.status,
      updatedAt: new Date(),
    };
  }
}

export const locationSharingRequestMapper = new LocationSharingRequestMapper();
