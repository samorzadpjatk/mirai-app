import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Generic mapper interface for domain-drizzle conversions
 */
export interface DrizzleEntityMapper<
  TDomain,
  TDrizzle,
  TInsert,
  TInsertPartial = Partial<TInsert>,
> {
  toDomain(record: TDrizzle): TDomain;
  toDrizzleInsert(entity: TDomain): TInsert;
  toDrizzleUpdate(entity: TDomain): TInsertPartial;
}

/**
 * Configuration for base repository operations
 */
export interface DrizzleRepositoryConfig<
  TDomain,
  TDrizzle,
  TInsert,
  TTable extends PgTable,
  TInsertPartial = Partial<TInsert>,
> {
  table: TTable;
  mapper: DrizzleEntityMapper<TDomain, TDrizzle, TInsert, TInsertPartial>;
}

/**
 * BaseDrizzleRepository - Abstract base class for Drizzle repository implementations
 *
 * Provides generic CRUD operations to eliminate duplication across repositories.
 * Specific repositories extend this and add custom query methods.
 *
 * Migration Strategy:
 * - Extends same interface as Prisma repositories for drop-in replacement
 * - Dual-ORM coexistence: Run both side-by-side, return Prisma data initially
 * - Gradual migration: Switch reads, then writes, per entity
 * - Zero-downtime rollback: DI container reconfiguration
 *
 * All methods use Effect.tryPromise for error handling (Step 4.3).
 *
 * @example
 * ```typescript
 * class DrizzleUserRepository
 *   extends BaseDrizzleRepository<User, UserSelect, UserInsert, typeof users>
 *   implements UserRepository
 * {
 *   constructor(db: DrizzleDb) {
 *     super(db, { table: users, mapper: UserDrizzleMapper });
 *   }
 *
 *   // Add custom methods
 *   findByAuthId(authUserId: string): Effect<User | null, DatabaseError, never> {
 *     return Effect.tryPromise({
 *       try: () => this.db.query.users.findFirst({
 *         where: eq(users.authUserId, authUserId)
 *       }),
 *       catch: () => new DatabaseError("findByAuthId", "Failed to find user"),
 *     }).pipe(Effect.map((r) => r ? this.mapper.toDomain(r) : null));
 *   }
 * }
 * ```
 */
export abstract class BaseDrizzleRepository<
  TDomain,
  TDrizzle,
  TInsert,
  TTable extends PgTable,
  TInsertPartial = Partial<TInsert>,
> {
  /**
   * The Drizzle database client for operations.
   * Protected so subclasses can access it for complex queries.
   */
  protected db: DrizzleDb;

  /**
   * The Drizzle table definition.
   * @protected
   */
  protected table: TTable;

  /**
   * The mapper for domain-drizzle conversions.
   * @protected
   */
  protected mapper: DrizzleEntityMapper<
    TDomain,
    TDrizzle,
    TInsert,
    TInsertPartial
  >;

  /**
   * Constructor for Drizzle repository
   *
   * @param db - Drizzle database client
   * @param config - Repository configuration with table and mapper
   */
  constructor(
    db: DrizzleDb,
    config: DrizzleRepositoryConfig<
      TDomain,
      TDrizzle,
      TInsert,
      TTable,
      TInsertPartial
    >,
  ) {
    this.db = db;
    this.table = config.table;
    this.mapper = config.mapper;
  }

  /**
   * Create a new entity
   */
  create(entity: TDomain): Effect.Effect<TDomain, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData = this.mapper.toDrizzleInsert(entity);
        const [record] = await (this.db as any)
          .insert(this.table)
          .values(insertData)
          .returning();

        if (!record) {
          throw new Error("Failed to create entity: no record returned");
        }

        return this.mapper.toDomain(record as TDrizzle);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create entity",
          cause: error,
        }),
    });
  }

  /**
   * Find entity by ID
   */
  findById(id: string): Effect.Effect<TDomain | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const tableName = this.getTableName();
        const idColumn = (
          this.table as unknown as Record<string, { name: string }>
        )["id"];

        if (!idColumn) {
          throw new Error(`Table ${tableName} does not have an 'id' column`);
        }

        const records = await (this.db as any)
          .select()
          .from(this.table)
          .where(eq(idColumn as any, id))
          .limit(1);

        const record = records[0];
        return record ? this.mapper.toDomain(record as TDrizzle) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: "Failed to find entity",
          cause: error,
        }),
    });
  }

  /**
   * Find all entities with optional pagination
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(options?: any): Effect.Effect<TDomain[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (this.db as any).select().from(this.table);

        // Apply ordering (default to createdAt desc)
        const orderColumn = options?.orderBy?.column ?? "createdAt";
        const orderDirection = options?.orderBy?.direction ?? "desc";

        // Get column reference
        const columnRef = (this.table as unknown as Record<string, unknown>)[
          orderColumn
        ];
        if (columnRef) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query = query.orderBy(columnRef as any);
        }

        // Apply pagination
        if (options?.limit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query = (query as any).limit(options.limit);
        }
        if (options?.offset) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query = (query as any).offset(options.offset);
        }

        const records = await query;
        return (records as unknown[]).map((record) =>
          this.mapper.toDomain(record as TDrizzle),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find entities",
          cause: error,
        }),
    });
  }

  /**
   * Update an existing entity
   */
  update(
    entity: TDomain & { id: string },
  ): Effect.Effect<TDomain, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const updateData = this.mapper.toDrizzleUpdate(entity);
        const idColumn = (
          this.table as unknown as Record<string, { name: string }>
        )["id"];

        if (!idColumn) {
          throw new Error("Table does not have an 'id' column");
        }

        const [record] = await (this.db as any)
          .update(this.table)
          .set(updateData)
          .where(eq(idColumn as any, entity.id))
          .returning();

        if (!record) {
          throw new Error(
            `Failed to update entity with id ${entity.id}: not found`,
          );
        }

        return this.mapper.toDomain(record as TDrizzle);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "update",
          message: `Failed to update entity with id ${entity.id}`,
          cause: error,
        }),
    });
  }

  /**
   * Delete an entity by ID
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const idColumn = (
          this.table as unknown as Record<string, { name: string }>
        )["id"];

        if (!idColumn) {
          throw new Error("Table does not have an 'id' column");
        }

        await (this.db as any)
          .delete(this.table)
          .where(eq(idColumn as any, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          message: `Failed to delete entity with id ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Check if an entity exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const record = await this.findById(id);
        return record !== null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "exists",
          message: "Failed to check entity existence",
          cause: error,
        }),
    });
  }

  /**
   * Get the table name for error messages
   *
   * Note: This is a simplified version. In production, you might want to
   * pass the table name explicitly in the constructor config.
   */
  private getTableName(): string {
    // The table name is typically stored in the table object's name property
    // or can be inferred from the table definition
    const tableWithName = this.table as unknown as { name?: string };
    return tableWithName.name ?? "unknown";
  }
}
