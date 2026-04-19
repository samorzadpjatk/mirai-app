import { Effect, Context } from "effect";
import {
  type Location,
  type LocationSharingRequest,
  type ILocationPort,
  type IAuthZPort,
  type UserId,
  type LocationId,
  type LocationSharingRequestId,
  LocationId as LocationIdFactory,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
  PermissionDeniedError,
} from "@mirai-app/domain";
import { AuthContextTag } from "../../../infrastructure/effect";

// Local AuthZPortTag to avoid circular dependency issues
class AuthZPortTag extends Context.Tag("AuthZ")<AuthZPortTag, IAuthZPort>() {}

/**
 * In-Memory Location Gateway
 *
 * Implements ILocationPort using in-memory Map storage.
 * Used for testing and development.
 *
 * Authorization Pattern:
 * This gateway uses the AuthContext pattern for authorization, matching
 * the Drizzle gateway implementation. All privacy-sensitive operations
 * require authentication and ownership verification.
 *
 * Privacy Protection:
 * - findByUserId: Users can only access their own location
 * - update/upsert: Users can only update their own location
 * - Sharing operations: Users can only modify their own sharing settings
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

  /**
   * Find location by user ID
   * PRIVACY-CRITICAL: Users can only access their own location
   */
  findByUserId(userId: UserId) {
    const self = this;
    const userIdStr = UserIdFactory.toString(userId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "location",
          }),
        );
      }

      // Users can only access their own location
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "location",
            resourceId: userIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      for (const location of self.locations.values()) {
        if (UserIdFactory.equals(location.userId, userId)) {
          return location;
        }
      }
      return null;
    });
  }

  /**
   * Find locations with sharing enabled
   * Protected: Requires authentication
   */
  findSharing() {
    const self = this;

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locations:sharing",
          }),
        );
      }

      return Array.from(self.locations.values()).filter(
        (location) => location.isSharingLocation,
      );
    });
  }

  /**
   * Find locations where user is in sharing list
   * Privacy-safe: Returns only locations explicitly shared with the requesting user
   */
  findByUserInSharingList(userId: UserId) {
    const self = this;
    const userIdStr = UserIdFactory.toString(userId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locations:shared",
          }),
        );
      }

      // Users can only view locations shared with them
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locations:shared",
            resourceId: userIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      const result: Location[] = [];

      for (const location of self.locations.values()) {
        const ownerIdStr = UserIdFactory.toString(location.userId);
        const sharingList = self.sharingLists.get(ownerIdStr);
        if (sharingList?.has(userIdStr)) {
          result.push(location);
        }
      }

      return result;
    });
  }

  /**
   * Create new location
   * Protected: Requires authentication and ownership
   */
  create(location: Location) {
    const self = this;
    const userIdStr = UserIdFactory.toString(location.userId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "create",
            resourceType: "location",
          }),
        );
      }

      // Users can only create locations for themselves
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "create",
            resourceType: "location",
            resourceId: userIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      self.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  /**
   * Update existing location
   * PRIVACY-CRITICAL: Users can only update their own location
   */
  update(location: Location) {
    const self = this;
    const userIdStr = UserIdFactory.toString(location.userId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "location",
            resourceId: LocationIdFactory.toString(location.id),
          }),
        );
      }

      // Users can only update their own location
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "location",
            resourceId: LocationIdFactory.toString(location.id),
            userId: authCtx.userId,
          }),
        );
      }

      self.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  /**
   * Upsert location for user
   * PRIVACY-CRITICAL: Users can only upsert their own location
   */
  upsert(location: Location) {
    const self = this;
    const userIdStr = UserIdFactory.toString(location.userId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "location",
            resourceId: LocationIdFactory.toString(location.id),
          }),
        );
      }

      // Users can only upsert their own location
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "location",
            resourceId: LocationIdFactory.toString(location.id),
            userId: authCtx.userId,
          }),
        );
      }

      self.locations.set(LocationIdFactory.toString(location.id), location);
      return location;
    });
  }

  /**
   * Delete location by ID
   * Protected: Requires authentication and ownership
   */
  delete(id: LocationId) {
    const self = this;
    const idStr = LocationIdFactory.toString(id);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "delete",
            resourceType: "location",
            resourceId: idStr,
          }),
        );
      }

      const location = self.locations.get(idStr);
      if (!location) {
        return yield* Effect.succeed(void 0);
      }

      // Users can only delete their own location
      const userIdStr = UserIdFactory.toString(location.userId);
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "delete",
            resourceType: "location",
            resourceId: idStr,
            userId: authCtx.userId,
          }),
        );
      }

      self.locations.delete(idStr);
      // Clean up sharing list for this location owner
      self.sharingLists.delete(userIdStr);

      return yield* Effect.succeed(void 0);
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

  /**
   * Find pending sharing requests for receiver
   * Protected: Users can only view their own pending requests
   */
  findPendingSharingRequestsByReceiver(receiverId: UserId) {
    const self = this;
    const receiverIdStr = UserIdFactory.toString(receiverId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharingRequests:pending",
          }),
        );
      }

      // Users can only view their own pending requests
      if (authCtx.userId !== receiverIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharingRequests:pending",
            resourceId: receiverIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      return Array.from(self.sharingRequests.values()).filter(
        (request) =>
          UserIdFactory.equals(request.receiverId, receiverId) &&
          request.status === "PENDING",
      );
    });
  }

  /**
   * Find sharing requests by sender
   * Protected: Users can only view their own sent requests
   */
  findSharingRequestsBySender(senderId: UserId) {
    const self = this;
    const senderIdStr = UserIdFactory.toString(senderId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharingRequests:sent",
          }),
        );
      }

      // Users can only view their own sent requests
      if (authCtx.userId !== senderIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharingRequests:sent",
            resourceId: senderIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      return Array.from(self.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.senderId, senderId),
      );
    });
  }

  /**
   * Find sharing requests by receiver
   * Protected: Users can only view their own received requests
   */
  findSharingRequestsByReceiver(receiverId: UserId) {
    const self = this;
    const receiverIdStr = UserIdFactory.toString(receiverId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharingRequests:received",
          }),
        );
      }

      // Users can only view their own received requests
      if (authCtx.userId !== receiverIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharingRequests:received",
            resourceId: receiverIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      return Array.from(self.sharingRequests.values()).filter((request) =>
        UserIdFactory.equals(request.receiverId, receiverId),
      );
    });
  }

  /**
   * Create sharing request
   * Protected: Users can only create requests as themselves
   */
  createSharingRequest(request: LocationSharingRequest) {
    const self = this;
    const senderIdStr = UserIdFactory.toString(request.senderId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "create",
            resourceType: "locationSharingRequest",
          }),
        );
      }

      // Users can only create requests as themselves (sender)
      if (authCtx.userId !== senderIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "create",
            resourceType: "locationSharingRequest",
            resourceId: senderIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      self.sharingRequests.set(
        LocationSharingRequestIdFactory.toString(request.id),
        request,
      );
      return request;
    });
  }

  /**
   * Update sharing request
   * Protected: Users can only update requests they are involved in
   */
  updateSharingRequest(request: LocationSharingRequest) {
    const self = this;

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "locationSharingRequest",
            resourceId: LocationSharingRequestIdFactory.toString(request.id),
          }),
        );
      }

      // Users can only update requests they are involved in
      const senderIdStr = UserIdFactory.toString(request.senderId);
      const receiverIdStr = UserIdFactory.toString(request.receiverId);
      if (authCtx.userId !== senderIdStr && authCtx.userId !== receiverIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "locationSharingRequest",
            resourceId: LocationSharingRequestIdFactory.toString(request.id),
            userId: authCtx.userId,
          }),
        );
      }

      self.sharingRequests.set(
        LocationSharingRequestIdFactory.toString(request.id),
        request,
      );
      return request;
    });
  }

  // ============================================================================
  // Sharing List Operations
  // ============================================================================

  /**
   * Connect user to sharing list
   * Protected: Users can only modify their own sharing list
   */
  connectUserToSharing(locationOwnerId: UserId, userIdToShareWith: UserId) {
    const self = this;
    const ownerIdStr = UserIdFactory.toString(locationOwnerId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerIdStr,
          }),
        );
      }

      // Users can only modify their own sharing list
      if (authCtx.userId !== ownerIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      const userIdStr = UserIdFactory.toString(userIdToShareWith);

      if (!self.sharingLists.has(ownerIdStr)) {
        self.sharingLists.set(ownerIdStr, new Set());
      }

      self.sharingLists.get(ownerIdStr)!.add(userIdStr);
    });
  }

  /**
   * Disconnect user from sharing list
   * Protected: Users can only modify their own sharing list
   */
  disconnectUserFromSharing(locationOwnerId: UserId, userIdToRemove: UserId) {
    const self = this;
    const ownerIdStr = UserIdFactory.toString(locationOwnerId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerIdStr,
          }),
        );
      }

      // Users can only modify their own sharing list
      if (authCtx.userId !== ownerIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      const userIdStr = UserIdFactory.toString(userIdToRemove);
      self.sharingLists.get(ownerIdStr)?.delete(userIdStr);
    });
  }

  /**
   * Set users to share with
   * Protected: Users can only modify their own sharing list
   */
  setUsersToShareWith(locationOwnerId: UserId, userIds: UserId[]) {
    const self = this;
    const ownerIdStr = UserIdFactory.toString(locationOwnerId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerIdStr,
          }),
        );
      }

      // Users can only modify their own sharing list
      if (authCtx.userId !== ownerIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      const userIdStrs = userIds.map((id) => UserIdFactory.toString(id));
      self.sharingLists.set(ownerIdStr, new Set(userIdStrs));
    });
  }

  /**
   * Get sharing list for user
   * Protected: Users can only view their own sharing list
   */
  getSharingListForUser(locationOwnerId: UserId) {
    const self = this;
    const ownerIdStr = UserIdFactory.toString(locationOwnerId);

    return Effect.gen(function* () {
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharing:list",
            resourceId: ownerIdStr,
          }),
        );
      }

      // Users can only view their own sharing list
      if (authCtx.userId !== ownerIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharing:list",
            resourceId: ownerIdStr,
            userId: authCtx.userId,
          }),
        );
      }

      const sharingSet = self.sharingLists.get(ownerIdStr);

      if (!sharingSet) {
        return [];
      }

      return Array.from(sharingSet).map((userIdStr) =>
        UserIdFactory.unsafeCreate(userIdStr),
      );
    });
  }
}

export const inMemoryLocationGateway = new InMemoryLocationGateway();
