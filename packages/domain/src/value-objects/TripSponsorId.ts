/**
 * TripSponsorId - Branded type for trip-sponsor association identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
export type TripSponsorId = string & { readonly __brand: "TripSponsorId" };

/**
 * TripSponsorId factory functions
 */
export const TripSponsorId = {
  /**
   * Create a TripSponsorId from a string
   * @throws if the ID is not a valid format
   */
  create(id: string): TripSponsorId {
    if (!id || id.trim() === "") {
      throw new Error(`Invalid TripSponsorId: empty or undefined`);
    }
    return id as TripSponsorId;
  },

  /**
   * Create a TripSponsorId without validation (use carefully)
   */
  unsafeCreate(id: string): TripSponsorId {
    return id as TripSponsorId;
  },

  /**
   * Generate a new random TripSponsorId
   */
  generate(): TripSponsorId {
    return crypto.randomUUID() as TripSponsorId;
  },

  /**
   * Check if two TripSponsorIds are equal
   */
  equals(a: TripSponsorId, b: TripSponsorId): boolean {
    return a === b;
  },

  /**
   * Convert TripSponsorId to string (for serialization)
   */
  toString(id: TripSponsorId): string {
    return id as string;
  },
};
