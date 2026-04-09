/**
 * ChallengeVoteId - Branded type for challenge vote identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
export type ChallengeVoteId = string & { readonly __brand: "ChallengeVoteId" };

/**
 * ChallengeVoteId factory functions
 */
export const ChallengeVoteId = {
  /**
   * Create a ChallengeVoteId from a string
   * @throws if the ID is not a valid format
   */
  create(id: string): ChallengeVoteId {
    if (!id || id.trim() === "") {
      throw new Error(`Invalid ChallengeVoteId: empty or undefined`);
    }
    return id as ChallengeVoteId;
  },

  /**
   * Create a ChallengeVoteId without validation (use carefully)
   */
  unsafeCreate(id: string): ChallengeVoteId {
    return id as ChallengeVoteId;
  },

  /**
   * Generate a new random ChallengeVoteId
   */
  generate(): ChallengeVoteId {
    return crypto.randomUUID() as ChallengeVoteId;
  },

  /**
   * Check if two ChallengeVoteIds are equal
   */
  equals(a: ChallengeVoteId, b: ChallengeVoteId): boolean {
    return a === b;
  },

  /**
   * Convert ChallengeVoteId to string (for serialization)
   */
  toString(id: ChallengeVoteId): string {
    return id as string;
  },
};
