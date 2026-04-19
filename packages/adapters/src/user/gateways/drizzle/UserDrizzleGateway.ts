import { Effect } from "effect";
import { eq, and, sql, count } from "drizzle-orm";
import type { IUserPort } from "@mirai-app/use-cases/user";
import {
  type User,
  UserId,
  type IAuthZPort,
  type AccessCheckRequest,
  type ResourceType,
  type PermissionLevel,
  type Role,
  type TripRole,
  PermissionDeniedError,
  EntityNotFoundError,
} from "@mirai-app/domain";
import { users, tripParticipants } from "../../../infrastructure/drizzle";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { userMapper } from "../../mappers/UserMapper";

/**
 * User Drizzle Gateway
 *
 * Implements UserPort using Drizzle ORM for database operations.
 * Also implements IAuthZPort for authorization checks using AuthContext.
 */
export class UserDrizzleGateway
  extends BaseDrizzleGateway
  implements IUserPort, IAuthZPort
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

  findAll() {
    return this.tryPromise("UserDrizzleGateway.findAll", async () => {
      const results = await this.db.query.users.findMany({
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

  findAllPaginated(
    params: { limit: number; offset: number },
  ) {
    return this.tryPromise("UserDrizzleGateway.findAllPaginated", async () => {
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

  search(
    params: {
      tripId: string;
      field: string;
      searchTerm?: string;
      limit: number;
      offset: number;
    },
  ) {
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

  /**
   * IAuthZPort Implementation
   *
   * Authorization checks using role-based access control (RBAC).
   * Uses AuthContext data (userId, role, tripRoles) for clean separation
   * between AuthN (authentication) and AuthZ (authorization).
   */

  /**
   * Verify access to a resource with role-based authorization
   *
   * Validates the user's role and checks if they have the required permissions
   * for the specified resource. Uses AuthContext data which assumes authentication
   * has already been performed.
   *
   * For trip resources, checks tripRoles map from AuthContext first, then falls back
   * to querying the trip_participants table.
   *
   * SECURITY: No token handling here - AuthContext data is safe to log.
   */
  verifyAccess(request: AccessCheckRequest) {
    // Use AuthContext data directly - no token extraction needed
    const { userId, role, tripRoles } = request;

    // For trip resources, check trip-specific role first
    if (request.resourceType === "trip") {
      // Check if user has a trip-specific role in AuthContext
      const tripRole = tripRoles[request.resourceId];

      if (tripRole) {
        // Map trip role to system role and check permission
        const systemRole = this.mapTripRoleToSystemRole(tripRole);
        return this.checkRolePermission(
          userId,
          systemRole,
          tripRoles,
          request.resourceType,
          request.resourceId,
          request.requiredPermission,
        ).pipe(
          Effect.flatMap((hasPermission) => {
            if (!hasPermission) {
              return Effect.fail(
                new PermissionDeniedError({
                  requiredPermission: request.requiredPermission,
                  resourceType: request.resourceType,
                  resourceId: request.resourceId,
                  userId,
                }),
              );
            }
            return Effect.succeed(void 0);
          }),
        );
      }

      // Fallback: query trip_participants table
      return Effect.tryPromise({
        try: () =>
          this.db.query.tripParticipants.findFirst({
            where: and(
              eq(tripParticipants.tripId, request.resourceId),
              eq(tripParticipants.userId, userId),
            ),
          }),
        catch: (error) =>
          new EntityNotFoundError({
            entityType: "TripParticipant",
            identifier: `${request.resourceId}:${userId}`,
          }),
      }).pipe(
        Effect.flatMap((participant) => {
          if (!participant) {
            return Effect.fail(
              new PermissionDeniedError({
                requiredPermission: request.requiredPermission,
                resourceType: request.resourceType,
                  resourceId: request.resourceId,
                userId,
              }),
            );
          }

          // Map trip participant role to system Role type
          const userRole = this.mapTripRoleToSystemRole(participant.role);

          // Check if role has required permission
          return this.checkRolePermission(
            userId,
            userRole,
            tripRoles,
            request.resourceType,
            request.resourceId,
            request.requiredPermission,
          ).pipe(
            Effect.flatMap((hasPermission) => {
              if (!hasPermission) {
                return Effect.fail(
                  new PermissionDeniedError({
                    requiredPermission: request.requiredPermission,
                    resourceType: request.resourceType,
                  resourceId: request.resourceId,
                    userId,
                  }),
                );
              }
              return Effect.succeed(void 0);
            }),
          );
        }),
      );
    }

    // For non-trip resources, use global role from AuthContext
    return this.checkRolePermission(
      userId,
      role,
      tripRoles,
      request.resourceType,
      request.resourceId,
      request.requiredPermission,
    ).pipe(
      Effect.flatMap((hasPermission) => {
        if (!hasPermission) {
          return Effect.fail(
            new PermissionDeniedError({
              requiredPermission: request.requiredPermission,
              resourceType: request.resourceType,
                  resourceId: request.resourceId,
              userId,
            }),
          );
        }
        return Effect.succeed(void 0);
      }),
    );
  }

  /**
   * Check if a user with a specific role has permission for an operation
   *
   * Role hierarchy consideration:
   * - ADMIN: Has all permissions implicitly
   * - MODERATOR: Has read/write permissions, limited admin access
   * - USER: Standard permissions, resource ownership required for some operations
   * - SERVICE: System-level operations only
   *
   * @param _userId - User ID (for logging/tracking, not used in role checks)
   * @param role - User's global role
   * @param _tripRoles - Map of tripId to user's trip-specific role (for trip-scoped checks)
   * @param _resourceType - Type of resource being accessed
   * @param _resourceId - Resource ID being accessed
   * @param requiredPermission - Required permission level
   */
  checkRolePermission(
    _userId: string,
    role: Role,
    _tripRoles: Record<string, TripRole>,
    _resourceType: ResourceType,
    _resourceId: string,
    requiredPermission: PermissionLevel,
  ) {
    // Role hierarchy: ADMIN has all permissions
    if (role === "ADMIN") {
      return Effect.succeed(true);
    }

    // MODERATOR has read and write permissions
    if (role === "MODERATOR") {
      const allowed = requiredPermission === "read" || requiredPermission === "write";
      return Effect.succeed(allowed);
    }

    // SERVICE role has limited permissions - only read for most resources
    if (role === "SERVICE") {
      const allowed = requiredPermission === "read";
      return Effect.succeed(allowed);
    }

    // USER role - read allowed, write/admin requires ownership check
    if (role === "USER") {
      const allowed = requiredPermission === "read";
      return Effect.succeed(allowed);
    }

    // Unknown role - deny access
    return Effect.succeed(false);
  }

  /**
   * Map trip participant role to system Role type
   *
   * tripParticipants.role can be: MEMBER, ORGANIZER, LEAD, etc.
   * System Role is: USER, ADMIN, MODERATOR, SERVICE
   *
   * @param tripRole - The trip-specific role (from AuthContext or trip_participants)
   * @returns The corresponding system Role
   */
  private mapTripRoleToSystemRole(tripRole: string): Role {
    switch (tripRole.toUpperCase()) {
      case "LEAD":
      case "LEADER":
      case "ORGANIZER":
        return "MODERATOR";
      case "ADMIN":
        return "ADMIN";
      case "SERVICE":
        return "SERVICE";
      case "MEMBER":
      default:
        return "USER";
    }
  }
}
