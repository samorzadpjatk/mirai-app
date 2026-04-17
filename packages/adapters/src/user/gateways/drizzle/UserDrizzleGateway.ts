import { Effect } from "effect";
import { eq, and, sql, count } from "drizzle-orm";
import type { IUserPort } from "@mirai-app/use-cases/user";
import { User, UserId, AuthUserId, DatabaseError } from "@mirai-app/domain";
import { users, tripParticipants } from "@mirai-app/frameworks/drizzle";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { userMapper } from "../../mappers/UserMapper";

/**
 * User Drizzle Gateway
 *
 * Implements UserPort using Drizzle ORM for database operations.
 */
export class UserDrizzleGateway
  extends BaseDrizzleGateway
  implements IUserPort
{
  findById(id: UserId) {
    return this.tryPromise(
      "UserDrizzleGateway.findById",
      async () => {
        const result = await this.db.query.users.findFirst({
          where: eq(users.id, UserId.toString(id)),
        });
        if (!result) return null;
        return await Effect.runPromise(userMapper.toDomain(result));
      },
      UserId.toString(id),
    );
  }

  findByAuthUserId(authUserId: string) {
    return this.tryPromise(
      "UserDrizzleGateway.findByAuthUserId",
      async () => {
        const result = await this.db.query.users.findFirst({
          where: eq(users.authUserId, authUserId),
        });
        if (!result) return null;
        return await Effect.runPromise(userMapper.toDomain(result));
      },
      authUserId,
    );
  }

  findByTripId(tripId: string) {
    return this.tryPromise(
      "UserDrizzleGateway.findByTripId",
      async () => {
        const results = await this.db
          .select({
            id: users.id,
            authUserId: users.authUserId,
            firstName: users.firstName,
            lastName: users.lastName,
            hasAvatar: users.hasAvatar,
            role: users.role,
            lastSeenOn: users.lastSeenOn,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .innerJoin(tripParticipants, eq(users.id, tripParticipants.userId))
          .where(eq(tripParticipants.tripId, tripId));

        const domainUsers: User[] = [];
        for (const result of results) {
          const user = await Effect.runPromise(userMapper.toDomain(result));
          domainUsers.push(user);
        }
        return domainUsers;
      },
      tripId,
    );
  }

  findAll(params: { limit: number; offset: number }) {
    return this.tryPromise("UserDrizzleGateway.findAll", async () => {
      const results = await this.db.query.users.findMany({
        limit: params.limit,
        offset: params.offset,
        orderBy: (usersTable) => [usersTable.createdAt],
      });

      const domainUsers: User[] = [];
      for (const result of results) {
        const user = await Effect.runPromise(userMapper.toDomain(result));
        domainUsers.push(user);
      }
      return domainUsers;
    });
  }

  search(params: {
    tripId: string;
    field: string;
    searchTerm?: string;
    limit: number;
    offset: number;
  }) {
    return this.tryPromise(
      "UserDrizzleGateway.search",
      async () => {
        const baseQuery = this.db
          .select({
            id: users.id,
            authUserId: users.authUserId,
            firstName: users.firstName,
            lastName: users.lastName,
            hasAvatar: users.hasAvatar,
            role: users.role,
            lastSeenOn: users.lastSeenOn,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .innerJoin(tripParticipants, eq(users.id, tripParticipants.userId))
          .where(eq(tripParticipants.tripId, params.tripId));

        let results;
        if (params.searchTerm) {
          const searchPattern = `%${params.searchTerm}%`;
          results = await this.db
            .select({
              id: users.id,
              authUserId: users.authUserId,
              firstName: users.firstName,
              lastName: users.lastName,
              hasAvatar: users.hasAvatar,
              role: users.role,
              lastSeenOn: users.lastSeenOn,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt,
            })
            .from(users)
            .innerJoin(tripParticipants, eq(users.id, tripParticipants.userId))
            .where(
              and(
                eq(tripParticipants.tripId, params.tripId),
                sql`(${users.firstName} ILIKE ${searchPattern} OR ${users.lastName} ILIKE ${searchPattern})`,
              ),
            )
            .limit(params.limit)
            .offset(params.offset);
        } else {
          results = await baseQuery.limit(params.limit).offset(params.offset);
        }

        const totalResult = await this.db
          .select({ count: count() })
          .from(users)
          .innerJoin(tripParticipants, eq(users.id, tripParticipants.userId))
          .where(eq(tripParticipants.tripId, params.tripId));

        const total = totalResult[0]?.count ?? 0;

        const domainUsers: User[] = [];
        for (const result of results) {
          const user = await Effect.runPromise(userMapper.toDomain(result));
          domainUsers.push(user);
        }

        return {
          users: domainUsers,
          total,
          hasMore: params.offset + domainUsers.length < total,
        };
      },
      params.tripId,
    );
  }

  create(user: User) {
    return this.tryPromise(
      "UserDrizzleGateway.create",
      async () => {
        const insertData = userMapper.toInsert(user);
        await this.db.insert(users).values(insertData);
        return user;
      },
      UserId.toString(user.id),
    );
  }

  update(user: User) {
    return this.tryPromise(
      "UserDrizzleGateway.update",
      async () => {
        const updateData = userMapper.toUpdate(user);
        await this.db
          .update(users)
          .set(updateData)
          .where(eq(users.id, UserId.toString(user.id)));
        return user;
      },
      UserId.toString(user.id),
    );
  }

  delete(id: UserId) {
    return this.tryPromise(
      "UserDrizzleGateway.delete",
      async () => {
        await this.db.delete(users).where(eq(users.id, UserId.toString(id)));
      },
      UserId.toString(id),
    );
  }

  exists(id: UserId) {
    return this.tryPromise(
      "UserDrizzleGateway.exists",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(users)
          .where(eq(users.id, UserId.toString(id)));
        return (result[0]?.count ?? 0) > 0;
      },
      UserId.toString(id),
    );
  }

  count() {
    return this.tryPromise("UserDrizzleGateway.count", async () => {
      const result = await this.db.select({ count: count() }).from(users);
      return result[0]?.count ?? 0;
    });
  }
}
