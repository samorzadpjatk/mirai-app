import type { User, UserRole } from "@mirai-app/domain";
import type { UserRepository, DatabaseError } from "@mirai-app/use-cases";
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
  create(user: User): Effect.Effect<User, DatabaseError, never> {
    return this.createGeneric(user);
  }

  findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().find((u) => u.authUserId === authUserId) ?? null,
    );
  }

  findByRole(role: UserRole): Effect.Effect<User[], DatabaseError, never> {
    return Effect.succeed(this.getAllItems().filter((u) => u.role === role));
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<User[], DatabaseError, never> {
    return this.findAllGeneric(options);
  }

  update(user: User): Effect.Effect<User, DatabaseError, never> {
    return this.updateGeneric(user);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id);
  }

  existsByAuthUserId(
    authUserId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().some((u) => u.authUserId === authUserId),
    );
  }
}
