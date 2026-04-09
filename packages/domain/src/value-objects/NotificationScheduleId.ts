/**
 * NotificationScheduleId - Branded type for notification schedule identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a UserId where a NotificationScheduleId is expected
 */
export type NotificationScheduleId = string & {
  readonly __brand: "NotificationScheduleId";
};

/**
 * NotificationScheduleId factory functions
 */
export const NotificationScheduleId = {
  /**
   * Create a NotificationScheduleId from a string
   * @throws if the ID is not a valid UUID format
   */
  create(id: string): NotificationScheduleId {
    if (!isValidUUID(id)) {
      throw new Error(`Invalid NotificationScheduleId format: ${id}`);
    }
    return id as NotificationScheduleId;
  },

  /**
   * Create a NotificationScheduleId without validation (use carefully)
   */
  unsafeCreate(id: string): NotificationScheduleId {
    return id as NotificationScheduleId;
  },

  /**
   * Generate a new random NotificationScheduleId
   */
  generate(): NotificationScheduleId {
    return crypto.randomUUID() as NotificationScheduleId;
  },

  /**
   * Check if two NotificationScheduleIds are equal
   */
  equals(a: NotificationScheduleId, b: NotificationScheduleId): boolean {
    return a === b;
  },

  /**
   * Convert NotificationScheduleId to string (for serialization)
   */
  toString(id: NotificationScheduleId): string {
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
