import { Effect, Data } from "effect";
import { eq, and } from "drizzle-orm";
import {
  locationSharingRequests,
  type DrizzleDb,
} from "@mirai-app/frameworks/drizzle";
import {
  type LocationSharingRequest,
  DatabaseError,
  ApplicationError,
  type UserId,
  type LocationSharingRequestId,
  type ValidationError,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
} from "@mirai-app/domain";
import type { ILocationSharingRequestPort } from "@mirai-app/use-cases/location/ports";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
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
 * Converts DatabaseError to ApplicationError for port interface compliance
 */
const mapDatabaseToApplicationError = (
  databaseError: DatabaseError,
): ApplicationError =>
  new ApplicationError({
    operation: databaseError.operation,
    id: databaseError.id,
    cause: databaseError.cause,
  });

/**
 * Location Sharing Request Drizzle Gateway
 *
 * Implements ILocationSharingRequestPort using Drizzle ORM.
 * Dedicated gateway for location sharing request operations.
 */
export class LocationSharingRequestDrizzleGateway
  extends BaseDrizzleGateway
  implements ILocationSharingRequestPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, ApplicationError, never> {
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
          ? mapValidationToDatabaseError(error as ValidationError, "findById")
          : (error as DatabaseError),
      ),
      Effect.mapError(mapDatabaseToApplicationError),
    );
  }

  findBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, ApplicationError, never> {
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
              "findBySenderAndReceiver",
            )
          : (error as DatabaseError),
      ),
      Effect.mapError(mapDatabaseToApplicationError),
    );
  }

  findPendingByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], ApplicationError, never> {
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
              "findPendingByReceiver",
            )
          : (error as DatabaseError),
      ),
      Effect.mapError(mapDatabaseToApplicationError),
    );
  }

  findBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], ApplicationError, never> {
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
              "findBySender",
            )
          : (error as DatabaseError),
      ),
      Effect.mapError(mapDatabaseToApplicationError),
    );
  }

  findByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], ApplicationError, never> {
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
              "findByReceiver",
            )
          : (error as DatabaseError),
      ),
      Effect.mapError(mapDatabaseToApplicationError),
    );
  }

  create(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, ApplicationError, never> {
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
          ? mapValidationToDatabaseError(error as ValidationError, "create")
          : new DatabaseError({
              operation: "create",
              cause: error,
              id: idStr,
            }),
      ),
      Effect.mapError(mapDatabaseToApplicationError),
    );
  }

  update(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, ApplicationError, never> {
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
          ? mapValidationToDatabaseError(error as ValidationError, "update")
          : new DatabaseError({
              operation: "update",
              cause: error,
              id: idStr,
            }),
      ),
      Effect.mapError(mapDatabaseToApplicationError),
    );
  }

  delete(
    id: LocationSharingRequestId,
  ): Effect.Effect<void, ApplicationError, never> {
    const idStr = LocationSharingRequestIdFactory.toString(id);
    return this.tryPromise(
      "deleteSharingRequest",
      async () => {
        await this.db
          .delete(locationSharingRequests)
          .where(eq(locationSharingRequests.id, idStr));
      },
      idStr,
    ).pipe(Effect.mapError(mapDatabaseToApplicationError));
  }
}
