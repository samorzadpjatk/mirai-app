/**
 * ChallengeId - Branded type for challenge identifiers
 */
export type ChallengeId = string & { readonly __brand: "ChallengeId" };

/**
 * ChallengeId factory functions
 */
export const ChallengeId = {
  /**
   * Create a ChallengeId from a string
   * @throws if the ID is not a valid CUID format
   */
  create(id: string): ChallengeId {
    if (!isValidCUID(id)) {
      throw new Error(`Invalid ChallengeId format: ${id}`);
    }
    return id as ChallengeId;
  },

  /**
   * Create a ChallengeId without validation (use carefully)
   */
  unsafeCreate(id: string): ChallengeId {
    return id as ChallengeId;
  },

  /**
   * Generate a new random ChallengeId (cuid)
   */
  generate(): ChallengeId {
    return crypto.randomUUID() as ChallengeId;
  },

  /**
   * Check if two ChallengeIds are equal
   */
  equals(a: ChallengeId, b: ChallengeId): boolean {
    return a === b;
  },

  /**
   * Convert ChallengeId to string (for serialization)
   */
  toString(id: ChallengeId): string {
    return id as string;
  },
};

/**
 * Validate CUID format (Prisma uses cuid for Challenge IDs)
 * CUID format: c + 24 alphanumeric characters (lowercase)
 */
function isValidCUID(id: string): boolean {
  const CUID_REGEX = /^c[abcdefghijklmnopqrstuvwxyz0123456789]{24}$/;
  return CUID_REGEX.test(id) || isValidUUID(id);
}

/**
 * Validate UUID format as fallback
 */
function isValidUUID(id: string): boolean {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}
