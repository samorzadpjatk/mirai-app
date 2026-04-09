/**
 * ActivityId - Branded type for activity identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
export type ActivityId = string & { readonly __brand: "ActivityId" };

/**
 * ActivityId factory functions
 */
export const ActivityId = {
  /**
   * Create an ActivityId from a string
   * @throws if the ID is not a valid UUID format
   */
  create(id: string): ActivityId {
    if (!isValidUUID(id)) {
      throw new Error(`Invalid ActivityId format: ${id}`);
    }
    return id as ActivityId;
  },

  /**
   * Create an ActivityId without validation (use carefully)
   */
  unsafeCreate(id: string): ActivityId {
    return id as ActivityId;
  },

  /**
   * Generate a new random ActivityId
   */
  generate(): ActivityId {
    return crypto.randomUUID() as ActivityId;
  },

  /**
   * Check if two ActivityIds are equal
   */
  equals(a: ActivityId, b: ActivityId): boolean {
    return a === b;
  },

  /**
   * Convert ActivityId to string (for serialization)
   */
  toString(id: ActivityId): string {
    return id as string;
  },
};

/**
 * Validate UUID format (v4)
 */
function isValidUUID(id: string): boolean {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}
