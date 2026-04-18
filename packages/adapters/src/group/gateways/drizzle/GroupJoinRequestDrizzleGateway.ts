import { Effect } from "effect";
import { eq, and, inArray, desc } from "drizzle-orm";
import { groupJoinRequests } from "../../../infrastructure/drizzle";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  GroupJoinRequest,
  GroupJoinRequestId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IGroupJoinRequestPort } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { groupJoinRequestMapper } from "../../mappers/GroupJoinRequestMapper";

/**
 * GroupJoinRequest Drizzle Gateway
 *
 * Implements GroupJoinRequestPort using Drizzle ORM for PostgreSQL.
 */
export class GroupJoinRequestDrizzleGateway
  extends BaseDrizzleGateway
  implements IGroupJoinRequestPort
{
  findById(id: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.findById",
      async () => {
        const result = await this.db.query.groupJoinRequests.findFirst({
          where: eq(groupJoinRequests.id, id),
        });
        if (!result) return null;
        return await Effect.runPromise(groupJoinRequestMapper.toDomain(result));
      },
      id,
    );
  }

  findByUserAndTrip(userId: string, tripId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.findByUserAndTrip",
      async () => {
        const result = await this.db.query.groupJoinRequests.findFirst({
          where: and(
            eq(groupJoinRequests.userId, userId),
            eq(groupJoinRequests.tripId, tripId),
          ),
        });
        if (!result) return null;
        return await Effect.runPromise(groupJoinRequestMapper.toDomain(result));
      },
      `${userId}-${tripId}`,
    );
  }

  findByUserTripAndGroup(userId: string, tripId: string, groupId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.findByUserTripAndGroup",
      async () => {
        const result = await this.db.query.groupJoinRequests.findFirst({
          where: and(
            eq(groupJoinRequests.userId, userId),
            eq(groupJoinRequests.tripId, tripId),
            eq(groupJoinRequests.groupId, groupId),
          ),
        });
        if (!result) return null;
        return await Effect.runPromise(groupJoinRequestMapper.toDomain(result));
      },
      `${userId}-${tripId}-${groupId}`,
    );
  }

  findPendingByGroupId(groupId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.findPendingByGroupId",
      async () => {
        const results = await this.db.query.groupJoinRequests.findMany({
          where: eq(groupJoinRequests.groupId, groupId),
          orderBy: desc(groupJoinRequests.createdAt),
        });

        const domainRequests: GroupJoinRequest[] = [];
        for (const result of results) {
          const request = await Effect.runPromise(
            groupJoinRequestMapper.toDomain(result),
          );
          domainRequests.push(request);
        }
        return domainRequests;
      },
      groupId,
    );
  }

  findByGroupId(groupId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.findByGroupId",
      async () => {
        const results = await this.db.query.groupJoinRequests.findMany({
          where: eq(groupJoinRequests.groupId, groupId),
          orderBy: desc(groupJoinRequests.createdAt),
        });

        const domainRequests: GroupJoinRequest[] = [];
        for (const result of results) {
          const request = await Effect.runPromise(
            groupJoinRequestMapper.toDomain(result),
          );
          domainRequests.push(request);
        }
        return domainRequests;
      },
      groupId,
    );
  }

  create(request: GroupJoinRequest) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.create",
      async () => {
        const insertData = groupJoinRequestMapper.toInsert(request);
        await this.db.insert(groupJoinRequests).values(insertData);
        return request;
      },
      GroupJoinRequestId.toString(request.id),
    );
  }

  update(request: GroupJoinRequest) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.update",
      async () => {
        await this.db
          .update(groupJoinRequests)
          .set({ createdAt: request.requestedAt })
          .where(
            eq(groupJoinRequests.id, GroupJoinRequestId.toString(request.id)),
          );
        return request;
      },
      GroupJoinRequestId.toString(request.id),
    );
  }

  delete(id: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.delete",
      async () => {
        await this.db
          .delete(groupJoinRequests)
          .where(eq(groupJoinRequests.id, id));
      },
      id,
    );
  }

  deleteByGroupId(groupId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.deleteByGroupId",
      async () => {
        await this.db
          .delete(groupJoinRequests)
          .where(eq(groupJoinRequests.groupId, groupId));
      },
      groupId,
    );
  }

  deleteByUserAndTrip(userId: string, tripId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.deleteByUserAndTrip",
      async () => {
        await this.db
          .delete(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.userId, userId),
              eq(groupJoinRequests.tripId, tripId),
            ),
          );
      },
      `${userId}-${tripId}`,
    );
  }

  deleteByUsersAndTrip(userIds: string[], tripId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.deleteByUsersAndTrip",
      async () => {
        await this.db
          .delete(groupJoinRequests)
          .where(
            and(
              inArray(groupJoinRequests.userId, userIds),
              eq(groupJoinRequests.tripId, tripId),
            ),
          );
      },
      `users-${tripId}`,
    );
  }

  exists(id: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.exists",
      async () => {
        const result = await this.db
          .select({ id: groupJoinRequests.id })
          .from(groupJoinRequests)
          .where(eq(groupJoinRequests.id, id))
          .limit(1);
        return result.length > 0;
      },
      id,
    );
  }

  hasPendingRequest(userId: string, tripId: string) {
    return this.tryPromise(
      "GroupJoinRequestDrizzleGateway.hasPendingRequest",
      async () => {
        const result = await this.db
          .select({ id: groupJoinRequests.id })
          .from(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.userId, userId),
              eq(groupJoinRequests.tripId, tripId),
            ),
          )
          .limit(1);
        return result.length > 0;
      },
      `${userId}-${tripId}`,
    );
  }
}
