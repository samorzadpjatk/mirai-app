/**
 * Entity Helper Functions
 *
 * Pure utility functions for common entity operations.
 * Replaces duplicate query methods across entities.
 *
 * @module entity-helpers
 */

/**
 * Check if an entity belongs to a specific target by ID.
 * Replaces: isForTrip(tripId), isForUser(userId), etc.
 *
 * @param entityId - The entity's ID field value
 * @param targetId - The target ID to check against
 * @returns true if IDs match
 *
 * @example
 * ```typescript
 * const isForTarget = entityHelpers.belongsTo(entity.tripId, targetTripId);
 * ```
 */
function belongsTo(entityId: string, targetId: string): boolean {
  return entityId === targetId;
}

/**
 * Check if a composite key matches target IDs.
 * Replaces: matches(userId, tripId), matchesCompositeKey(ids)
 *
 * @param ids - Array of IDs from the entity
 * @param targetIds - Array of target IDs to match against
 * @returns true if all IDs match at corresponding indices
 *
 * @example
 * ```typescript
 * const matches = entityHelpers.matchesComposite(
 *   [entity.userId, entity.tripId],
 *   [targetUserId, targetTripId]
 * );
 * ```
 */
function matchesComposite(
  ids: readonly string[],
  targetIds: readonly string[],
): boolean {
  if (ids.length !== targetIds.length) {
    return false;
  }
  if (ids.length === 0) {
    return true;
  }
  return ids.every((id, index) => id === targetIds[index]);
}

/**
 * Get the age of an entity in milliseconds from its creation date.
 * Replaces: getAgeMs() methods on entities
 *
 * @param createdAt - The creation timestamp
 * @returns Age in milliseconds (always positive for past dates)
 *
 * @example
 * ```typescript
 * const ageMs = entityHelpers.getAgeMs(entity.createdAt);
 * if (ageMs > 86400000) { // older than 24 hours
 *   // handle old entity
 * }
 * ```
 */
function getAgeMs(createdAt: Date): number {
  return Date.now() - createdAt.getTime();
}

/**
 * Check if an entity has expired based on a threshold.
 * Replaces: isExpired() methods, expiration checks
 *
 * @param createdAt - The creation timestamp
 * @param thresholdMs - Maximum age in milliseconds before expiration
 * @returns true if entity has exceeded the threshold
 *
 * @example
 * ```typescript
 * // Check if older than 24 hours
 * const isExpired = entityHelpers.isExpired(entity.createdAt, 86400000);
 *
 * // Check if older than 7 days
 * const isExpired = entityHelpers.isExpired(entity.createdAt, 604800000);
 * ```
 */
function isExpired(createdAt: Date, thresholdMs: number): boolean {
  return getAgeMs(createdAt) > thresholdMs;
}

/**
 * Entity helper functions namespace
 * Provides pure functions for common entity operations
 */
export const entityHelpers = {
  belongsTo,
  matchesComposite,
  getAgeMs,
  isExpired,
} as const;
