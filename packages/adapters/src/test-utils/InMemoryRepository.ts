/**
 * Base In-Memory Repository
 *
 * Provides generic CRUD operations for testing.
 * Extended by specific repository implementations.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryUserRepository();
 * repo.seed([mockUser]);
 * const user = await repo.findById("user-123");
 * repo.reset(); // Clear for next test
 * ```
 */
export abstract class InMemoryRepository<T extends { id: string }> {
  protected storage = new Map<string, T>();

  /**
   * Reset the repository - clears all stored data.
   * Call this in beforeEach for test isolation.
   */
  reset(): void {
    this.storage.clear();
  }

  /**
   * Seed the repository with initial data.
   * Useful for setting up test scenarios.
   */
  seed(items: T[]): void {
    items.forEach((item) => this.storage.set(item.id, item));
  }

  /**
   * Get all items as an array.
   */
  protected getAllItems(): T[] {
    return Array.from(this.storage.values());
  }

  /**
   * Generic find by ID.
   */
  protected async findByIdGeneric(id: string): Promise<T | null> {
    return this.storage.get(id) ?? null;
  }

  /**
   * Generic find all with optional pagination.
   */
  protected async findAllGeneric(options?: {
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    let items = this.getAllItems();

    if (options?.offset) {
      items = items.slice(options.offset);
    }

    if (options?.limit !== undefined) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  /**
   * Generic create - stores item by its ID.
   */
  protected async createGeneric(item: T): Promise<T> {
    this.storage.set(item.id, item);
    return item;
  }

  /**
   * Generic update - replaces item by ID.
   */
  protected async updateGeneric(item: T): Promise<T> {
    if (!this.storage.has(item.id)) {
      throw new Error(`Item with id ${item.id} not found`);
    }
    this.storage.set(item.id, item);
    return item;
  }

  /**
   * Generic delete - removes item by ID.
   */
  protected async deleteGeneric(id: string): Promise<void> {
    this.storage.delete(id);
  }

  /**
   * Generic exists check.
   */
  protected async existsGeneric(id: string): Promise<boolean> {
    return this.storage.has(id);
  }

  /**
   * Get the count of stored items.
   */
  protected async countGeneric(): Promise<number> {
    return this.storage.size;
  }
}
