import type { UserRole } from "@mirai-app/domain";
import type {
  UserGateway,
  UserDTO,
  UserPaginatedResult,
} from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

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
}
