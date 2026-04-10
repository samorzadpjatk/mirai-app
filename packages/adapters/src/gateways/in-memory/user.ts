import type { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/use-cases";
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
    return this.createGeneric(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.findByIdGeneric(id);
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
    return this.findAllGeneric(options);
  }

  async update(user: User): Promise<User> {
    return this.updateGeneric(user);
  }

  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  async existsByAuthUserId(authUserId: string): Promise<boolean> {
    return this.getAllItems().some((u) => u.authUserId === authUserId);
  }
}
