import { Effect } from "effect";
import type { IUserPort } from "@mirai-app/use-cases/user";
import { type User, UserId, AuthUserId } from "@mirai-app/domain";

/**
 * In-Memory User Gateway
 *
 * Implements UserPort using in-memory Map storage for testing.
 * Auth token parameter is accepted but ignored (auth verification happens
 * in real gateways; in-memory gateway is for testing business logic only).
 */
export class InMemoryUserGateway implements IUserPort {
  private users = new Map<string, User>();
  private usersByAuthId = new Map<string, User>();
  private usersByTripId = new Map<string, Set<string>>();

  findById(id: UserId, _authToken?: string) {
    return Effect.sync(() => this.users.get(UserId.toString(id)) ?? null);
  }

  findByAuthUserId(authUserId: string, _authToken?: string) {
    return Effect.sync(() => this.usersByAuthId.get(authUserId) ?? null);
  }

  findByTripId(tripId: string, _authToken?: string) {
    return Effect.sync(() => {
      const userIds = this.usersByTripId.get(tripId);
      if (!userIds) return [];

      const result: User[] = [];
      for (const userId of userIds) {
        const user = this.users.get(userId);
        if (user) {
          result.push(user);
        }
      }
      return result;
    });
  }

  findAllPaginated(
    params: { limit: number; offset: number },
    _authToken?: string,
  ) {
    return Effect.sync(() => {
      const allUsers = Array.from(this.users.values());
      return allUsers.slice(params.offset, params.offset + params.limit);
    });
  }

  findAll(_authToken?: string) {
    return Effect.sync(() => {
      return Array.from(this.users.values());
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
    _authToken?: string,
  ) {
    return Effect.sync(() => {
      const userIds = this.usersByTripId.get(params.tripId);
      if (!userIds) {
        return { users: [], total: 0, hasMore: false };
      }

      let tripUsers: User[] = [];
      for (const userId of userIds) {
        const user = this.users.get(userId);
        if (user) {
          tripUsers.push(user);
        }
      }

      if (params.searchTerm) {
        const searchLower = params.searchTerm.toLowerCase();
        tripUsers = tripUsers.filter(
          (user) =>
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower),
        );
      }

      const total = tripUsers.length;
      const paginatedUsers = tripUsers.slice(
        params.offset,
        params.offset + params.limit,
      );

      return {
        users: paginatedUsers,
        total,
        hasMore: params.offset + paginatedUsers.length < total,
      };
    });
  }

  create(user: User, _authToken?: string) {
    return Effect.sync(() => {
      this.users.set(UserId.toString(user.id), user);
      this.usersByAuthId.set(AuthUserId.toString(user.authUserId), user);
      return user;
    });
  }

  update(user: User, _authToken?: string) {
    return Effect.sync(() => {
      const existing = this.users.get(UserId.toString(user.id));
      if (existing) {
        this.usersByAuthId.delete(AuthUserId.toString(existing.authUserId));
      }
      this.users.set(UserId.toString(user.id), user);
      this.usersByAuthId.set(AuthUserId.toString(user.authUserId), user);
      return user;
    });
  }

  delete(id: UserId, _authToken?: string) {
    return Effect.sync(() => {
      const user = this.users.get(UserId.toString(id));
      if (user) {
        this.usersByAuthId.delete(AuthUserId.toString(user.authUserId));
      }
      this.users.delete(UserId.toString(id));
    });
  }

  exists(id: UserId, _authToken?: string) {
    return Effect.sync(() => this.users.has(UserId.toString(id)));
  }

  count(_authToken?: string) {
    return Effect.sync(() => this.users.size);
  }

  // Helper method for testing - associate user with trip
  associateWithTrip(userId: string, tripId: string): void {
    const tripUserIds = this.usersByTripId.get(tripId) ?? new Set<string>();
    tripUserIds.add(userId);
    this.usersByTripId.set(tripId, tripUserIds);
  }

  // Helper method for testing - clear all data
  clear(): void {
    this.users.clear();
    this.usersByAuthId.clear();
    this.usersByTripId.clear();
  }
}
