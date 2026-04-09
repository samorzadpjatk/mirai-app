/**
 * NotificationId - Branded type for notification identifiers
 */
export type NotificationId = string & { readonly __brand: "NotificationId" };

/**
 * NotificationId factory functions
 */
export const NotificationId = {
  /**
   * Create a NotificationId from a string
   * @throws if the ID is not valid
   */
  create(id: string): NotificationId {
    if (!isValidCUIDOrUUID(id)) {
      throw new Error(`Invalid NotificationId format: ${id}`);
    }
    return id as NotificationId;
  },

  /**
   * Create a NotificationId without validation (use carefully)
   */
  unsafeCreate(id: string): NotificationId {
    return id as NotificationId;
  },

  /**
   * Generate a new random NotificationId (cuid)
   */
  generate(): NotificationId {
    return crypto.randomUUID() as NotificationId;
  },

  /**
   * Check if two NotificationIds are equal
   */
  equals(a: NotificationId, b: NotificationId): boolean {
    return a === b;
  },

  /**
   * Convert NotificationId to string (for serialization)
   */
  toString(id: NotificationId): string {
    return id as string;
  },
};

/**
 * Validate CUID or UUID format
 */
function isValidCUIDOrUUID(id: string): boolean {
  // CUID format: c + 24 alphanumeric (lowercase)
  const CUID_REGEX = /^c[abcdefghijklmnopqrstuvwxyz0123456789]{24}$/;
  // UUID format
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return CUID_REGEX.test(id) || UUID_REGEX.test(id);
}
