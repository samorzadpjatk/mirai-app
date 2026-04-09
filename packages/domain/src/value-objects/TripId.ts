/**
 * TripId - Branded type for trip identifiers
 */
export type TripId = string & { readonly __brand: "TripId" };

/**
 * TripId factory functions
 */
export const TripId = {
  /**
   * Create a TripId from a string
   */
  create(id: string): TripId {
    if (!isValidUUID(id)) {
      throw new Error(`Invalid TripId format: ${id}`);
    }
    return id as TripId;
  },

  /**
   * Create a TripId without validation (use carefully)
   */
  unsafeCreate(id: string): TripId {
    return id as TripId;
  },

  /**
   * Generate a new random TripId
   */
  generate(): TripId {
    return crypto.randomUUID() as TripId;
  },

  /**
   * Check if two TripIds are equal
   */
  equals(a: TripId, b: TripId): boolean {
    return a === b;
  },

  /**
   * Convert TripId to string (for serialization)
   */
  toString(id: TripId): string {
    return id as string;
  },
};

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}
