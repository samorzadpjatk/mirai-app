/**
 * Immutable Update Helpers
 *
 * Utilities for creating immutable entity updates with automatic timestamp handling.
 * These helpers ensure proper timestamp management while maintaining immutability.
 *
 * @module immutable
 */

/**
 * Timestamp pair for entity creation
 */
export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Options for timestamp creation
 */
export interface TimestampOptions {
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

/**
 * Base type for domain entities with standard fields
 */
export type DomainEntity = {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/**
 * Makes all properties writable (removes readonly) and optional.
 * Used for entity update methods that build partial update objects.
 */
export type Writable<T> = { -readonly [P in keyof T]?: T[P] };

/**
 * Create a timestamps object with optional overrides.
 * Uses new Date() for any undefined timestamps.
 *
 * @param options - Optional timestamp overrides
 * @returns Frozen timestamps object with createdAt and updatedAt
 *
 * @example
 * ```typescript
 * // Create new timestamps
 * const ts = timestamps();
 * // { createdAt: Date, updatedAt: Date }
 *
 * // Preserve existing timestamps
 * const ts = timestamps({ createdAt: existing.createdAt });
 * // { createdAt: existingDate, updatedAt: new Date() }
 *
 * // Override both
 * const ts = timestamps({
 *   createdAt: new Date("2024-01-01"),
 *   updatedAt: new Date("2024-01-15")
 * });
 * ```
 */
export function timestamps(options?: TimestampOptions): Timestamps {
  const now = new Date();
  return Object.freeze({
    createdAt: options?.createdAt ?? now,
    updatedAt: options?.updatedAt ?? now,
  });
}

/**
 * Create a timestamps object with explicit now parameter (for testing).
 *
 * @param now - The current timestamp to use
 * @param options - Optional timestamp overrides
 * @returns Frozen timestamps object
 */
export function timestampsWithNow(
  now: Date,
  options?: TimestampOptions,
): Timestamps {
  return Object.freeze({
    createdAt: options?.createdAt ?? now,
    updatedAt: options?.updatedAt ?? now,
  });
}

/**
 * Merge updates into an entity with automatic updatedAt refresh.
 * Preserves id and createdAt, sets new updatedAt.
 *
 * @param entity - The source entity (must have Timestamps)
 * @param updates - Properties to update (excludes id and createdAt)
 * @returns New object with merged properties and fresh updatedAt
 *
 * @example
 * ```typescript
 * const updated = withUpdatedAt(challenge, { status: "ACTIVE" });
 * // challenge.id preserved, challenge.createdAt preserved,
 * // status updated, updatedAt set to new Date()
 * ```
 */
export function withUpdatedAt<T extends Timestamps>(
  entity: T,
  updates: Writable<Omit<T, "id" | "createdAt">>,
): T {
  return {
    ...entity,
    ...updates,
    createdAt: entity.createdAt,
    updatedAt: new Date(),
  } as T;
}

/**
 * Update an entity using its constructor.
 * For entities with private constructors that need full reconstruction.
 *
 * @param entity - The source entity
 * @param updates - Properties to change
 * @param constructor - The entity class constructor (accepts private constructors)
 * @returns New entity instance with updates applied
 *
 * @example
 * ```typescript
 * class Challenge {
 *   private constructor(
 *     readonly id: string,
 *     readonly name: string,
 *     readonly status: ChallengeStatus,
 *     readonly createdAt: Date,
 *     readonly updatedAt: Date,
 *   ) {}
 *
 *   static create(props: { ... }) { ... }
 * }
 *
 * // Update an entity
 * const updated = updateEntity(
 *   challenge,
 *   { status: "ACTIVE" },
 *   Challenge
 * );
 * ```
 */
export function updateEntity<T extends object>(
  entity: T,
  updates: any,
  constructor: any,
): T {
  // Get all property keys from the entity
  const keys = Object.keys(entity) as Array<keyof T>;

  // Build constructor arguments from entity properties
  // with updates applied and updatedAt refreshed
  const args = keys.map((key) => {
    if (key === "updatedAt") {
      return new Date();
    }
    if (key in updates && (updates as Record<string, unknown>)[key as string] !== undefined) {
      return (updates as Record<string, unknown>)[key as string];
    }
    return entity[key];
  });

  return new constructor(...(args as any[])) as T;
}

/**
 * Update an entity with a specific timestamp (for testing).
 *
 * @param entity - The source entity
 * @param updates - Properties to change
 * @param constructor - The entity class constructor (accepts private constructors)
 * @param now - The timestamp to use for updatedAt
 * @returns New entity instance
 */
export function updateEntityWithNow<T extends object>(
  entity: T,
  updates: any,
  constructor: any,
  now: Date,
): T {
  const keys = Object.keys(entity) as Array<keyof T>;

  const args = keys.map((key) => {
    if (key === "updatedAt") {
      return now;
    }
    if (key in updates && (updates as Record<string, unknown>)[key as string] !== undefined) {
      return (updates as Record<string, unknown>)[key as string];
    }
    return entity[key];
  });

  return new constructor(...(args as any[])) as T;
}
