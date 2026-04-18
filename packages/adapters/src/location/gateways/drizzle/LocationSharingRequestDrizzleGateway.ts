import { Effect } from "effect";
import { eq, and } from "drizzle-orm";
import {
  locationSharingRequests,
  type DrizzleDb,
} from "../../../infrastructure/drizzle";
import {
  type LocationSharingRequest,
  DatabaseError,
  type UserId,
  type LocationSharingRequestId,
  UserId as UserIdFactory,
  LocationSharingRequestId as LocationSharingRequestIdFactory,
} from "@mirai-app/domain";
import type { ILocationSharingRequestPort } from "@mirai-app/use-cases/location/ports";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { locationSharingRequestMapper } from "../../mappers/LocationSharingRequestMapper";

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

  findById(id: LocationSharingRequestId) {
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
    );
  }

  findBySenderAndReceiver(senderId: UserId, receiverId: UserId) {
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
    );
  }

  findPendingByReceiver(receiverId: UserId) {
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
    );
  }

  findBySender(senderId: UserId) {
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
    );
  }

  findByReceiver(receiverId: UserId) {
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
    );
  }

  create(request: LocationSharingRequest) {
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
    );
  }

  update(request: LocationSharingRequest) {
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
    );
  }

  delete(id: LocationSharingRequestId) {
    const idStr = LocationSharingRequestIdFactory.toString(id);
    return this.tryPromise(
      "deleteSharingRequest",
      async () => {
        await this.db
          .delete(locationSharingRequests)
          .where(eq(locationSharingRequests.id, idStr));
      },
      idStr,
    );
  }
}
