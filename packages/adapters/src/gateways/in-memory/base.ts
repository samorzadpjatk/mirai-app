import { Effect, Data } from "effect";

/**
 * DatabaseError for base repository operations
 * Uses Effect's Data.TaggedError pattern for type-safe error handling
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "DATABASE_ERROR" as const;
}

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
 * const found = await Effect.runPromise(repo.findById("user-123"));
 * repo.reset(); // Clear for next test
 * ```
 */
export abstract class InMemoryRepository<T extends { id: string }> {
  protected storage = new Map<string, T>();

  /**
   * Reconstruct an entity from plain object storage.
   * Subclasses should override this to ensure entities are proper class instances
   * with all methods available. Default returns plain object as-is.
   */
  protected reconstruct(
    plain: unknown,
  ): Effect.Effect<T, DatabaseError, never> {
    return Effect.succeed(plain as T);
  }

  reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.clear();
    });
  }

  seed(items: T[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.storage.set(item.id, item));
    });
  }

  protected getAllItems(): T[] {
    return Array.from(this.storage.values());
  }

  /**
   * Get all items as reconstructed entities.
   * Use this when you need proper entity instances with methods.
   */
  protected getAllItemsReconstructed(): Effect.Effect<
    T[],
    DatabaseError,
    never
  > {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const reconstructed: T[] = [];
      for (const plain of plains) {
        const entity = yield* this.reconstruct(plain);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  protected findByIdGeneric(
    id: string,
  ): Effect.Effect<T | null, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const plain = this.storage.get(id);
      if (!plain) return null;
      return yield* this.reconstruct(plain);
    });
  }

  protected findAllGeneric(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<T[], DatabaseError, never> {
    return Effect.gen(this, function* () {
      let items = yield* this.getAllItemsReconstructed();

      if (options?.offset) {
        items = items.slice(options.offset);
      }

      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      return items;
    });
  }

  protected createGeneric(item: T): Effect.Effect<T, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.set(item.id, item);
      return item;
    });
  }

  protected updateGeneric(item: T): Effect.Effect<T, DatabaseError, never> {
    return Effect.gen(
      function* () {
        if (!this.storage.has(item.id)) {
          return yield* Effect.fail(
            new DatabaseError({
              operation: "updateGeneric",
              message: `Item with id ${item.id} not found`,
            }),
          );
        }
        this.storage.set(item.id, item);
        return yield* Effect.succeed(item);
      }.bind(this),
    );
  }

  protected deleteGeneric(
    id: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.delete(id);
    });
  }

  protected existsGeneric(
    id: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(this.storage.has(id));
  }

  protected countGeneric(): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(this.storage.size);
  }
}
