import type { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory User Repository for Testing
 *
 * Implements UserRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * All methods return Effect.Effect<T, DatabaseError, never> for composable error handling.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryUserRepository();
 * await Effect.runPromise(repo.seed([mockUser]));
 *
 * const found = await Effect.runPromise(repo.findById("user-123"));
 * expect(found).not.toBeNull();
 *
 * await Effect.runPromise(repo.reset()); // Clean up for next test
 * ```
 */
export class InMemoryUserRepository
  extends InMemoryRepository<User>
  implements UserRepository
{
  create(user: User): Effect.Effect<User, never, never> {
    return Effect.sync(() => {
      this.storage.set(user.id, user);
      return user;
    });
  }

  findById(id: string): Effect.Effect<User | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, never, never> {
    return Effect.succeed(
      this.getAllItems().find((u) => u.authUserId === authUserId) ?? null,
    );
  }

  findByRole(role: UserRole): Effect.Effect<User[], never, never> {
    return Effect.succeed(this.getAllItems().filter((u) => u.role === role));
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<User[], never, never> {
    return Effect.gen(this, function* () {
      const users = yield* this.findAllGeneric(options).pipe(Effect.orDie);
      return users;
    });
  }

  update(user: User): Effect.Effect<User, never, never> {
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
