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
 * NOTE: Migrated from Effect.Effect to Promise per AGENTS.md guidelines.
 * All methods now return Promise<T> instead of Effect.Effect<T>.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryUserRepository();
 * repo.seed([mockUser]);
 *
 * const found = await repo.findById("user-123");
 * expect(found).not.toBeNull();
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemoryUserRepository
  extends InMemoryRepository<User>
  implements UserRepository
{
  async create(user: User): Promise<User> {
    return Effect.runPromise(this.createGeneric(user));
  }

  async findById(id: string): Promise<User | null> {
    return Effect.runPromise(this.findByIdGeneric(id));
  }

  async findByAuthUserId(authUserId: string): Promise<User | null> {
    return this.getAllItems().find((u) => u.authUserId === authUserId) ?? null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.getAllItems().filter((u) => u.role === role);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    return Effect.runPromise(this.findAllGeneric(options));
  }

  async update(user: User): Promise<User> {
    return Effect.runPromise(this.updateGeneric(user));
  }

  async delete(id: string): Promise<void> {
    return Effect.runPromise(this.deleteGeneric(id));
  }

  async existsByAuthUserId(authUserId: string): Promise<boolean> {
    return this.getAllItems().some((u) => u.authUserId === authUserId);
  }

  // Override base methods to provide Promise-based API for testing
  override async seed(items: User[]): Promise<void> {
    return Effect.runPromise(super.seed(items));
  }

  override async reset(): Promise<void> {
    return Effect.runPromise(super.reset());
  }
}
