/**
 * LocationId - Branded type for location identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a UserId where a LocationId is expected
 */
export type LocationId = string & { readonly __brand: "LocationId" };

/**
 * LocationId factory functions
 */
export const LocationId = {
  /**
   * Create a LocationId from a string
   * @throws if the ID is not a valid CUID format
   */
  create(id: string): LocationId {
    if (!isValidCUID(id)) {
      throw new Error(`Invalid LocationId format: ${id}`);
    }
    return id as LocationId;
  },

  /**
   * Create a LocationId without validation (use carefully)
   */
  unsafeCreate(id: string): LocationId {
    return id as LocationId;
  },

  /**
   * Generate a new random LocationId
   */
  generate(): LocationId {
    return crypto.randomUUID() as LocationId;
  },

  /**
   * Check if two LocationIds are equal
   */
  equals(a: LocationId, b: LocationId): boolean {
    return a === b;
  },

  /**
   * Convert LocationId to string (for serialization)
   */
  toString(id: LocationId): string {
    return id as string;
  },
};

/**
 * Validate CUID format (used by Prisma)
 * CUID format: c + 24 alphanumeric characters
 */
function isValidCUID(id: string): boolean {
  const CUID_REGEX = /^c[a-z0-9]{24}$/;
  return CUID_REGEX.test(id);
}
