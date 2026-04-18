import { Effect, Context } from "effect";
import { eq, and, inArray, desc, sql, count } from "drizzle-orm";
import { groups } from "../../../infrastructure/drizzle";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  Group,
  GroupId,
  TripId,
  DatabaseError,
  EntityNotFoundError,
} from "@mirai-app/domain";
import type { IGroupPort } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { groupMapper } from "../../mappers/GroupMapper";

/**
 * Group Drizzle Gateway
 *
 * Implements IGroupPort using Drizzle ORM for PostgreSQL.
 *
 * Authorization Pattern:
 * This gateway uses the AuthContext pattern for authorization. Protected methods
 * access authentication context via `yield* AuthContextTag` and perform authorization
 * checks via `yield* AuthZPortTag.verifyAccess()` before executing database operations.
 *
 * This approach provides:
 * - Clean separation between authentication and authorization
 * - Type-safe dependency injection through Effect context
 * - No explicit authToken parameters in the interface
 */
export class GroupDrizzleGateway
  extends BaseDrizzleGateway
  implements IGroupPort
{
  findById(id: GroupId) {
    const self = this;
    const idStr = GroupId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // First get the group from database
      const dbGroup = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.groups.findFirst({
            where: eq(groups.id, idStr),
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

      // If authenticated and group exists, verify access
      if (authCtx.isAuthenticated && dbGroup) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: dbGroup.tripId,
          requiredPermission: "read",
        });
      }

      if (!dbGroup) {
        return null;
      }

      return yield* groupMapper.toDomain(dbGroup);
    });
  }

  findByCode(code: string) {
    return this.tryPromise(
      "GroupDrizzleGateway.findByCode",
      async () => {
        const result = await this.db.query.groups.findFirst({
          where: and(eq(groups.code, code), eq(groups.isDeleted, false)),
        });
        if (!result) return null;
        return await Effect.runPromise(groupMapper.toDomain(result));
      },
      code,
    );
  }

  findByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return this.tryPromise(
      "GroupDrizzleGateway.findByTripId",
      async () => {
        const results = await this.db.query.groups.findMany({
          where: and(eq(groups.tripId, tripIdStr), eq(groups.isDeleted, false)),
          orderBy: desc(groups.createdAt),
        });

        const domainGroups: Group[] = [];
        for (const result of results) {
          const group = await Effect.runPromise(groupMapper.toDomain(result));
          domainGroups.push(group);
        }
        return domainGroups;
      },
      tripIdStr,
    );
  }

  findByTripIdPaginated(
    tripId: TripId,
    params: { limit: number; offset: number },
  ) {
    const tripIdStr = TripId.toString(tripId);

    return this.tryPromise(
      "GroupDrizzleGateway.findByTripIdPaginated",
      async () => {
        const [results, totalResult] = await Promise.all([
          this.db.query.groups.findMany({
            where: and(
              eq(groups.tripId, tripIdStr),
              eq(groups.isDeleted, false),
            ),
            orderBy: desc(groups.createdAt),
            limit: params.limit,
            offset: params.offset,
          }),
          this.db
            .select({ count: count() })
            .from(groups)
            .where(
              and(eq(groups.tripId, tripIdStr), eq(groups.isDeleted, false)),
            )
            .then((r) => r[0]?.count ?? 0),
        ]);

        const domainGroups: Group[] = [];
        for (const result of results) {
          const group = await Effect.runPromise(groupMapper.toDomain(result));
          domainGroups.push(group);
        }

        const total = totalResult;
        const hasMore = params.offset + domainGroups.length < total;

        return { groups: domainGroups, total, hasMore };
      },
      tripIdStr,
    );
  }

  findByOrganizerId(organizerId: string) {
    return this.tryPromise(
      "GroupDrizzleGateway.findByOrganizerId",
      async () => {
        const results = await this.db.query.groups.findMany({
          where: and(
            eq(groups.organizerId, organizerId),
            eq(groups.isDeleted, false),
          ),
          orderBy: desc(groups.createdAt),
        });

        const domainGroups: Group[] = [];
        for (const result of results) {
          const group = await Effect.runPromise(groupMapper.toDomain(result));
          domainGroups.push(group);
        }
        return domainGroups;
      },
      organizerId,
    );
  }

  create(group: Group) {
    const insertData = groupMapper.toInsert(group);
    const idStr = GroupId.toString(group.id);
    const tripIdStr = TripId.toString(group.tripId);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          await self.db.insert(groups).values(insertData);
          return group;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: idStr,
            cause: error,
          }),
      });
    });
  }

  update(group: Group) {
    const updateData = groupMapper.toUpdate(group);
    const idStr = GroupId.toString(group.id);
    const tripIdStr = TripId.toString(group.tripId);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .update(groups)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(groups.id, idStr));
          return group;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });
    });
  }

  delete(id: GroupId) {
    const idStr = GroupId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // First get the group to determine the tripId
      const dbGroup = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.groups.findFirst({
            where: eq(groups.id, idStr),
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

      // If group not found, fail with EntityNotFoundError
      if (!dbGroup) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Group", identifier: idStr }),
        );
      }

      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "group",
          resourceId: idStr,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          await self.db.delete(groups).where(eq(groups.id, idStr));
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

  softDelete(id: GroupId) {
    const idStr = GroupId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // First get the group to determine the tripId
      const dbGroup = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.groups.findFirst({
            where: eq(groups.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "softDelete",
            id: idStr,
            cause: error,
          }),
      });

      // If group not found, fail with EntityNotFoundError
      if (!dbGroup) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Group", identifier: idStr }),
        );
      }

      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "group",
          resourceId: idStr,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .update(groups)
            .set({ isDeleted: true, updatedAt: new Date() })
            .where(eq(groups.id, idStr));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "softDelete",
            id: idStr,
            cause: error,
          }),
      });
    });
  }

  exists(id: GroupId) {
    return this.tryPromise(
      "GroupDrizzleGateway.exists",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(groups)
          .where(
            and(
              eq(groups.id, GroupId.toString(id)),
              eq(groups.isDeleted, false),
            ),
          );
        return (result[0]?.count ?? 0) > 0;
      },
      GroupId.toString(id),
    );
  }

  countByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return this.tryPromise(
      "GroupDrizzleGateway.countByTripId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(groups)
          .where(
            and(eq(groups.tripId, tripIdStr), eq(groups.isDeleted, false)),
          );
        return result[0]?.count ?? 0;
      },
      tripIdStr,
    );
  }

  addCoins(groupId: GroupId, amount: number) {
    const idStr = GroupId.toString(groupId);
    const self = this;

    return Effect.gen(function* () {
      // First get the group to determine the tripId
      const dbGroup = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.groups.findFirst({
            where: eq(groups.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "addCoins",
            id: idStr,
            cause: error,
          }),
      });

      // If group not found, fail with EntityNotFoundError
      if (!dbGroup) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Group", identifier: idStr }),
        );
      }

      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: dbGroup.tripId,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: async () => {
          const updateResult = await self.db
            .update(groups)
            .set({
              coins: sql`${groups.coins} + ${amount}`,
              updatedAt: new Date(),
            })
            .where(eq(groups.id, idStr))
            .returning();

          if (!updateResult[0]) {
            throw new Error("Group not found after update");
          }

          return updateResult[0];
        },
        catch: (error) =>
          new DatabaseError({
            operation: "addCoins",
            id: idStr,
            cause: error,
          }),
      });

      return yield* groupMapper.toDomain(result);
    });
  }

  subtractCoins(groupId: GroupId, amount: number) {
    const idStr = GroupId.toString(groupId);
    const self = this;

    return Effect.gen(function* () {
      // First get the group to determine the tripId
      const dbGroup = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.groups.findFirst({
            where: eq(groups.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "subtractCoins",
            id: idStr,
            cause: error,
          }),
      });

      // If group not found, fail with EntityNotFoundError
      if (!dbGroup) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Group", identifier: idStr }),
        );
      }

      // Get AuthContext and verify write permission
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: dbGroup.tripId,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: async () => {
          const updateResult = await self.db
            .update(groups)
            .set({
              coins: sql`${groups.coins} - ${amount}`,
              updatedAt: new Date(),
            })
            .where(eq(groups.id, idStr))
            .returning();

          if (!updateResult[0]) {
            throw new Error("Group not found after update");
          }

          return updateResult[0];
        },
        catch: (error) =>
          new DatabaseError({
            operation: "subtractCoins",
            id: idStr,
            cause: error,
          }),
      });

      return yield* groupMapper.toDomain(result);
    });
  }

  getRanking(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);

    return this.tryPromise(
      "GroupDrizzleGateway.getRanking",
      async () => {
        const results = await this.db.query.groups.findMany({
          where: and(eq(groups.tripId, tripIdStr), eq(groups.isDeleted, false)),
          orderBy: desc(groups.coins),
        });

        const domainGroups: Group[] = [];
        for (const result of results) {
          const group = await Effect.runPromise(groupMapper.toDomain(result));
          domainGroups.push(group);
        }
        return domainGroups;
      },
      tripIdStr,
    );
  }
}
