# EffectLogger Migration Guide

## Overview

This guide explains how to migrate from the custom `serverLogger`/`clientLogger` to the new `EffectLogger` which uses Effect's built-in logging capabilities.

## Why Migrate?

| Aspect              | Custom Logger                        | EffectLogger                          |
| ------------------- | ------------------------------------ | ------------------------------------- |
| Effect integration  | Manual wrapping with `Effect.sync()` | Native `Effect.log*` functions        |
| Testability         | Requires mock setup                  | Works with Effect's test runtime      |
| Context propagation | Manual                               | Automatic via `Effect.annotateLogs()` |
| Spans/tracing       | Not supported                        | Native support                        |
| Bundle size         | 205 lines custom code                | Reuses Effect's built-in logger       |

## Migration Patterns

### Pattern 1: Simple Info Log in Effect.gen

**Before:**

```typescript
import { serverLogger } from "@mirai-app/shared";

const program = Effect.gen(function* () {
  yield* Effect.sync(() => {
    serverLogger.info("Processing started");
  });
  // ... logic
});
```

**After:**

```typescript
import { EffectLogger } from "@mirai-app/shared";

const program = Effect.gen(function* () {
  yield* EffectLogger.info("Processing started");
  // ... logic
});
```

### Pattern 2: Log with Context

**Before:**

```typescript
yield *
  Effect.sync(() => {
    serverLogger.info("User action", { userId: "123", action: "login" });
  });
```

**After:**

```typescript
yield * EffectLogger.info("User action", { userId: "123", action: "login" });
```

### Pattern 3: Error Logging

**Before:**

```typescript
yield *
  Effect.sync(() => {
    serverLogger.error("Operation failed", error, { operation: "save" });
  });
```

**After:**

```typescript
yield * EffectLogger.error("Operation failed", error, { operation: "save" });
```

### Pattern 4: Warning in catchAll

**Before:**

```typescript
Effect.catchAll((error) =>
  Effect.sync(() => {
    serverLogger.warn(`Handler error: ${error.message}`);
  }),
);
```

**After:**

```typescript
Effect.catchAll((error) =>
  EffectLogger.warn(`Handler error: ${error.message}`),
);
```

### Pattern 5: Non-Effect Code (Keep as-is or use console)

For code that is **not** inside Effect flows, you have three options:

**Option A: Keep using serverLogger (deprecated but works)**

```typescript
// Synchronous/bootstrap code
serverLogger.info("Server starting...");
```

**Option B: Use console directly**

```typescript
// eslint-disable-next-line no-console
console.log("Server starting...");
```

**Option C: Wrap in Effect.runPromise (if applicable)**

```typescript
await Effect.runPromise(EffectLogger.info("Server starting..."));
```

## What NOT to Migrate

Don't migrate these cases:

1. **Test setup/teardown** - Keep using console.\* or serverLogger
2. **Scripts and CLI tools** - Use console.\* or serverLogger
3. **Error handlers outside Effect** - Use console.error directly
4. **Effect.sync wrappers around logging** - These are what we're eliminating

## File Status

### ✅ Migrated

- [x] `apps/backend-server/src/effect-server.ts` (5 usages)
- [x] `packages/adapters/src/services/EventBus.ts` (2 usages)

### ⏳ Pending Migration

- [ ] `apps/backend-server/src/server-bootstrap.ts` (15+ usages - mostly non-Effect)
- [ ] `apps/backend-server/src/bun-server.ts` (18+ usages - mostly non-Effect)
- [ ] `apps/backend-server/src/shared/error-handler.ts` (1 usage - non-Effect)
- [ ] `apps/backend-server/src/websocket/auth-handler.ts` (1 usage - non-Effect)
- [ ] `apps/backend-server/src/graphql/*.ts` (multiple files with debug logging)
- [ ] `apps/backend-server/src/config/hono-config.ts` (1 usage - non-Effect)
- [ ] `packages/adapters/src/gateways/realtime/InMemoryRealtimeAdapter.ts` (1 usage - in callback)
- [ ] `packages/adapters/src/controllers/auth/authServer.ts` (1 usage - non-Effect)
- [ ] `packages/frameworks/src/graphql/scripts/generate-sdl.ts` (4 usages - script file)
- [ ] `packages/frameworks/src/graphql/server.ts` (2 usages - server setup)
- [ ] `apps/seed/**/*.ts` (multiple files - seed scripts)
- [ ] `apps/native/**/*.ts` (React Native hooks - many files)

## API Reference

### EffectLogger Methods

All methods return `Effect.Effect<void, never, never>`:

```typescript
// Debug level
EffectLogger.debug(message: string, context?: LogContext)

// Info level (default)
EffectLogger.info(message: string, context?: LogContext)

// Warning level
EffectLogger.warn(message: string, context?: LogContext)

// Error level
EffectLogger.error(message: string, error?: Error, context?: LogContext)

// Add context to any effect
EffectLogger.withContext(context: LogContext)
```

### LogContext Type

```typescript
interface LogContext {
  readonly [key: string]: unknown;
}
```

## Running Tests

After migration, run tests to ensure no regressions:

```bash
# Run all tests
bun test

# Run specific package tests
bun test packages/adapters
bun test apps/backend-server

# Run with logs visible
ENABLE_TEST_LOGS=1 bun test
```

## Questions?

- See CLAUDE.md §10: Effect Framework Patterns
- See AGENTS.md for per-package conventions
- Check existing migrated files for examples
