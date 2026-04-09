/**
 * SponsorId - Branded type for sponsor identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
export type SponsorId = string & { readonly __brand: "SponsorId" };

/**
 * SponsorId factory functions
 */
export const SponsorId = {
  /**
   * Create a SponsorId from a string
   * @throws if the ID is not a valid format
   */
  create(id: string): SponsorId {
    if (!id || id.trim() === "") {
      throw new Error(`Invalid SponsorId: empty or undefined`);
    }
    return id as SponsorId;
  },

  /**
   * Create a SponsorId without validation (use carefully)
   */
  unsafeCreate(id: string): SponsorId {
    return id as SponsorId;
  },

  /**
   * Generate a new random SponsorId
   */
  generate(): SponsorId {
    return crypto.randomUUID() as SponsorId;
  },

  /**
   * Check if two SponsorIds are equal
   */
  equals(a: SponsorId, b: SponsorId): boolean {
    return a === b;
  },

  /**
   * Convert SponsorId to string (for serialization)
   */
  toString(id: SponsorId): string {
    return id as string;
  },
};
