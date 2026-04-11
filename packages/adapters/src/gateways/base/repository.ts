import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { eq } from "drizzle-orm";
import type { PgTable, TableConfig } from "drizzle-orm/pg-core";

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
  TTable extends PgTable<TableConfig>,
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
 *   async findByAuthId(authUserId: string): Promise<User | null> {
 *     const record = await this.db.query.users.findFirst({
 *       where: eq(users.authUserId, authUserId)
 *     });
 *     return record ? this.mapper.toDomain(record) : null;
 *   }
 * }
 * ```
 */
export abstract class BaseDrizzleRepository<
  TDomain,
  TDrizzle,
  TInsert,
  TTable extends PgTable<TableConfig>,
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
  async create(entity: TDomain): Promise<TDomain> {
    const insertData = this.mapper.toDrizzleInsert(entity);
    const [record] = await this.db
      .insert(this.table)
      .values(insertData)
      .returning();

    if (!record) {
      throw new Error("Failed to create entity: no record returned");
    }

    return this.mapper.toDomain(record as TDrizzle);
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TDomain | null> {
    const tableName = this.getTableName();
    const idColumn = (
      this.table as unknown as Record<string, { name: string }>
    )["id"];

    if (!idColumn) {
      throw new Error(`Table ${tableName} does not have an 'id' column`);
    }

    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(idColumn as never, id))
      .limit(1);

    const record = records[0];
    return record ? this.mapper.toDomain(record as TDrizzle) : null;
  }

  /**
   * Find all entities with optional pagination
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: "asc" | "desc" };
  }): Promise<TDomain[]> {
    let query = this.db.select().from(this.table);

    // Apply ordering (default to createdAt desc)
    const orderColumn = options?.orderBy?.column ?? "createdAt";
    const orderDirection = options?.orderBy?.direction ?? "desc";

    // Get column reference
    const columnRef = (this.table as unknown as Record<string, unknown>)[
      orderColumn
    ];
    if (columnRef) {
      query = query.orderBy(
        orderDirection === "asc" ? (columnRef as never) : (columnRef as never),
      );
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const records = await query;
    return records.map((record) => this.mapper.toDomain(record as TDrizzle));
  }

  /**
   * Update an existing entity
   */
  async update(entity: TDomain & { id: string }): Promise<TDomain> {
    const updateData = this.mapper.toDrizzleUpdate(entity);
    const idColumn = (
      this.table as unknown as Record<string, { name: string }>
    )["id"];

    if (!idColumn) {
      throw new Error("Table does not have an 'id' column");
    }

    const [record] = await this.db
      .update(this.table)
      .set(updateData)
      .where(eq(idColumn as never, entity.id))
      .returning();

    if (!record) {
      throw new Error(
        `Failed to update entity with id ${entity.id}: not found`,
      );
    }

    return this.mapper.toDomain(record as TDrizzle);
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: string): Promise<void> {
    const idColumn = (
      this.table as unknown as Record<string, { name: string }>
    )["id"];

    if (!idColumn) {
      throw new Error("Table does not have an 'id' column");
    }

    await this.db.delete(this.table).where(eq(idColumn as never, id));
  }

  /**
   * Check if an entity exists
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
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
