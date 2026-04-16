import type { UserRole, Connection } from "@mirai-app/domain";
import type {
  UserGateway,
  UserDTO,
  UserPaginatedResult,
  UserConnectionArgs,
} from "@mirai-app/use-cases";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { Effect } from "effect";
import {
  InMemoryGateway,
  DatabaseError,
} from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory User Gateway for Testing
 *
 * Implements UserGateway port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * All methods return Effect.Effect<T, DatabaseError, never> for composable error handling.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryUserGateway();
 * await Effect.runPromise(gateway.seed([mockUserDTO]));
 *
 * const found = await Effect.runPromise(gateway.findById("user-123"));
 * expect(found).not.toBeNull();
 *
 * await Effect.runPromise(gateway.reset()); // Clean up for next test
 * ```
 */
export class InMemoryUserGateway
  extends InMemoryGateway<UserDTO>
  implements UserGateway
{
  create(user: UserDTO): Effect.Effect<UserDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(user.id, user);
      return user;
    });
  }

  findById(id: string): Effect.Effect<UserDTO | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<UserDTO | null, never, never> {
    return Effect.succeed(
      this.getAllItems().find((u) => u.authUserId === authUserId) ?? null,
    );
  }

  findByRole(role: UserRole): Effect.Effect<UserDTO[], never, never> {
    return Effect.succeed(this.getAllItems().filter((u) => u.role === role));
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<UserPaginatedResult, never, never> {
    return Effect.gen(this, function* () {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const allItems = this.getAllItems();
      const total = allItems.length;
      const items = allItems.slice(offset, offset + limit);
      const hasMore = offset + items.length < total;

      return {
        items,
        total,
        limit,
        offset,
        hasMore,
      };
    });
  }

  update(user: UserDTO): Effect.Effect<UserDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(user.id, user);
      return user;
    });
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.delete(id);
    });
  }

  existsByAuthUserId(authUserId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some((u) => u.authUserId === authUserId),
    );
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find all users with cursor-based pagination
   * Sorts by createdAt DESC, then id DESC, then slices
   */
  findAllConnection(
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<UserDTO>, never, never> {
    return this.executeConnectionQuery(args, () => true);
  }

  /**
   * Find users by role with cursor-based pagination
   */
  findByRoleConnection(
    role: UserRole,
    args: UserConnectionArgs,
  ): Effect.Effect<Connection<UserDTO>, never, never> {
    return this.executeConnectionQuery(args, (user) => user.role === role);
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Sorts by createdAt DESC, then id DESC, then slices
   */
  private executeConnectionQuery(
    args: UserConnectionArgs,
    filterFn: (user: UserDTO) => boolean,
  ): Effect.Effect<Connection<UserDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all users matching the filter
      let users = this.getAllItems().filter(filterFn);

      // Sort by createdAt DESC, then by id DESC as tiebreaker
      users.sort((a, b) => {
        const timeCompare = b.createdAt.getTime() - a.createdAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return b.id.localeCompare(a.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = users.findIndex(
          (u) =>
            u.createdAt < cursorDate ||
            (u.createdAt.getTime() === cursorDate.getTime() &&
              u.id < cursor.id),
        );
        if (startIndex === -1) {
          startIndex = users.length;
        }
      }

      // Slice to get the page
      const items = users.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < users.length;

      // Build edges with cursors
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }
}
