import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { eq, sql, desc, asc } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Generic mapper interface for domain-drizzle conversions
 *
 * Supports both domain entity mapping (toDomain) and DTO mapping (toDTO).
 * At least one of toDomain or toDTO must be implemented.
 */
export interface DrizzleEntityMapper<
  TDomain,
  TDrizzle,
  TInsert,
  TInsertPartial = Partial<TInsert>,
> {
  /** Convert to domain entity (optional for DTO-only mappers) */
  toDomain?(record: TDrizzle): TDomain;
  /** Convert to DTO (required) */
  toDTO(record: TDrizzle): TDomain;
  toDrizzleInsert(entity: TDomain): TInsert;
  toDrizzleUpdate(entity: TDomain): TInsertPartial;
}

/**
 * Configuration for base gateway operations
 */
export interface DrizzleGatewayConfig<
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
 * BaseDrizzleGateway - Abstract base class for Drizzle gateway implementations
 *
 * Provides generic CRUD operations to eliminate duplication across gateways.
 * Specific gateways extend this and add custom query methods.
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
 * class DrizzleUserGateway
 *   extends BaseDrizzleGateway<User, UserSelect, UserInsert, typeof users>
 *   implements UserGateway
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
export abstract class BaseDrizzleGateway<
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
   * Constructor for Drizzle gateway
   *
   * @param db - Drizzle database client
   * @param config - Gateway configuration with table and mapper
   */
  constructor(
    db: DrizzleDb,
    config: DrizzleGatewayConfig<
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
        const [record] = await this.db
          .insert(this.table)
          .values(insertData)
          .returning();

        if (!record) {
          throw new Error("Failed to create entity: no record returned");
        }

        // Use toDomain if available, otherwise use toDTO
        return this.mapper.toDomain
          ? this.mapper.toDomain(record as TDrizzle)
          : this.mapper.toDTO(record as TDrizzle);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: `Failed to create entity in ${this.getTableName()}`,
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
        const idColumn = this.table["id"];

        if (!idColumn) {
          throw new Error(`Table ${tableName} does not have an 'id' column`);
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(idColumn, id))
          .limit(1);

        const record = records[0];
        if (!record) return null;
        // Use toDomain if available, otherwise use toDTO
        return this.mapper.toDomain
          ? this.mapper.toDomain(record as TDrizzle)
          : this.mapper.toDTO(record as TDrizzle);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: `Failed to find entity by id ${id} in ${this.getTableName()}`,
          cause: error,
        }),
    });
  }

  /**
   * Find all entities with pagination
   *
   * Returns a paginated result with items, total count, and pagination metadata.
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: "asc" | "desc" };
  }): Effect.Effect<
    {
      items: TDomain[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table);
        const total = countResult?.count ?? 0;

        // Build query
        let query = this.db.select().from(this.table);

        // Apply ordering (default to createdAt desc)
        const orderColumn = options?.orderBy?.column ?? "createdAt";
        const orderDirection = options?.orderBy?.direction ?? "desc";

        // Get column reference
        const columnRef = this.table[orderColumn];
        if (columnRef) {
          query = query.orderBy(
            orderDirection === "desc" ? desc(columnRef) : asc(columnRef),
          );
        }

        // Apply pagination
        if (limit) {
          query = query.limit(limit);
        }
        if (offset) {
          query = query.offset(offset);
        }

        const records = await query;
        const items = records.map((record) =>
          this.mapper.toDomain
            ? this.mapper.toDomain(record as TDrizzle)
            : this.mapper.toDTO(record as TDrizzle),
        );

        const hasMore = items.length === limit && offset + items.length < total;

        return {
          items,
          total,
          limit,
          offset,
          hasMore,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: `Failed to find entities in ${this.getTableName()}`,
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
        const idColumn = this.table["id"];

        if (!idColumn) {
          throw new Error("Table does not have an 'id' column");
        }

        const [record] = await this.db
          .update(this.table)
          .set(updateData)
          .where(eq(idColumn, entity.id))
          .returning();

        if (!record) {
          throw new Error(
            `Failed to update entity with id ${entity.id}: not found`,
          );
        }

        // Use toDomain if available, otherwise use toDTO
        return this.mapper.toDomain
          ? this.mapper.toDomain(record as TDrizzle)
          : this.mapper.toDTO(record as TDrizzle);
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
        const idColumn = this.table["id"];

        if (!idColumn) {
          throw new Error("Table does not have an 'id' column");
        }

        await this.db.delete(this.table).where(eq(idColumn, id));
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
    const self = this;
    return Effect.gen(function* () {
      const record = yield* self.findById(id).pipe(
        Effect.mapError(
          (error) =>
            new DatabaseError({
              operation: "exists",
              message: "Failed to check entity existence",
              cause: error,
            }),
        ),
      );
      return record !== null;
    });
  }

  /**
   * Get the table name for error messages
   *
   * Note: This is a simplified version. In production, you might want to
   * pass the table name explicitly in the constructor config.
   */
  private getTableName(): string {
    return this.table.name ?? "unknown";
  }
}
