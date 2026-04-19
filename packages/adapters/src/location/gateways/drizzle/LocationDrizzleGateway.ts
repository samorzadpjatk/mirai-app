import { Effect, Context } from "effect";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  locations,
  locationSharingRequests,
  locationUsersShareWith,
  type DrizzleDb,
} from "../../../infrastructure/drizzle";
import {
  type Location,
  type LocationSharingRequest,
  DatabaseError,
  EntityNotFoundError,
  PermissionDeniedError,
  type UserId,
  type LocationId,
  type LocationSharingRequestId,
  LocationId as LocationIdFactory,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
} from "@mirai-app/domain";
import type { ILocationPort } from "@mirai-app/use-cases/location/ports";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { locationMapper } from "../../mappers/LocationMapper";
import { locationSharingRequestMapper } from "../../mappers/LocationSharingRequestMapper";

/**
 * Location Drizzle Gateway
 *
 * Implements ILocationPort using Drizzle ORM.
 * Handles both Location and LocationSharingRequest operations.
 *
 * Authorization Pattern (CRITICAL - Privacy-Sensitive Data):
 * This gateway uses the AuthContext pattern for authorization. Protected methods
 * access authentication context via `yield* AuthContextTag` and perform authorization
 * checks via `yield* AuthZPortTag.verifyAccess()` before executing database operations.
 *
 * Privacy Protection:
 * - getMyLocation (findByUserId): Users can only access their own location
 * - updateLocation (update/upsert): Users can only update their own location
 * - getFriendsLocations (findByUserInSharingList): Returns only locations shared with the user
 * - All location data access requires authentication
 *
 * This approach provides:
 * - Clean separation between authentication and authorization
 * - Type-safe dependency injection through Effect context
 * - Strong privacy protection for sensitive location data
 */
