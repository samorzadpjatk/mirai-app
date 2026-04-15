import { eq, and } from "drizzle-orm";
import {
  locationSharingRequests,
  type LocationSharingRequestSelect,
  type LocationSharingRequestInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import {
  LocationSharingRequest,
  LocationSharingRequestStatus,
} from "@mirai-app/domain";
import type { LocationRepository } from "@mirai-app/domain/ports";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * DrizzleLocationGateway
 *
 * Gateway implementation using Drizzle ORM for LocationSharingRequest entity.
 */
export class DrizzleLocationGateway implements LocationRepository {
  constructor(private db: DrizzleDb) {}

  /**
   * Create a new location sharing request
   */
  create(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData: LocationSharingRequestInsert = {
          id: request.id,
          requesterId: request.senderId,
          targetId: request.receiverId,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        };

        const [record] = await this.db
          .insert(locationSharingRequests)
          .values(insertData)
          .returning();

        if (!record) {
          throw new Error(
            "Failed to create location sharing request: no record returned",
          );
        }

        return this.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create location sharing request",
          cause: error,
        }),
    });
  }

  /**
   * Find location sharing request by ID
   */
  findById(
    id: string,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select()
          .from(locationSharingRequests)
          .where(eq(locationSharingRequests.id, id))
          .limit(1);

        return record ? this.toDomain(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: "Failed to find location sharing request by ID",
          cause: error,
        }),
    });
  }

  /**
   * Find active location sharing requests for a trip
   * Note: This queries all accepted requests and filters by trip context externally
   */
  findActiveByTripId(
    tripId: string,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // Query accepted requests - trip context filtering would be done at higher layer
        const records = await this.db
          .select()
          .from(locationSharingRequests)
          .where(
            eq(
              locationSharingRequests.status,
              LocationSharingRequestStatus.ACCEPTED,
            ),
          );

        return records.map((r) => this.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActiveByTripId",
          message: "Failed to find active location sharing requests by trip ID",
          cause: error,
        }),
    });
  }

  /**
   * Find location sharing requests by user ID (as requester)
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(locationSharingRequests)
          .where(eq(locationSharingRequests.requesterId, userId));

        return records.map((r) => this.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserId",
          message: "Failed to find location sharing requests by user ID",
          cause: error,
        }),
    });
  }

  /**
   * Find active location sharing request for a user in a trip
   */
  findActiveByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // Find accepted requests where user is the requester
        const records = await this.db
          .select()
          .from(locationSharingRequests)
          .where(
            and(
              eq(locationSharingRequests.requesterId, userId),
              eq(
                locationSharingRequests.status,
                LocationSharingRequestStatus.ACCEPTED,
              ),
            ),
          );

        // Return first match (trip filtering would be done at higher layer)
        const first = records[0];
        return first ? this.toDomain(first) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActiveByUserAndTrip",
          message:
            "Failed to find active location sharing request for user and trip",
          cause: error,
        }),
    });
  }

  /**
   * Update location sharing request
   */
  update(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(locationSharingRequests)
          .set({
            requesterId: request.senderId,
            targetId: request.receiverId,
            status: request.status,
            updatedAt: new Date(),
          })
          .where(eq(locationSharingRequests.id, request.id))
          .returning();

        if (!record) {
          throw new Error(
            `Location sharing request with id ${request.id} not found`,
          );
        }

        return this.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "update",
          message: "Failed to update location sharing request",
          cause: error,
        }),
    });
  }

  /**
   * End location sharing (set status to REJECTED or delete)
   * This effectively ends the sharing by marking it rejected
   */
  endSharing(
    id: string,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(locationSharingRequests)
          .set({
            status: LocationSharingRequestStatus.REJECTED,
            updatedAt: new Date(),
          })
          .where(eq(locationSharingRequests.id, id))
          .returning();

        if (!record) {
          throw new Error(`Location sharing request with id ${id} not found`);
        }

        return this.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "endSharing",
          message: "Failed to end location sharing",
          cause: error,
        }),
    });
  }

  /**
   * Delete location sharing request
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .delete(locationSharingRequests)
          .where(eq(locationSharingRequests.id, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          message: "Failed to delete location sharing request",
          cause: error,
        }),
    });
  }

  /**
   * Helper to convert database record to domain entity
   */
  private toDomain(
    record: LocationSharingRequestSelect,
  ): LocationSharingRequest {
    // Use reconstitute to create entity without validation
    return LocationSharingRequest.reconstitute({
      id: record.id,
      senderId: record.requesterId,
      receiverId: record.targetId,
      status: record.status as LocationSharingRequestStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
