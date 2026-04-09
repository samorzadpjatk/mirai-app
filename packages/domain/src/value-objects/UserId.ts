/**
 * UserId - Branded type for user identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a ChallengeId where a UserId is expected
 */
export type UserId = string & { readonly __brand: "UserId" };

/**
 * UserId factory functions
 */
export const UserId = {
  /**
   * Create a UserId from a string
   * @throws if the ID is not a valid UUID format
   */
  create(id: string): UserId {
    if (!isValidUUID(id)) {
      throw new Error(`Invalid UserId format: ${id}`);
    }
    return id as UserId;
  },

  /**
   * Create a UserId without validation (use carefully)
   */
  unsafeCreate(id: string): UserId {
    return id as UserId;
  },

  /**
   * Generate a new random UserId
   */
  generate(): UserId {
    return crypto.randomUUID() as UserId;
  },

  /**
   * Check if two UserIds are equal
   */
  equals(a: UserId, b: UserId): boolean {
    return a === b;
  },

  /**
   * Convert UserId to string (for serialization)
   */
  toString(id: UserId): string {
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
