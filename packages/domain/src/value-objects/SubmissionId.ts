/**
 * SubmissionId - Branded type for challenge submission identifiers
 */
export type SubmissionId = string & { readonly __brand: "SubmissionId" };

/**
 * SubmissionId factory functions
 */
export const SubmissionId = {
  /**
   * Create a SubmissionId from a string
   * @throws if the ID is not a valid CUID format
   */
  create(id: string): SubmissionId {
    if (!isValidCUID(id)) {
      throw new Error(`Invalid SubmissionId format: ${id}`);
    }
    return id as SubmissionId;
  },

  /**
   * Create a SubmissionId without validation (use carefully)
   */
  unsafeCreate(id: string): SubmissionId {
    return id as SubmissionId;
  },

  /**
   * Generate a new random SubmissionId (cuid)
   */
  generate(): SubmissionId {
    return crypto.randomUUID() as SubmissionId;
  },

  /**
   * Check if two SubmissionIds are equal
   */
  equals(a: SubmissionId, b: SubmissionId): boolean {
    return a === b;
  },

  /**
   * Convert SubmissionId to string (for serialization)
   */
  toString(id: SubmissionId): string {
    return id as string;
  },
};

/**
 * Validate CUID format (Prisma uses cuid for Submission IDs)
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
