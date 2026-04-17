import { Effect } from "effect";
import { eq, and, inArray, desc, sql, count } from "drizzle-orm";
import { groups } from "@mirai-app/frameworks/drizzle";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { Group, GroupId, DatabaseError } from "@mirai-app/domain";
import type { IGroupPort } from "@mirai-app/use-cases";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { groupMapper } from "../../mappers/GroupMapper";

/**
 * Group Drizzle Gateway
 *
 * Implements GroupPort using Drizzle ORM for PostgreSQL.
 */
export class GroupDrizzleGateway
  extends BaseDrizzleGateway
  implements IGroupPort
{
  findById(id: string): Effect.Effect<Group | null, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.findById",
      async () => {
        const result = await this.db.query.groups.findFirst({
          where: eq(groups.id, id),
        });
        if (!result) return null;
        return await Effect.runPromise(groupMapper.toDomain(result));
      },
      id,
    );
  }

  findByCode(code: string): Effect.Effect<Group | null, DatabaseError, never> {
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

  findByTripId(tripId: string): Effect.Effect<Group[], DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.findByTripId",
      async () => {
        const results = await this.db.query.groups.findMany({
          where: and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)),
          orderBy: desc(groups.createdAt),
        });

        const domainGroups: Group[] = [];
        for (const result of results) {
          const group = await Effect.runPromise(groupMapper.toDomain(result));
          domainGroups.push(group);
        }
        return domainGroups;
      },
      tripId,
    );
  }

  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { groups: Group[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  > {
    return this.tryPromise(
      "GroupDrizzleGateway.findByTripIdPaginated",
      async () => {
        const [results, totalResult] = await Promise.all([
          this.db.query.groups.findMany({
            where: and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)),
            orderBy: desc(groups.createdAt),
            limit: params.limit,
            offset: params.offset,
          }),
          this.db
            .select({ count: count() })
            .from(groups)
            .where(and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)))
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
      tripId,
    );
  }

  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], DatabaseError, never> {
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

  create(group: Group): Effect.Effect<Group, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.create",
      async () => {
        const insertData = groupMapper.toInsert(group);
        await this.db.insert(groups).values(insertData);
        return group;
      },
      GroupId.toString(group.id),
    );
  }

  update(group: Group): Effect.Effect<Group, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.update",
      async () => {
        const updateData = groupMapper.toUpdate(group);
        await this.db
          .update(groups)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(groups.id, GroupId.toString(group.id)));
        return group;
      },
      GroupId.toString(group.id),
    );
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.delete",
      async () => {
        await this.db.delete(groups).where(eq(groups.id, id));
      },
      id,
    );
  }

  softDelete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.softDelete",
      async () => {
        await this.db
          .update(groups)
          .set({ isDeleted: true, updatedAt: new Date() })
          .where(eq(groups.id, id));
      },
      id,
    );
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.exists",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(groups)
          .where(and(eq(groups.id, id), eq(groups.isDeleted, false)));
        return (result[0]?.count ?? 0) > 0;
      },
      id,
    );
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.countByTripId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(groups)
          .where(and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)));
        return result[0]?.count ?? 0;
      },
      tripId,
    );
  }

  addCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.addCoins",
      async () => {
        const result = await this.db
          .update(groups)
          .set({
            coins: sql`${groups.coins} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(groups.id, groupId))
          .returning();

        if (!result[0]) {
          throw new Error("Group not found after update");
        }

        return await Effect.runPromise(groupMapper.toDomain(result[0]));
      },
      groupId,
    );
  }

  subtractCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.subtractCoins",
      async () => {
        const result = await this.db
          .update(groups)
          .set({
            coins: sql`${groups.coins} - ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(groups.id, groupId))
          .returning();

        if (!result[0]) {
          throw new Error("Group not found after update");
        }

        return await Effect.runPromise(groupMapper.toDomain(result[0]));
      },
      groupId,
    );
  }

  getRanking(tripId: string): Effect.Effect<Group[], DatabaseError, never> {
    return this.tryPromise(
      "GroupDrizzleGateway.getRanking",
      async () => {
        const results = await this.db.query.groups.findMany({
          where: and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)),
          orderBy: desc(groups.coins),
        });

        const domainGroups: Group[] = [];
        for (const result of results) {
          const group = await Effect.runPromise(groupMapper.toDomain(result));
          domainGroups.push(group);
        }
        return domainGroups;
      },
      tripId,
    );
  }
}
