/**
 * RewardId - Branded type for reward identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a UserId where a RewardId is expected
 */
export type RewardId = string & { readonly __brand: "RewardId" };

/**
 * RewardId factory functions
 */
export const RewardId = {
  /**
   * Create a RewardId from a string
   * @throws if the ID is not a valid cuid format
   */
  create(id: string): RewardId {
    if (!isValidCuid(id)) {
      throw new Error(`Invalid RewardId format: ${id}`);
    }
    return id as RewardId;
  },

  /**
   * Create a RewardId without validation (use carefully)
   */
  unsafeCreate(id: string): RewardId {
    return id as RewardId;
  },

  /**
   * Generate a new random RewardId
   */
  generate(): RewardId {
    return crypto.randomUUID() as RewardId;
  },

  /**
   * Check if two RewardIds are equal
   */
  equals(a: RewardId, b: RewardId): boolean {
    return a === b;
  },

  /**
   * Convert RewardId to string (for serialization)
   */
  toString(id: RewardId): string {
    return id as string;
  },
};

/**
 * Validate CUID format (cuid starts with 'c')
 * Simple validation - accepts alphanumeric strings starting with 'c'
 */
function isValidCuid(id: string): boolean {
  // CUIDs are typically 25 characters starting with 'c'
  // For flexibility, we accept any non-empty string starting with 'c' or a UUID
  const CUID_REGEX = /^c[\w]+$/;
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return CUID_REGEX.test(id) || UUID_REGEX.test(id);
}
