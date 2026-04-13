import type { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory User Repository for Testing
 *
 * Implements UserRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryUserRepository();
 * repo.seed([mockUser]);
 *
 * const found = await Effect.runPromise(repo.findById("user-123"));
 * expect(found).not.toBeNull();
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemoryUserRepository
  extends InMemoryRepository<User>
  implements UserRepository
{
  create(user: User): Effect.Effect<User, never, never> {
    return this.createGeneric(user);
  }

  findById(id: string): Effect.Effect<User | null, never, never> {
    return this.findByIdGeneric(id);
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
    return this.findAllGeneric(options);
  }

  update(user: User): Effect.Effect<User, never, never> {
    return this.updateGeneric(user);
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return this.deleteGeneric(id);
  }

  existsByAuthUserId(authUserId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some((u) => u.authUserId === authUserId),
    );
  }
}
