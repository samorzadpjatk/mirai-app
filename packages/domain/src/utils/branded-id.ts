/**
 * Branded ID Factory - Generic utility for creating type-safe branded identifiers
 *
 * Eliminates duplication across ID value objects by providing a configurable
 * factory that maintains full type safety and the same API.
 *
 * @example
 * ```typescript
 * // UUID-based ID
 * export const UserId = createBrandedId("UserId", { validate: isValidUUID });
 * export type UserId = BrandedId<"UserId">;
 *
 * // CUID-based ID
 * export const ChallengeId = createBrandedId("ChallengeId", { validate: isValidCUID });
 * export type ChallengeId = BrandedId<"ChallengeId">;
 *
 * // Simple non-empty check
 * export const SponsorId = createBrandedId("SponsorId", { validate: (id) => id?.trim() !== "" });
 * export type SponsorId = BrandedId<"SponsorId">;
 * ```
 */

/**
 * Branded string type with nominal typing
 */
export type BrandedId<Brand extends string> = string & {
  readonly __brand: Brand;
};

/**
 * Validation function type
 */
type Validator = (id: string) => boolean;

/**
 * Factory functions returned by createBrandedId
 */
export interface BrandedIdFactory<Brand extends string> {
  /** Create with validation */
  create(id: string): BrandedId<Brand>;
  /** Create without validation */
  unsafeCreate(id: string): BrandedId<Brand>;
  /** Generate new random ID */
  generate(): BrandedId<Brand>;
  /** Check equality */
  equals(a: BrandedId<Brand>, b: BrandedId<Brand>): boolean;
  /** Convert to string */
  toString(id: BrandedId<Brand>): string;
}

/**
 * Options for creating a branded ID factory
 */
interface BrandedIdOptions {
  /** Validation function - throw if invalid */
  validate: Validator;
  /** Error message or message factory */
  errorMessage?: string | ((id: string) => string);
  /** Use crypto.randomUUID for generate() (default: true) */
  useCryptoUUID?: boolean;
}

/**
 * UUID validation regex (v4)
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * CUID validation regex
 * Format: c + 24 alphanumeric characters (lowercase)
 */
const CUID_REGEX = /^c[abcdefghijklmnopqrstuvwxyz0123456789]{24}$/;

/**
 * Validate CUID format (with UUID fallback for backward compatibility)
 */
export function isValidCUID(id: string): boolean {
  return CUID_REGEX.test(id) || isValidUUID(id);
}

/**
 * Create a branded ID factory with full type safety
 *
 * @param brand - The brand name (used for type discrimination)
 * @param options - Validation and generation options
 * @returns Factory object with create, unsafeCreate, generate, equals, toString
 *
 * @example
 * ```typescript
 * export const UserId = createBrandedId("UserId", { validate: isValidUUID });
 * export type UserId = BrandedId<"UserId">;
 * ```
 */
export function createBrandedId<Brand extends string>(
  brand: Brand,
  options: BrandedIdOptions,
): BrandedIdFactory<Brand> {
  const { validate, errorMessage, useCryptoUUID = true } = options;

  const getErrorMessage = (id: string): string => {
    if (typeof errorMessage === "function") {
      return errorMessage(id);
    }
    return errorMessage || `Invalid ${brand} format: ${id}`;
  };

  return {
    create(id: string): BrandedId<Brand> {
      if (!validate(id)) {
        throw new Error(getErrorMessage(id));
      }
      return id as BrandedId<Brand>;
    },

    unsafeCreate(id: string): BrandedId<Brand> {
      return id as BrandedId<Brand>;
    },

    generate(): BrandedId<Brand> {
      const newId = useCryptoUUID
        ? crypto.randomUUID()
        : throwError("generate() not configured for this ID type");
      return newId as BrandedId<Brand>;
    },

    equals(a: BrandedId<Brand>, b: BrandedId<Brand>): boolean {
      return a === b;
    },

    toString(id: BrandedId<Brand>): string {
      return id as string;
    },
  };
}

/**
 * Helper to throw from expression context
 */
function throwError(message: string): never {
  throw new Error(message);
}