export class LocationDrizzleGateway
  extends BaseDrizzleGateway
  implements ILocationPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  // ============================================================================
  // Location Operations
  // ============================================================================

  /**
   * Find location by ID
   * Protected: Requires authentication
   */
  findById(id: LocationId) {
    const self = this;
    const idStr = LocationIdFactory.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext to check authentication status
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "location",
            resourceId: idStr,
          }),
        );
      }

      // Fetch location from database
      const dbLocation = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.locations.findFirst({
            where: eq(locations.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findById",
            id: idStr,
            cause: error,
          }),
      });

      if (!dbLocation) {
        return null;
      }

      // Users can only access their own location or locations shared with them
      if (authCtx.userId !== dbLocation.userId) {
        // Check if location is shared with this user
        const isShared = yield* self.isLocationSharedWithUser(
          dbLocation.userId,
          authCtx.userId,
        );

        if (!isShared) {
          return yield* Effect.fail(
            new PermissionDeniedError({
              requiredPermission: "read",
              resourceType: "location",
            resourceId: idStr,
              userId: authCtx.userId,
            }),
          );
        }
      }

      return yield* locationMapper.toDomain(dbLocation);
    });
  }

  /**
   * Find location by user ID
   * PRIVACY-CRITICAL: Users can only access their own location
   * Uses ownership verification to prevent unauthorized access to other users' locations
   */
  findByUserId(userId: UserId) {
    const self = this;
    const userIdStr = UserIdFactory.toString(userId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication and authorization
      const authCtx = yield* AuthContextTag;

      // Authentication required for location access
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "location",
          }),
        );
      }

      // Users can only access their own location
      // This is a PRIVACY CRITICAL check - never bypass
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

      // Fetch location from database
      const dbLocation = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.locations.findFirst({
            where: eq(locations.userId, userIdStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByUserId",
            id: userIdStr,
            cause: error,
          }),
      });

      if (!dbLocation) {
        return null;
      }

      return yield* locationMapper.toDomain(dbLocation);
    });
  }

  /**
   * Find locations with sharing enabled
   * Protected: Requires authentication
   */
  findSharing() {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check authentication
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

      // Fetch sharing locations from database
      const dbLocations = yield* Effect.tryPromise({
        try: async () => {
          return await self.db.query.locations.findMany({
            where: eq(locations.isSharingLocation, true),
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findSharing",
            cause: error,
          }),
      });

      // Filter to only return locations that are shared with the authenticated user
      const accessibleLocations: typeof dbLocations = [];
      for (const dbLocation of dbLocations) {
        // User can see their own location
        if (authCtx.userId === dbLocation.userId) {
          accessibleLocations.push(dbLocation);
          continue;
        }

        // Check if location is shared with this user
        const isShared = yield* self.isLocationSharedWithUser(
          dbLocation.userId,
          authCtx.userId,
        );

        if (isShared) {
          accessibleLocations.push(dbLocation);
        }
      }

      return yield* Effect.all(
        accessibleLocations.map((loc) => locationMapper.toDomain(loc)),
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
      // Get AuthContext for authentication
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

      // Users can only view locations shared with them (not arbitrary users)
      // The userId parameter should match the authenticated user's ID
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

      // Query the junction table to find location owners who share with this user
      const dbLocations = yield* Effect.tryPromise({
        try: async () => {
          // Column A = location owner userId, Column B = userId that owner shares with
          const shareEntries = await self.db
            .select({ A: locationUsersShareWith.A })
            .from(locationUsersShareWith)
            .where(eq(locationUsersShareWith.B, userIdStr));

          const ownerIds = shareEntries.map((entry) => entry.A);

          if (ownerIds.length === 0) {
            return [];
          }

          // Find locations for these owners with sharing enabled
          return await self.db.query.locations.findMany({
            where: and(
              inArray(locations.userId, ownerIds),
              eq(locations.isSharingLocation, true),
            ),
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByUserInSharingList",
            id: userIdStr,
            cause: error,
          }),
      });

      return yield* Effect.all(
        dbLocations.map((loc) => locationMapper.toDomain(loc)),
      );
    });
  }

  /**
   * Create new location
   * Protected: Requires authentication - users can only create for themselves
   */
  create(location: Location) {
    const self = this;
    const insert = locationMapper.toInsert(location);
    const idStr = LocationIdFactory.toString(location.id);
    const userIdStr = UserIdFactory.toString(location.userId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
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

      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .insert(locations)
            .values(insert)
            .returning();
          const dbLocation = result[0];
          if (!dbLocation) {
            throw new Error("Failed to create location - no row returned");
          }
          return dbLocation;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: idStr,
            cause: error,
          }),
      });

      return yield* locationMapper.toDomain(result);
    });
  }

  /**
   * Update existing location
   * PRIVACY-CRITICAL: Users can only update their own location
   */
  update(location: Location) {
    const self = this;
    const update = locationMapper.toUpdate(location);
    const idStr = LocationIdFactory.toString(location.id);
    const userIdStr = UserIdFactory.toString(location.userId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "location",
            resourceId: idStr,
          }),
        );
      }

      // Users can only update their own location
      // This is a PRIVACY CRITICAL check - never bypass
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "location",
            resourceId: idStr,
            userId: authCtx.userId,
          }),
        );
      }

      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .update(locations)
            .set(update)
            .where(eq(locations.id, idStr))
            .returning();
          const dbLocation = result[0];
          if (!dbLocation) {
            throw new Error("Failed to update location - no row returned");
          }
          return dbLocation;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });

      return yield* locationMapper.toDomain(result);
    });
  }

  /**
   * Upsert location for user
   * PRIVACY-CRITICAL: Users can only upsert their own location
   */
  upsert(location: Location) {
    const self = this;
    const idStr = LocationIdFactory.toString(location.id);
    const userIdStr = UserIdFactory.toString(location.userId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "location",
            resourceId: idStr,
          }),
        );
      }

      // Users can only upsert their own location
      // This is a PRIVACY CRITICAL check - never bypass
      if (authCtx.userId !== userIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "location",
            resourceId: idStr,
            userId: authCtx.userId,
          }),
        );
      }

      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: async () => {
          // Check if location exists
          const existing = await self.db.query.locations.findFirst({
            where: eq(locations.id, idStr),
          });

          if (existing) {
            // Update
            const update = locationMapper.toUpdate(location);
            const result = await self.db
              .update(locations)
              .set(update)
              .where(eq(locations.id, idStr))
              .returning();
            const dbLocation = result[0];
            if (!dbLocation) {
              throw new Error(
                "Failed to upsert location - no row returned on update",
              );
            }
            return dbLocation;
          } else {
            // Insert
            const insert = locationMapper.toInsert(location);
            const result = await self.db
              .insert(locations)
              .values(insert)
              .returning();
            const dbLocation = result[0];
            if (!dbLocation) {
              throw new Error(
                "Failed to upsert location - no row returned on insert",
              );
            }
            return dbLocation;
          }
        },
        catch: (error) =>
          new DatabaseError({
            operation: "upsert",
            id: idStr,
            cause: error,
          }),
      });

      return yield* locationMapper.toDomain(result);
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
      // First get the location to check ownership
      const dbLocation = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.locations.findFirst({
            where: eq(locations.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });

      // If location not found, fail with EntityNotFoundError
      if (!dbLocation) {
        return yield* Effect.fail(
          new EntityNotFoundError({
            entityType: "Location",
            identifier: idStr,
          }),
        );
      }

      // Get AuthContext for authentication
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

      // Users can only delete their own location
      if (authCtx.userId !== dbLocation.userId) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "delete",
            resourceType: "location",
            resourceId: idStr,
            userId: authCtx.userId,
          }),
        );
      }

      // Proceed with database operation
      yield* Effect.tryPromise({
        try: async () => {
          await self.db.delete(locations).where(eq(locations.id, idStr));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });
    });
  }

  // ============================================================================
  // Location Sharing Request Operations
  // ============================================================================

  findSharingRequestById(id: LocationSharingRequestId) {
    const self = this;
    const idStr = LocationSharingRequestIdFactory.toString(id);

    return Effect.gen(function* () {
      const dbRequest = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.locationSharingRequests.findFirst({
            where: eq(locationSharingRequests.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findSharingRequestById",
            id: idStr,
            cause: error,
          }),
      });

      if (!dbRequest) {
        return null;
      }

      return yield* locationSharingRequestMapper.toDomain(dbRequest);
    });
  }

  findSharingRequestBySenderAndReceiver(senderId: UserId, receiverId: UserId) {
    const self = this;
    const senderIdStr = UserIdFactory.toString(senderId);
    const receiverIdStr = UserIdFactory.toString(receiverId);

    return Effect.gen(function* () {
      const dbRequest = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.locationSharingRequests.findFirst({
            where: and(
              eq(locationSharingRequests.requesterId, senderIdStr),
              eq(locationSharingRequests.targetId, receiverIdStr),
            ),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findSharingRequestBySenderAndReceiver",
            id: `${senderIdStr}:${receiverIdStr}`,
            cause: error,
          }),
      });

      if (!dbRequest) {
        return null;
      }

      return yield* locationSharingRequestMapper.toDomain(dbRequest);
    });
  }

  findPendingSharingRequestsByReceiver(receiverId: UserId) {
    const self = this;
    const receiverIdStr = UserIdFactory.toString(receiverId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
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

      const dbRequests = yield* Effect.tryPromise({
        try: async () => {
          return await self.db.query.locationSharingRequests.findMany({
            where: and(
              eq(locationSharingRequests.targetId, receiverIdStr),
              eq(locationSharingRequests.status, "PENDING"),
            ),
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findPendingSharingRequestsByReceiver",
            id: receiverIdStr,
            cause: error,
          }),
      });

      return yield* Effect.all(
        dbRequests.map((req) => locationSharingRequestMapper.toDomain(req)),
      );
    });
  }

  findSharingRequestsBySender(senderId: UserId) {
    const self = this;
    const senderIdStr = UserIdFactory.toString(senderId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
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

      const dbRequests = yield* Effect.tryPromise({
        try: async () => {
          return await self.db.query.locationSharingRequests.findMany({
            where: eq(locationSharingRequests.requesterId, senderIdStr),
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findSharingRequestsBySender",
            id: senderIdStr,
            cause: error,
          }),
      });

      return yield* Effect.all(
        dbRequests.map((req) => locationSharingRequestMapper.toDomain(req)),
      );
    });
  }

  findSharingRequestsByReceiver(receiverId: UserId) {
    const self = this;
    const receiverIdStr = UserIdFactory.toString(receiverId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
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

      const dbRequests = yield* Effect.tryPromise({
        try: async () => {
          return await self.db.query.locationSharingRequests.findMany({
            where: eq(locationSharingRequests.targetId, receiverIdStr),
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findSharingRequestsByReceiver",
            id: receiverIdStr,
            cause: error,
          }),
      });

      return yield* Effect.all(
        dbRequests.map((req) => locationSharingRequestMapper.toDomain(req)),
      );
    });
  }

  createSharingRequest(request: LocationSharingRequest) {
    const self = this;
    const insert = locationSharingRequestMapper.toInsert(request);
    const idStr = LocationSharingRequestIdFactory.toString(request.id);
    const senderIdStr = UserIdFactory.toString(request.senderId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
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

      // Users can only create sharing requests as themselves (sender)
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

      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .insert(locationSharingRequests)
            .values(insert)
            .returning();
          const dbRequest = result[0];
          if (!dbRequest) {
            throw new Error("Failed to create sharing request - no row returned");
          }
          return dbRequest;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "createSharingRequest",
            id: idStr,
            cause: error,
          }),
      });

      return yield* locationSharingRequestMapper.toDomain(result);
    });
  }

  updateSharingRequest(request: LocationSharingRequest) {
    const self = this;
    const update = locationSharingRequestMapper.toUpdate(request);
    const idStr = LocationSharingRequestIdFactory.toString(request.id);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "locationSharingRequest",
            resourceId: idStr,
          }),
        );
      }

      // Users can only update sharing requests they are involved in
      // (either as sender or receiver)
      const senderIdStr = UserIdFactory.toString(request.senderId);
      const receiverIdStr = UserIdFactory.toString(request.receiverId);
      if (authCtx.userId !== senderIdStr && authCtx.userId !== receiverIdStr) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "update",
            resourceType: "locationSharingRequest",
            resourceId: idStr,
            userId: authCtx.userId,
          }),
        );
      }

      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .update(locationSharingRequests)
            .set(update)
            .where(eq(locationSharingRequests.id, idStr))
            .returning();
          const dbRequest = result[0];
          if (!dbRequest) {
            throw new Error("Failed to update sharing request - no row returned");
          }
          return dbRequest;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "updateSharingRequest",
            id: idStr,
            cause: error,
          }),
      });

      return yield* locationSharingRequestMapper.toDomain(result);
    });
  }

  // ============================================================================
  // Sharing List Operations
  // ============================================================================

  connectUserToSharing(locationOwnerId: UserId, userIdToShareWith: UserId) {
    const self = this;
    const ownerId = UserIdFactory.toString(locationOwnerId);
    const userId = UserIdFactory.toString(userIdToShareWith);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerId,
          }),
        );
      }

      // Users can only modify their own sharing list
      if (authCtx.userId !== ownerId) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerId,
            userId: authCtx.userId,
          }),
        );
      }

      // Proceed with database operation
      yield* Effect.tryPromise({
        try: async () => {
          // Insert into junction table `_LocationUsersShareWith`
          // Column A = location owner userId, Column B = shared userId
          await self.db
            .insert(locationUsersShareWith)
            .values({ A: ownerId, B: userId })
            .onConflictDoNothing({
              target: [locationUsersShareWith.A, locationUsersShareWith.B],
            });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "connectUserToSharing",
            id: `${ownerId}:${userId}`,
            cause: error,
          }),
      });
    });
  }

  disconnectUserFromSharing(locationOwnerId: UserId, userIdToRemove: UserId) {
    const self = this;
    const ownerId = UserIdFactory.toString(locationOwnerId);
    const userId = UserIdFactory.toString(userIdToRemove);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerId,
          }),
        );
      }

      // Users can only modify their own sharing list
      if (authCtx.userId !== ownerId) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerId,
            userId: authCtx.userId,
          }),
        );
      }

      // Proceed with database operation
      yield* Effect.tryPromise({
        try: async () => {
          // Delete from junction table
          await self.db
            .delete(locationUsersShareWith)
            .where(
              and(
                eq(locationUsersShareWith.A, ownerId),
                eq(locationUsersShareWith.B, userId),
              ),
            );
        },
        catch: (error) =>
          new DatabaseError({
            operation: "disconnectUserFromSharing",
            id: `${ownerId}:${userId}`,
            cause: error,
          }),
      });
    });
  }

  setUsersToShareWith(locationOwnerId: UserId, userIds: UserId[]) {
    const self = this;
    const ownerId = UserIdFactory.toString(locationOwnerId);
    const userIdStrs = userIds.map((id) => UserIdFactory.toString(id));

    return Effect.gen(function* () {
      // Get AuthContext for authentication
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerId,
          }),
        );
      }

      // Users can only modify their own sharing list
      if (authCtx.userId !== ownerId) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "write",
            resourceType: "locationSharing",
            resourceId: ownerId,
            userId: authCtx.userId,
          }),
        );
      }

      // Proceed with database operation
      yield* Effect.tryPromise({
        try: async () => {
          // Start transaction to replace sharing list
          await self.db.transaction(async (tx) => {
            // Delete existing entries for this owner
            await tx
              .delete(locationUsersShareWith)
              .where(eq(locationUsersShareWith.A, ownerId));

            // Insert new entries if any
            if (userIdStrs.length > 0) {
              // Insert each user individually - Drizzle ORM handles batch optimization
              for (const userId of userIdStrs) {
                await tx
                  .insert(locationUsersShareWith)
                  .values({ A: ownerId, B: userId })
                  .onConflictDoNothing({
                    target: [locationUsersShareWith.A, locationUsersShareWith.B],
                  });
              }
            }
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "setUsersToShareWith",
            id: ownerId,
            cause: error,
          }),
      });
    });
  }

  getSharingListForUser(locationOwnerId: UserId) {
    const self = this;
    const ownerId = UserIdFactory.toString(locationOwnerId);

    return Effect.gen(function* () {
      // Get AuthContext for authentication
      const authCtx = yield* AuthContextTag;

      // Authentication required
      if (!authCtx.isAuthenticated) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharing:list",
            resourceId: ownerId,
          }),
        );
      }

      // Users can only view their own sharing list
      if (authCtx.userId !== ownerId) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            requiredPermission: "read",
            resourceType: "locationSharing:list",
            resourceId: ownerId,
            userId: authCtx.userId,
          }),
        );
      }

      // Query junction table for all users that owner shares with
      const results = yield* Effect.tryPromise({
        try: async () => {
          return await self.db
            .select({ B: locationUsersShareWith.B })
            .from(locationUsersShareWith)
            .where(eq(locationUsersShareWith.A, ownerId));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "getSharingListForUser",
            id: ownerId,
            cause: error,
          }),
      });

      // Convert userId strings to UserId branded types
      return results.map((row) => UserIdFactory.unsafeCreate(row.B));
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Check if a location owner's location is shared with a specific user
   * @param ownerId - Location owner's user ID (column A in junction table)
   * @param userId - User to check if they have access (column B in junction table)
   * @returns Effect that resolves to true if shared, false otherwise
   */
  private isLocationSharedWithUser(
    ownerId: string,
    userId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    const self = this;

    return Effect.tryPromise({
      try: async () => {
        const result = await self.db
          .select({ count: sql<number>`count(*)` })
          .from(locationUsersShareWith)
          .where(
            and(
              eq(locationUsersShareWith.A, ownerId),
              eq(locationUsersShareWith.B, userId),
            ),
          );
        return (result[0]?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "isLocationSharedWithUser",
          cause: error,
        }),
    });
  }
}
