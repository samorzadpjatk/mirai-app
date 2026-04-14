# Muda Findings and Effect Standard Library Replacements

**Date:** 2026-04-15
**Analysis Scope:** Logging, retry logic, async patterns
**Status:** Primary finding fixed, secondary finding documented

---

## Finding 1: Custom Logger → Effect Logger ✅ FIXED

**Location:** `packages/shared/src/logger.ts` (205 lines)

**Finding:** Custom structured logging implementation when Effect provides built-in logging.

**Solution:** Created `EffectLogger` module using `Effect.log*()` functions.

**Files Changed:**

- `packages/shared/src/effect-logger.ts` - New Effect-native logger
- `packages/shared/src/logger.ts` - Added deprecation notice
- `packages/shared/src/index.ts` - Export both loggers
- `packages/frameworks/src/effect/logger-layer.ts` - Layer configuration
- `apps/backend-server/src/effect-server.ts` - Migrated 7 usages
- `packages/adapters/src/services/EventBus.ts` - Migrated 2 usages

**Documentation:**

- `docs/EFFECT_LOGGER_MIGRATION.md` - Complete migration guide with patterns

**Test Results:**

- ✅ packages/adapters: 292 tests pass
- ✅ packages/use-cases: 648 tests pass
- ✅ apps/backend-server: 130 tests pass (5 pre-existing failures)

---

## Finding 2: Custom Retry Logic → Effect Retry ⏳ DOCUMENTED

**Location:** `packages/adapters/src/services/notification-service.ts` (lines 102-144)

**Finding:** Custom `executeWithRetry` function implementing:

- Exponential backoff
- Jittered delays
- Custom error callbacks
- Result validation

**Current Implementation (44 lines):**

```typescript
async function executeWithRetry<T>(
  toExecute: () => Promise<T>,
  onError?: (err: unknown, retryAttempt: number) => void | Promise<void>,
  isValidResult?: (result: T) => boolean,
  maxRetriesCount?: number,
  delayInMs?: number,
): Promise<T> {
  // 44 lines of custom retry logic
}
```

**Effect Standard Library Equivalent:**

```typescript
import { Effect, Schedule } from "effect";

// Exponential backoff with jitter
const retryPolicy = Schedule.addDelay(
  Schedule.recurs(3), // 3 retries
  () => Duration.millis(500 * (0.5 + Math.random())), // jitter
);

// Retry with Effect
const sendNotifications = Effect.tryPromise({
  try: () => expo.sendPushNotificationsAsync(chunk),
  catch: (error) => new NotificationError({ cause: error }),
}).pipe(
  Effect.retry(retryPolicy),
  Effect.catchAll((error) => {
    // Handle final failure after retries
    return Effect.succeed([]);
  }),
);
```

**Benefits of Effect Retry:**

1. Composable - can combine multiple schedules
2. Observable - integrates with Effect tracing
3. Interruptible - respects Effect interruption
4. Testable - works with Effect's test clock
5. No custom code to maintain

**Migration Priority:** Low

- The custom retry works correctly
- Only used in one place (notification-service.ts)
- Migration requires converting the entire service to Effect

**Recommendation:** Migrate when refactoring notification-service.ts to full Effect

---

## Finding 3: Console.\* usages in Test Setup ✅ APPROPRIATE

**Location:** Various test files using `console.log`

**Finding:** 170+ `console.*` usages found

**Analysis:** Most are in:

- Test setup/teardown files (`test/setup.ts`, `test-setup.ts`)
- Benchmark scripts (`.specs/benchmarks/`)
- Debug logging in tests

**Status:** ✅ These are appropriate uses

- Test setup should use console for immediate feedback
- Benchmarks need console output for reporting
- Debug logs are temporary

---

## Summary

| Finding        | Severity | Status         | Action                                         |
| -------------- | -------- | -------------- | ---------------------------------------------- |
| Custom Logger  | Medium   | ✅ Fixed       | EffectLogger created, migration guide provided |
| Custom Retry   | Low      | ⏳ Documented  | Migrate when refactoring notification-service  |
| Console usages | None     | ✅ Appropriate | No action needed                               |

## Recommendations for Future PRs

### 1. Complete Logger Migration (Optional)

- Remaining 270 custom logger usages are in non-Effect code
- Migrate incrementally as code is refactored to Effect

### 2. Notification Service Refactor (Future)

- Convert `notification-service.ts` to Effect
- Replace custom retry with `Effect.retry()`
- Estimated effort: 1-2 days

### 3. General Best Practices Going Forward

- **For new Effect code:** Always use `EffectLogger` or `Effect.log*`
- **For new async operations:** Use `Effect.tryPromise` instead of raw async/await
- **For retry logic:** Use `Effect.retry()` with `Schedule` instead of custom loops

---

## References

- Effect Logging: https://effect.website/docs/observability/logging/
- Effect Retry: https://effect.website/docs/concurrency/retrying/
- Effect Schedules: https://effect.website/docs/schedules/introduction/
