import type { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryGateway } from "../_shared/in-memory-base";

/**
 * In-Memory User Gateway for Testing
 *
 * Implements UserRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * All methods return Effect.Effect<T, DatabaseError, never> for composable error handling.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryUserGateway();
 * await Effect.runPromise(gateway.seed([mockUser]));
 *
 * const found = await Effect.runPromise(gateway.findById("user-123"));
 * expect(found).not.toBeNull();
 *
 * await Effect.runPromise(gateway.reset()); // Clean up for next test
 * ```
 */
export class InMemoryUserGateway
  extends InMemoryGateway<User>
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
