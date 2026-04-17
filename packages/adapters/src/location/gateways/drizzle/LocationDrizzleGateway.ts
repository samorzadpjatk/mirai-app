import { Effect, Data } from "effect";
import { eq, and, inArray } from "drizzle-orm";
import {
  locations,
  locationSharingRequests,
  locationUsersShareWith,
  type DrizzleDb,
} from "@mirai-app/frameworks/drizzle";
import {
  type Location,
  type LocationSharingRequest,
  DatabaseError,
  type UserId,
  type LocationId,
  type LocationSharingRequestId,
  type ValidationError,
  LocationId as LocationIdFactory,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
} from "@mirai-app/domain";
import type { ILocationPort } from "@mirai-app/use-cases/location/ports";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { locationMapper } from "../../mappers/LocationMapper";
import { locationSharingRequestMapper } from "../../mappers/LocationSharingRequestMapper";

/**
 * Converts ValidationError to DatabaseError for port interface compliance
 */
const mapValidationToDatabaseError = (
  validationError: ValidationError,
  operation: string,
): DatabaseError =>
  new DatabaseError({
    operation,
    cause: validationError,
  });

/**
 * Location Drizzle Gateway
 *
 * Implements ILocationPort using Drizzle ORM.
 * Handles both Location and LocationSharingRequest operations.
 *
 * Note on Sharing List Operations:
 * The sharing list is a many-to-many relationship between location owners and users
 * they share with. The Drizzle schema expects a junction table `_LocationUsersShareWith`
 * with columns: `A` (location owner userId) and `B` (userId to share with).
 * This table follows Prisma's implicit many-to-many naming convention.
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

  findById(
    id: LocationId,
  ): Effect.Effect<Location | null, DatabaseError, never> {
    const idStr = LocationIdFactory.toString(id);
    return this.tryPromise(
      "findLocationById",
      async () => {
        const result = await this.db.query.locations.findFirst({
          where: eq(locations.id, idStr),
        });
        return result ?? null;
      },
      idStr,
    ).pipe(
      Effect.flatMap((dbLocation) =>
        dbLocation ? locationMapper.toDomain(dbLocation) : Effect.succeed(null),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findLocationById",
            )
          : (error as DatabaseError),
      ),
    );
  }

  findByUserId(
    userId: UserId,
  ): Effect.Effect<Location | null, DatabaseError, never> {
    const userIdStr = UserIdFactory.toString(userId);
    return this.tryPromise(
      "findLocationByUserId",
      async () => {
        const result = await this.db.query.locations.findFirst({
          where: eq(locations.userId, userIdStr),
        });
        return result ?? null;
      },
      userIdStr,
    ).pipe(
      Effect.flatMap((dbLocation) =>
        dbLocation ? locationMapper.toDomain(dbLocation) : Effect.succeed(null),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findLocationByUserId",
            )
          : (error as DatabaseError),
      ),
    );
  }

  findSharing(): Effect.Effect<Location[], DatabaseError, never> {
    return this.tryPromise("findSharingLocations", async () => {
      return await this.db.query.locations.findMany({
        where: eq(locations.isSharingLocation, true),
      });
    }).pipe(
      Effect.flatMap((dbLocations) =>
        Effect.all(dbLocations.map((loc) => locationMapper.toDomain(loc))),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findSharingLocations",
            )
          : (error as DatabaseError),
      ),
    );
  }

  findByUserInSharingList(
    userId: UserId,
  ): Effect.Effect<Location[], DatabaseError, never> {
    const userIdStr = UserIdFactory.toString(userId);
    return this.tryPromise(
      "findLocationsByUserInSharingList",
      async () => {
        // Query the junction table to find location owners who share with this user
        // Column A = location owner userId, Column B = userId that owner shares with
        const shareEntries = await this.db
          .select({ A: locationUsersShareWith.A })
          .from(locationUsersShareWith)
          .where(eq(locationUsersShareWith.B, userIdStr));

        const ownerIds = shareEntries.map((entry) => entry.A);

        if (ownerIds.length === 0) {
          return [];
        }
        // Find locations for these owners
        return await this.db.query.locations.findMany({
          where: and(
            inArray(locations.userId, ownerIds),
            eq(locations.isSharingLocation, true),
          ),
        });
      },
      userIdStr,
    ).pipe(
      Effect.flatMap((dbLocations) =>
        Effect.all(dbLocations.map((loc) => locationMapper.toDomain(loc))),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findLocationsByUserInSharingList",
            )
          : (error as DatabaseError),
      ),
    );
  }

  create(location: Location): Effect.Effect<Location, DatabaseError, never> {
    const insert = locationMapper.toInsert(location);
    const idStr = LocationIdFactory.toString(location.id);
    return this.tryPromise(
      "createLocation",
      async () => {
        const result = await this.db
          .insert(locations)
          .values(insert)
          .returning();
        const dbLocation = result[0];
        if (!dbLocation) {
          throw new Error("Failed to create location - no row returned");
        }
        return dbLocation;
      },
      idStr,
    ).pipe(
      Effect.flatMap((dbLocation) => locationMapper.toDomain(dbLocation)),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "createLocation",
            )
          : new DatabaseError({
              operation: "createLocation",
              cause: error,
              id: idStr,
            }),
      ),
    );
  }

  update(location: Location): Effect.Effect<Location, DatabaseError, never> {
    const update = locationMapper.toUpdate(location);
    const idStr = LocationIdFactory.toString(location.id);
    return this.tryPromise(
      "updateLocation",
      async () => {
        const result = await this.db
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
      idStr,
    ).pipe(
      Effect.flatMap((dbLocation) => locationMapper.toDomain(dbLocation)),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "updateLocation",
            )
          : new DatabaseError({
              operation: "updateLocation",
              cause: error,
              id: idStr,
            }),
      ),
    );
  }

  upsert(location: Location): Effect.Effect<Location, DatabaseError, never> {
    const idStr = LocationIdFactory.toString(location.id);
    return this.tryPromise(
      "upsertLocation",
      async () => {
        // Check if location exists
        const existing = await this.db.query.locations.findFirst({
          where: eq(locations.id, idStr),
        });

        if (existing) {
          // Update
          const update = locationMapper.toUpdate(location);
          const result = await this.db
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
          const result = await this.db
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
      idStr,
    ).pipe(
      Effect.flatMap((dbLocation) => locationMapper.toDomain(dbLocation)),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "upsertLocation",
            )
          : new DatabaseError({
              operation: "upsertLocation",
              cause: error,
              id: idStr,
            }),
      ),
    );
  }

  delete(id: LocationId): Effect.Effect<void, DatabaseError, never> {
    const idStr = LocationIdFactory.toString(id);
    return this.tryPromise(
      "deleteLocation",
      async () => {
        await this.db.delete(locations).where(eq(locations.id, idStr));
      },
      idStr,
    );
  }

  // ============================================================================
  // Location Sharing Request Operations
  // ============================================================================

  findSharingRequestById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never> {
    const idStr = LocationSharingRequestIdFactory.toString(id);
    return this.tryPromise(
      "findSharingRequestById",
      async () => {
        const result = await this.db.query.locationSharingRequests.findFirst({
          where: eq(locationSharingRequests.id, idStr),
        });
        return result ?? null;
      },
      idStr,
    ).pipe(
      Effect.flatMap((dbRequest) =>
        dbRequest
          ? locationSharingRequestMapper.toDomain(dbRequest)
          : Effect.succeed(null),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findSharingRequestById",
            )
          : (error as DatabaseError),
      ),
    );
  }

  findSharingRequestBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never> {
    const senderIdStr = UserIdFactory.toString(senderId);
    const receiverIdStr = UserIdFactory.toString(receiverId);
    return this.tryPromise(
      "findSharingRequestBySenderAndReceiver",
      async () => {
        const result = await this.db.query.locationSharingRequests.findFirst({
          where: and(
            eq(locationSharingRequests.requesterId, senderIdStr),
            eq(locationSharingRequests.targetId, receiverIdStr),
          ),
        });
        return result ?? null;
      },
    ).pipe(
      Effect.flatMap((dbRequest) =>
        dbRequest
          ? locationSharingRequestMapper.toDomain(dbRequest)
          : Effect.succeed(null),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findSharingRequestBySenderAndReceiver",
            )
          : (error as DatabaseError),
      ),
    );
  }

  findPendingSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    const receiverIdStr = UserIdFactory.toString(receiverId);
    return this.tryPromise("findPendingSharingRequestsByReceiver", async () => {
      return await this.db.query.locationSharingRequests.findMany({
        where: and(
          eq(locationSharingRequests.targetId, receiverIdStr),
          eq(locationSharingRequests.status, "PENDING"),
        ),
      });
    }).pipe(
      Effect.flatMap((dbRequests) =>
        Effect.all(
          dbRequests.map((req) => locationSharingRequestMapper.toDomain(req)),
        ),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findPendingSharingRequestsByReceiver",
            )
          : (error as DatabaseError),
      ),
    );
  }

  findSharingRequestsBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    const senderIdStr = UserIdFactory.toString(senderId);
    return this.tryPromise("findSharingRequestsBySender", async () => {
      return await this.db.query.locationSharingRequests.findMany({
        where: eq(locationSharingRequests.requesterId, senderIdStr),
      });
    }).pipe(
      Effect.flatMap((dbRequests) =>
        Effect.all(
          dbRequests.map((req) => locationSharingRequestMapper.toDomain(req)),
        ),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findSharingRequestsBySender",
            )
          : (error as DatabaseError),
      ),
    );
  }

  findSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    const receiverIdStr = UserIdFactory.toString(receiverId);
    return this.tryPromise("findSharingRequestsByReceiver", async () => {
      return await this.db.query.locationSharingRequests.findMany({
        where: eq(locationSharingRequests.targetId, receiverIdStr),
      });
    }).pipe(
      Effect.flatMap((dbRequests) =>
        Effect.all(
          dbRequests.map((req) => locationSharingRequestMapper.toDomain(req)),
        ),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "findSharingRequestsByReceiver",
            )
          : (error as DatabaseError),
      ),
    );
  }

  createSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never> {
    const insert = locationSharingRequestMapper.toInsert(request);
    const idStr = LocationSharingRequestIdFactory.toString(request.id);
    return this.tryPromise(
      "createSharingRequest",
      async () => {
        const result = await this.db
          .insert(locationSharingRequests)
          .values(insert)
          .returning();
        const dbRequest = result[0];
        if (!dbRequest) {
          throw new Error("Failed to create sharing request - no row returned");
        }
        return dbRequest;
      },
      idStr,
    ).pipe(
      Effect.flatMap((dbRequest) =>
        locationSharingRequestMapper.toDomain(dbRequest),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "createSharingRequest",
            )
          : new DatabaseError({
              operation: "createSharingRequest",
              cause: error,
              id: idStr,
            }),
      ),
    );
  }

  updateSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never> {
    const update = locationSharingRequestMapper.toUpdate(request);
    const idStr = LocationSharingRequestIdFactory.toString(request.id);
    return this.tryPromise(
      "updateSharingRequest",
      async () => {
        const result = await this.db
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
      idStr,
    ).pipe(
      Effect.flatMap((dbRequest) =>
        locationSharingRequestMapper.toDomain(dbRequest),
      ),
      Effect.mapError((error) =>
        error._tag === "ValidationError"
          ? mapValidationToDatabaseError(
              error as ValidationError,
              "updateSharingRequest",
            )
          : new DatabaseError({
              operation: "updateSharingRequest",
              cause: error,
              id: idStr,
            }),
      ),
    );
  }

  // ============================================================================
  // Sharing List Operations
  // ============================================================================

  connectUserToSharing(
    locationOwnerId: UserId,
    userIdToShareWith: UserId,
  ): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise("connectUserToSharing", async () => {
      const ownerId = UserIdFactory.toString(locationOwnerId);
      const userId = UserIdFactory.toString(userIdToShareWith);

      // Insert into junction table `_LocationUsersShareWith`
      // Column A = location owner userId, Column B = shared userId
      await this.db
        .insert(locationUsersShareWith)
        .values({ A: ownerId, B: userId })
        .onConflictDoNothing({
          target: [locationUsersShareWith.A, locationUsersShareWith.B],
        });
    });
  }

  disconnectUserFromSharing(
    locationOwnerId: UserId,
    userIdToRemove: UserId,
  ): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise("disconnectUserFromSharing", async () => {
      const ownerId = UserIdFactory.toString(locationOwnerId);
      const userId = UserIdFactory.toString(userIdToRemove);

      // Delete from junction table
      await this.db
        .delete(locationUsersShareWith)
        .where(
          and(
            eq(locationUsersShareWith.A, ownerId),
            eq(locationUsersShareWith.B, userId),
          ),
        );
    });
  }

  setUsersToShareWith(
    locationOwnerId: UserId,
    userIds: UserId[],
  ): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise("setUsersToShareWith", async () => {
      const ownerId = UserIdFactory.toString(locationOwnerId);
      const userIdStrs = userIds.map((id) => UserIdFactory.toString(id));

      // Start transaction to replace sharing list
      await this.db.transaction(async (tx) => {
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
    });
  }
}
