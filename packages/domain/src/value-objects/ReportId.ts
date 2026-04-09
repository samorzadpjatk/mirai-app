/**
 * ReportId - Branded type for submission report identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
export type ReportId = string & { readonly __brand: "ReportId" };

/**
 * ReportId factory functions
 */
export const ReportId = {
  /**
   * Create a ReportId from a string
   * @throws if the ID is not a valid format
   */
  create(id: string): ReportId {
    if (!id || id.trim() === "") {
      throw new Error(`Invalid ReportId: empty or undefined`);
    }
    return id as ReportId;
  },

  /**
   * Create a ReportId without validation (use carefully)
   */
  unsafeCreate(id: string): ReportId {
    return id as ReportId;
  },

  /**
   * Generate a new random ReportId
   */
  generate(): ReportId {
    return crypto.randomUUID() as ReportId;
  },

  /**
   * Check if two ReportIds are equal
   */
  equals(a: ReportId, b: ReportId): boolean {
    return a === b;
  },

  /**
   * Convert ReportId to string (for serialization)
   */
  toString(id: ReportId): string {
    return id as string;
  },
};
