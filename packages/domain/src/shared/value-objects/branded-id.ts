/**
 * Branded ID type - prevents mixing IDs across different aggregates
 * Usage: type UserId = BrandedId<"UserId">;
 */
export type BrandedId<Brand extends string> = string & {
  readonly __brand: Brand;
};

/**
 * Branded ID factory configuration
 */
interface BrandedIdConfig {
  validate?: (value: string) => boolean;
}

/**
 * Creates a branded ID factory with validation support
 *
 * @param brand - The brand name for type safety
 * @param config - Optional validation configuration
 * @returns Factory object for creating and validating branded IDs
 *
 * @example
 * ```ts
 * export const UserId = createBrandedId("UserId", { validate: isValidUUID });
 * export type UserId = BrandedId<"UserId">;
 *
 * const id = UserId.create("valid-uuid-string"); // Validates and returns UserId
 * const id2 = UserId.unsafeCreate("any-string"); // No validation
 * const id3 = UserId.generate(); // New random UUID
 * const same = UserId.equals(id, id2); // Boolean comparison
 * const str = UserId.toString(id); // Convert to string
 * ```
 */
export function createBrandedId<Brand extends string>(
  brand: Brand,
  config: BrandedIdConfig = {},
) {
  const { validate } = config;

  return {
    /**
     * Create a branded ID with validation
     * @throws {Error} if validation fails
     */
    create(value: string): BrandedId<Brand> {
      if (validate && !validate(value)) {
        throw new Error(`Invalid ${brand}: ${value}`);
      }
      return value as BrandedId<Brand>;
    },

    /**
     * Create a branded ID without validation
     * Use when you trust the source (e.g., database)
     */
    unsafeCreate(value: string): BrandedId<Brand> {
      return value as BrandedId<Brand>;
    },

    /**
     * Generate a new random UUID as branded ID
     * Note: This is a convenience method but domain entities should receive
     * IDs from outside to maintain purity
     */
    generate(): BrandedId<Brand> {
      return crypto.randomUUID() as BrandedId<Brand>;
    },

    /**
     * Check if two branded IDs are equal
     */
    equals(a: BrandedId<Brand>, b: BrandedId<Brand>): boolean {
      return a === b;
    },

    /**
     * Convert branded ID to plain string
     */
    toString(id: BrandedId<Brand>): string {
      return id as string;
    },
  };
}

/**
 * UUID validation regex
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * CUID validation regex (simplified)
 */
const CUID_REGEX = /^[a-z0-9]{25}$/i;

/**
 * Validates if a string is a valid CUID
 */
export function isValidCUID(value: string): boolean {
  return CUID_REGEX.test(value);
}

/**
 * Generic ID validator that accepts UUID or CUID
 */
export function isValidId(value: string): boolean {
  return isValidUUID(value) || isValidCUID(value);
}
