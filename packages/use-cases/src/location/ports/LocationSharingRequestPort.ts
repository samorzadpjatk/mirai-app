import { Context, Effect } from "effect";
import type {
  LocationSharingRequest,
  IPortError,
  UserId,
  LocationSharingRequestId,
} from "@mirai-app/domain";

/**
 * LocationSharingRequest Port - Repository interface with Context.Tag for Effect DI
 *
 * This port provides dedicated operations for location sharing requests,
 * supplementing the main LocationPort for complex sharing scenarios.
 */
export interface ILocationSharingRequestPort {
  /**
   * Find location sharing request by ID
   */
  findById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, never>;

  /**
   * Find location sharing request by sender and receiver
   */
  findBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, never>;

  /**
   * Find pending sharing requests for receiver
   */
  findPendingByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;

  /**
   * Find all sharing requests sent by user
   */
  findBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;

  /**
   * Find all sharing requests received by user
   */
  findByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;

  /**
   * Create location sharing request
   */
  create(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, never>;

  /**
   * Update location sharing request
   */
  update(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, never>;

  /**
   * Delete location sharing request
   */
  delete(id: LocationSharingRequestId): Effect.Effect<void, IPortError, never>;
}

export class LocationSharingRequestPortTag extends Context.Tag(
  "LocationSharingRequestPort",
)<LocationSharingRequestPortTag, ILocationSharingRequestPort>() {}
