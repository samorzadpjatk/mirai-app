import { Effect, Ref, Schedule } from "effect";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * Coordinates for location updates
 */
export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

/**
 * Entry stored for a user with timestamp for TTL tracking
 */
interface ThrottleEntry {
  readonly lastPublishTime: number;
  readonly pendingCoordinates: Coordinates | null;
}

/**
 * Throttle state - Map of userId to entry
 */
type ThrottleState = Map<string, ThrottleEntry>;

/**
 * Throttle window in milliseconds (1 second)
 */
const THROTTLE_WINDOW_MS = 1000;

/**
 * Maximum number of entries before triggering cleanup
 */
const DEFAULT_MAX_ENTRIES = 10000;

/**
 * TTL for stale entries in milliseconds (5 minutes)
 */
const ENTRY_TTL_MS = 5 * 60 * 1000;

/**
 * Cleanup interval in milliseconds (30 seconds)
 */
const CLEANUP_INTERVAL_MS = 30 * 1000;

/**
 * Configuration options for the throttle service
 */
export interface ThrottleServiceConfig {
  readonly maxEntries?: number;
  readonly entryTtlMs?: number;
  readonly cleanupIntervalMs?: number;
}

/**
 * Atomically updates throttle state and determines if publish should proceed.
 * Uses Ref.modify for thread-safe atomic read-modify-write.
 */
function atomicallyUpdateThrottle(
  stateRef: Ref.Ref<ThrottleState>,
  userIdStr: string,
  coordinates: Coordinates,
  now: number,
): Effect.Effect<boolean, never, never> {
  return Ref.modify(stateRef, (currentState): [boolean, ThrottleState] => {
    const entry = currentState.get(userIdStr);

    if (!entry) {
      // No entry exists - accept this update and create new entry
      const newState = new Map(currentState);
      newState.set(userIdStr, {
        lastPublishTime: now,
        pendingCoordinates: null,
      });
      return [true, newState];
    }

    const elapsed = now - entry.lastPublishTime;

    if (elapsed >= THROTTLE_WINDOW_MS) {
      // Throttle window has passed - accept this update
      const newState = new Map(currentState);
      newState.set(userIdStr, {
        lastPublishTime: now,
        pendingCoordinates: null,
      });
      return [true, newState];
    }

    // Within throttle window - update pending coordinates, skip this one
    const newState = new Map(currentState);
    newState.set(userIdStr, {
      lastPublishTime: entry.lastPublishTime, // Keep original timestamp
      pendingCoordinates: coordinates, // Replace with latest coordinates
    });
    return [false, newState];
  });
}

/**
 * Removes stale entries older than TTL.
 * Called periodically to prevent unbounded memory growth.
 */
function cleanupStaleEntries(
  stateRef: Ref.Ref<ThrottleState>,
  now: number,
  entryTtlMs: number,
): Effect.Effect<void, never, never> {
  return Ref.modify(stateRef, (currentState): [void, ThrottleState] => {
    const cutoffTime = now - entryTtlMs;
    const newState = new Map<string, ThrottleEntry>();

    for (const [userId, entry] of currentState) {
      // Keep entries that have been updated within TTL
      // An entry is stale if:
      // 1. No pending coordinates AND lastPublishTime is older than cutoff
      // 2. Has pending coordinates but we still check lastPublishTime
      const lastActivityTime = entry.pendingCoordinates
        ? now // If has pending, consider it active (will be checked on next update)
        : entry.lastPublishTime;

      if (lastActivityTime >= cutoffTime) {
        newState.set(userId, entry);
      }
    }

    return [undefined, newState];
  });
}

/**
 * Checks if state size exceeds threshold and triggers cleanup if needed.
 */
function cleanupIfNeeded(
  stateRef: Ref.Ref<ThrottleState>,
  maxEntries: number,
  entryTtlMs: number,
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const currentState = yield* Ref.get(stateRef);

    if (currentState.size > maxEntries) {
      const now = yield* Effect.sync(() => Date.now());
      yield* cleanupStaleEntries(stateRef, now, entryTtlMs);
    }
  });
}

/**
 * Creates a background fiber that periodically cleans up stale entries.
 */
function startCleanupFiber(
  stateRef: Ref.Ref<ThrottleState>,
  entryTtlMs: number,
  cleanupIntervalMs: number,
): Effect.Effect<void, never, never> {
  return Effect.gen(function* () {
    const cleanupSchedule = Schedule.spaced(cleanupIntervalMs);

    yield* Effect.repeat(
      Effect.gen(function* () {
        const now = yield* Effect.sync(() => Date.now());
        yield* cleanupStaleEntries(stateRef, now, entryTtlMs);
      }),
      cleanupSchedule,
    ).pipe(Effect.forkDaemon);
  });
}

/**
 * Creates a throttle service for location updates with memory management.
 *
 * Features:
 * - Atomic updates using Ref.modify (no race conditions)
 * - Automatic cleanup of stale entries to prevent memory leaks
 * - Configurable entry TTL and cleanup intervals
 *
 * The throttle service maintains in-memory state keyed by userId.
 * When shouldPublish is called:
 * - If no pending update exists or last publish was > 1000ms ago: accept and return true
 * - If last publish was < 1000ms ago: replace pending with latest coordinates, return false
 *
 * This implements a "replace-latest" strategy that prevents event queue buildup
 * during rapid location updates (e.g., GPS updates every 200ms during movement).
 *
 * @param config - Optional configuration for memory management
 * @returns A service object containing the shouldPublish function and cleanup control
 */
export function makeThrottleService(
  config: ThrottleServiceConfig = {},
): Effect.Effect<
  {
    readonly shouldPublish: (
      userId: UserId,
      coordinates: Coordinates,
    ) => Effect.Effect<boolean, never, never>;
    readonly getStats: () => Effect.Effect<
      { readonly entryCount: number; readonly maxEntries: number },
      never,
      never
    >;
    readonly forceCleanup: () => Effect.Effect<void, never, never>;
  },
  never,
  never
> {
  const maxEntries = config.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const entryTtlMs = config.entryTtlMs ?? ENTRY_TTL_MS;
  const cleanupIntervalMs = config.cleanupIntervalMs ?? CLEANUP_INTERVAL_MS;

  return Effect.gen(function* () {
    const stateRef = yield* Ref.make<ThrottleState>(new Map());

    // Start background cleanup fiber
    yield* startCleanupFiber(stateRef, entryTtlMs, cleanupIntervalMs);

    const shouldPublish = (
      userId: UserId,
      coordinates: Coordinates,
    ): Effect.Effect<boolean, never, never> => {
      return Effect.gen(function* () {
        const now = yield* Effect.sync(() => Date.now());
        const userIdStr = String(userId);

        // Check if cleanup is needed due to size
        yield* cleanupIfNeeded(stateRef, maxEntries, entryTtlMs);

        // Atomically update state - this is thread-safe
        return yield* atomicallyUpdateThrottle(
          stateRef,
          userIdStr,
          coordinates,
          now,
        );
      });
    };

    const getStats = (): Effect.Effect<
      { readonly entryCount: number; readonly maxEntries: number },
      never,
      never
    > => {
      return Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        return {
          entryCount: state.size,
          maxEntries,
        };
      });
    };

    const forceCleanup = (): Effect.Effect<void, never, never> => {
      return Effect.gen(function* () {
        const now = yield* Effect.sync(() => Date.now());
        yield* cleanupStaleEntries(stateRef, now, entryTtlMs);
      });
    };

    return { shouldPublish, getStats, forceCleanup };
  });
}
