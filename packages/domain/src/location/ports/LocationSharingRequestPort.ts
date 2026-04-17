import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { UserId } from "../../user/value-objects/UserId";
import type { LocationSharingRequestId } from "../value-objects/LocationId";
import type { LocationSharingRequest } from "../entities/LocationSharingRequest";

/**
 * LocationSharingRequest Port
 * Defines repository operations for location sharing requests
 */
export interface ILocationSharingRequestPort {
  findById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, never>;
  findBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, never>;
  findPendingByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;
  findBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;
  findByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;
  create(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, never>;
  update(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, never>;
  delete(id: LocationSharingRequestId): Effect.Effect<void, IPortError, never>;
}
