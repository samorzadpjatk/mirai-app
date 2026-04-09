import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";

/**
 * Generic mapper interface for domain-prisma conversions
 */
export interface EntityMapper<TDomain, TPrisma, TCreateInput, TUpdateInput> {
  toDomain(record: TPrisma): TDomain;
  toPrismaCreate(entity: TDomain): TCreateInput;
  toPrismaUpdate(entity: TDomain): TUpdateInput;
}

/**
 * Prisma model delegate interface (subset of PrismaClient methods)
 */
export interface PrismaModelDelegate<TPrisma, TCreateInput, TUpdateInput> {
  create(args: { data: TCreateInput }): Promise<TPrisma>;
  findUnique(args: { where: Record<string, unknown> }): Promise<TPrisma | null>;
  findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, string>;
    take?: number;
    skip?: number;
  }): Promise<TPrisma[]>;
  update(args: {
    where: Record<string, unknown>;
    data: TUpdateInput;
  }): Promise<TPrisma>;
  delete(args: { where: Record<string, unknown> }): Promise<TPrisma>;
}

/**
 * Configuration for base repository operations
 */
export interface BaseRepositoryConfig<TPrisma, TCreateInput, TUpdateInput> {
  model: PrismaModelDelegate<TPrisma, TCreateInput, TUpdateInput>;
}

/**
 * BasePrismaRepository - Abstract base class for Prisma repository implementations
 *
 * Provides generic CRUD operations to eliminate duplication across repositories.
 * Specific repositories extend this and add custom query methods.
 *
 * @example
 * ```typescript
 * // NEW PATTERN (Preferred - enables dependency injection):
 * class PrismaUserRepository
 *   extends BasePrismaRepository<User, PrismaUser, UserCreateInput, UserUpdateInput>
 *   implements UserRepository
 * {
 *   constructor(prisma: PrismaClient) {
 *     super(prisma, { model: prisma.user }, UserMapper);
 *   }
 *
 *   // Add custom methods
 *   async findByEmail(email: string): Promise<User | null> {
 *     const record = await this.model.findUnique({ where: { email } });
 *     return record ? this.mapper.toDomain(record) : null;
 *   }
 * }
 * ```
 *
 * @deprecated Legacy pattern (super(model, mapper)) is deprecated.
 *             Migrate to new pattern (super(prisma, { model }, mapper))
 *             to break cyclic dependencies between adapters and frameworks.
 */
/**
 * Type guard to check if a value is a PrismaModelDelegate
 */
function isPrismaModelDelegate<TPrisma, TCreateInput, TUpdateInput>(
  value: unknown,
): value is PrismaModelDelegate<TPrisma, TCreateInput, TUpdateInput> {
  return (
    typeof value === "object" &&
    value !== null &&
    "create" in value &&
    typeof (value as Record<string, unknown>).create === "function" &&
    "findUnique" in value &&
    typeof (value as Record<string, unknown>).findUnique === "function"
  );
}

export abstract class BasePrismaRepository<
  TDomain,
  TPrisma,
  TCreateInput,
  TUpdateInput,
> {
  /**
   * The PrismaClient instance for database operations.
   * Protected so subclasses can access it for complex queries.
   */
  protected prisma: PrismaClient;

  /**
   * The model delegate for CRUD operations.
   * @protected
   */
  protected model: PrismaModelDelegate<TPrisma, TCreateInput, TUpdateInput>;

  /**
   * The mapper for domain-prisma conversions.
   * @protected
   */
  protected mapper: EntityMapper<TDomain, TPrisma, TCreateInput, TUpdateInput>;

  /**
   * Constructor supporting both legacy and new patterns:
   *
   * Legacy (deprecated): super(model, mapper)
   * New (preferred): super(prisma, { model }, mapper)
   *
   * The new pattern enables proper dependency injection of PrismaClient,
   * breaking cyclic dependencies between adapters and frameworks.
   */
  constructor(
    arg1:
      | PrismaModelDelegate<TPrisma, TCreateInput, TUpdateInput>
      | PrismaClient,
    arg2:
      | EntityMapper<TDomain, TPrisma, TCreateInput, TUpdateInput>
      | BaseRepositoryConfig<TPrisma, TCreateInput, TUpdateInput>,
    arg3?: EntityMapper<TDomain, TPrisma, TCreateInput, TUpdateInput>,
  ) {
    if (isPrismaModelDelegate<TPrisma, TCreateInput, TUpdateInput>(arg1)) {
      // Legacy pattern: super(model, mapper)
      // PrismaClient will be injected later via _setPrismaClient
      this.model = arg1;
      this.mapper = arg2 as EntityMapper<
        TDomain,
        TPrisma,
        TCreateInput,
        TUpdateInput
      >;
      this.prisma = null as unknown as PrismaClient;
    } else {
      // New pattern: super(prisma, { model }, mapper)
      this.prisma = arg1 as PrismaClient;
      this.model = (
        arg2 as BaseRepositoryConfig<TPrisma, TCreateInput, TUpdateInput>
      ).model;
      this.mapper = arg3 as EntityMapper<
        TDomain,
        TPrisma,
        TCreateInput,
        TUpdateInput
      >;
    }
  }

  /**
   * Internal method to set the PrismaClient when using legacy constructor pattern.
   * Called by subclasses that haven't migrated yet.
   * @internal
   * @deprecated Migrate to new constructor pattern to avoid using this method.
   */
  protected _setPrismaClient(prisma: PrismaClient): void {
    this.prisma = prisma;
  }

  /**
   * Create a new entity
   */
  async create(entity: TDomain): Promise<TDomain> {
    const record = await this.model.create({
      data: this.mapper.toPrismaCreate(entity),
    });
    return this.mapper.toDomain(record);
  }

  /**
   * Find entity by unique field
   */
  async findById(id: string): Promise<TDomain | null> {
    const record = await this.model.findUnique({ where: { id } });
    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find all entities with optional pagination
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: Record<string, string>;
  }): Promise<TDomain[]> {
    const records = await this.model.findMany({
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ?? { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Update an existing entity
   */
  async update(entity: TDomain & { id: string }): Promise<TDomain> {
    const record = await this.model.update({
      where: { id: entity.id },
      data: this.mapper.toPrismaUpdate(entity),
    });
    return this.mapper.toDomain(record);
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: string): Promise<void> {
    await this.model.delete({ where: { id } });
  }

  /**
   * Check if an entity exists
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.model.findUnique({ where: { id } });
    return record !== null;
  }
}
