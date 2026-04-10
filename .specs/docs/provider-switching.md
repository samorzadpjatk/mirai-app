# Provider Switching Guide

Guide for switching between Supabase and InMemory adapters using environment variables.

## Overview

The Mirai App uses a **Clean Architecture** approach with **Port-Adapter pattern** for external services. This allows seamless switching between:

- **Supabase Adapters** - Production implementations using real Supabase services
- **InMemory Adapters** - Test implementations using in-memory data structures

## Quick Reference

### Environment Variables

| Variable            | Values                   | Default    | Purpose                 |
| ------------------- | ------------------------ | ---------- | ----------------------- |
| `AUTH_PROVIDER`     | `supabase` \| `inmemory` | `supabase` | Authentication provider |
| `REALTIME_PROVIDER` | `supabase` \| `inmemory` | `supabase` | Real-time communication |
| `STORAGE_PROVIDER`  | `supabase` \| `inmemory` | `supabase` | File storage            |

### Quick Start

**Production (default - uses Supabase):**

```bash
bun start
```

**Testing (uses InMemory adapters):**

```bash
AUTH_PROVIDER=inmemory REALTIME_PROVIDER=inmemory STORAGE_PROVIDER=inmemory bun test
```

**Mixed (Auth only):**

```bash
AUTH_PROVIDER=inmemory bun test --filter=auth
```

## When to Use Each Provider

### Supabase Providers (Production)

Use Supabase adapters when:

- Running in **production** or **staging** environments
- Need **persistent data** across requests/sessions
- Performing **integration tests** with real services
- Running **E2E tests** that require full auth flow
- Need **real-time features** with actual WebSocket connections
- Storing **actual files** in cloud storage

**Pros:**

- Real-world behavior
- Persistent data
- Production-like testing

**Cons:**

- Requires network calls (slower)
- Needs Supabase credentials
- Can have rate limits
- Tests are not fully isolated

### InMemory Providers (Testing)

Use InMemory adapters when:

- Writing **unit tests** for business logic
- Running tests in **CI/CD** pipelines (faster)
- Developing **without Supabase credentials**
- Testing **error scenarios** deterministically
- Running tests in **parallel** (each test isolated)
- Need **instant feedback** during development

**Pros:**

- No network calls (very fast)
- No external dependencies
- Deterministic behavior
- Tests are fully isolated
- Easy to set up specific states

**Cons:**

- Data not persisted
- No real-time WebSocket behavior
- Not suitable for production

## Configuration Examples

### 1. All Supabase (Default)

No environment variables needed:

```bash
# Uses Supabase for everything (default behavior)
bun start
```

Or explicitly:

```bash
AUTH_PROVIDER=supabase REALTIME_PROVIDER=supabase STORAGE_PROVIDER=supabase bun start
```

### 2. All InMemory (Testing)

Perfect for unit tests:

```bash
AUTH_PROVIDER=inmemory REALTIME_PROVIDER=inmemory STORAGE_PROVIDER=inmemory bun test
```

Or in `.env.test`:

```env
AUTH_PROVIDER=inmemory
REALTIME_PROVIDER=inmemory
STORAGE_PROVIDER=inmemory
```

### 3. Mixed Configuration

Use InMemory for auth (faster tests) but Supabase for storage:

```bash
AUTH_PROVIDER=inmemory STORAGE_PROVIDER=supabase bun test
```

Common scenarios:

| Scenario          | Auth       | Realtime   | Storage    |
| ----------------- | ---------- | ---------- | ---------- |
| Full unit tests   | `inmemory` | `inmemory` | `inmemory` |
| Auth flow tests   | `inmemory` | `supabase` | `supabase` |
| File upload tests | `supabase` | `supabase` | `inmemory` |
| Integration tests | `supabase` | `supabase` | `supabase` |

## Testing Guide

### Using createTestContainer()

The `createTestContainer()` function automatically registers InMemory adapters:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { createTestContainer } from "@mirai-app/frameworks/di";
import {
  getInMemoryAuthAdapter,
  clearInMemoryAdapters,
} from "@mirai-app/frameworks/di";
import { UserId, UserRole } from "@mirai-app/domain";

describe("MyUseCase", () => {
  let container: ReturnType<typeof createTestContainer>;

  beforeEach(() => {
    container = createTestContainer();
  });

  afterEach(() => {
    clearInMemoryAdapters(container);
  });

  it("should authenticate user with InMemory adapter", async () => {
    // Get the InMemory auth adapter
    const authAdapter = getInMemoryAuthAdapter(container);

    // Set up test user
    const userId = UserId.create("test-user-1");
    authAdapter.createUser({
      id: userId,
      email: "test@example.com",
      role: UserRole.USER,
    });

    // Create a session
    const { token } = authAdapter.createSession(userId);

    // Test your use case
    const useCase = container.resolve("authenticateUserUseCase");
    const result = await useCase.execute(token);

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.value.userId).toEqual(userId);
    }
  });
});
```

### Setting Up Test State

#### Authentication

```typescript
import { getInMemoryAuthAdapter } from "@mirai-app/frameworks/di";

const authAdapter = getInMemoryAuthAdapter(container);

// Create user
const userId = UserId.create("user-123");
authAdapter.createUser({
  id: userId,
  email: "user@example.com",
  role: UserRole.ADMIN,
});

// Create session
const { token, sessionId } = authAdapter.createSession(userId, 3600);

// Later: Clean up
authAdapter.clear();
```

#### Real-time

```typescript
import { getInMemoryRealtimeAdapter } from "@mirai-app/frameworks/di";

const realtimeAdapter = getInMemoryRealtimeAdapter(container);

// Subscribe to channel
const receivedMessages: unknown[] = [];
const result = realtimeAdapter.subscribe("my-channel", {
  onMessage: (event, payload) => receivedMessages.push(payload),
});

// Broadcast message
await realtimeAdapter.broadcast("my-channel", "update", { data: "value" });

// Verify
expect(receivedMessages).toHaveLength(1);

// Later: Clean up
realtimeAdapter.clear();
```

#### Storage

```typescript
import { getInMemoryStorageAdapter } from "@mirai-app/frameworks/di";

const storageAdapter = getInMemoryStorageAdapter(container);

// Upload file
const buffer = Buffer.from("Hello World");
await storageAdapter.upload("files", "test.txt", buffer, {
  contentType: "text/plain",
});

// Verify
expect(storageAdapter.fileExists("files", "test.txt")).toBe(true);

// Later: Clean up
storageAdapter.clear();
```

### Overriding with Custom Mocks

Sometimes you need a custom mock instead of InMemory:

```typescript
import {
  createTestContainer,
  createMockPortFactory,
} from "@mirai-app/frameworks/di";
import { asValue } from "awilix";

const container = createTestContainer();

// Override authPort with custom mock
container.register({
  authPort: createMockPortFactory({
    validateToken: async () =>
      ok(createTestAuthContext({ role: UserRole.ADMIN })),
    refreshSession: async () => ok(createTestAuthContext()),
  }),
});
```

## Architecture

### How It Works

1. **Environment Variables** are read at runtime by `readProviderConfigFromEnv()`
2. **Factory Functions** in `UseCaseModule` select the appropriate adapter
3. **DI Container** resolves the correct implementation based on config

```
┌──────────────────┐
│ Environment Vars │
├──────────────────┤
│ AUTH_PROVIDER    │
│ REALTIME_PROVIDER│
│ STORAGE_PROVIDER│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Factory Function │
├──────────────────┤
│ createAuthPort() │
│ createRealtime...│
│ createStorage... │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│Supabase│ │ InMemory │
│Adapter │ │ Adapter  │
└────────┘ └──────────┘
```

### Code Flow

```typescript
// 1. Environment is read
const config = readProviderConfigFromEnv();
// config = { authProvider: "inmemory", ... }

// 2. Factory selects implementation
function createAuthPort(cradle) {
  switch (config.authProvider) {
    case "inmemory":
      return new InMemoryAuthAdapter();
    case "supabase":
      return new SupabaseAuthAdapter(cradle.supabase);
  }
}

// 3. Container resolves the adapter
const authPort = container.resolve("authPort");
// Returns InMemoryAuthAdapter when AUTH_PROVIDER=inmemory
```

## Troubleshooting

### Common Issues

#### "Invalid AUTH_PROVIDER value"

**Error:**

```
Error: Invalid AUTH_PROVIDER value: "memory". Must be "supabase" or "inmemory".
```

**Solution:** Use correct value:

```bash
AUTH_PROVIDER=inmemory  # ✓ Correct
AUTH_PROVIDER=memory    # ✗ Incorrect
```

#### Adapter Not Found in Tests

**Error:**

```
Error: Could not resolve 'authPort'
```

**Solution:** Use `createTestContainer()` which auto-registers InMemory adapters:

```typescript
// ✓ Correct
const container = createTestContainer();

// ✗ Incorrect - doesn't register adapters
const container = createContainer({ injectionMode: "PROXY" });
```

#### Supabase Credentials Missing

**Error:**

```
Error: Supabase client not configured
```

**Solution:** When using Supabase provider, ensure credentials are set:

```bash
# For production (uses Supabase)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# For testing (uses InMemory, no credentials needed)
AUTH_PROVIDER=inmemory bun test
```

### Debugging Provider Selection

Add logging to see which provider is active:

```typescript
import { readProviderConfigFromEnv } from "@mirai-app/adapters/modules/UseCaseModule";

const config = readProviderConfigFromEnv();
console.log("Active providers:", config);
// { authProvider: "inmemory", realtimeProvider: "supabase", storageProvider: "inmemory" }
```

## Migration from Hardcoded Adapters

If you have code that directly instantiates adapters:

### Before (Hardcoded)

```typescript
// ❌ Direct instantiation - hard to test
const authPort = new SupabaseAuthAdapter(supabaseClient);
```

### After (DI with Environment)

```typescript
// ✅ Resolved from container based on environment
const authPort = container.resolve("authPort");
```

### In Tests

```typescript
// ✅ Test container auto-uses InMemory
const container = createTestContainer();
const authPort = container.resolve("authPort");
// authPort is InMemoryAuthAdapter

// Or get typed adapter directly
const authAdapter = getInMemoryAuthAdapter(container);
```

## Best Practices

1. **Default to Supabase in Production**: Don't set env vars in production - defaults are safe
2. **Use InMemory for Unit Tests**: Faster, no external dependencies
3. **Use Supabase for E2E Tests**: Real-world behavior verification
4. **Mix for Integration Tests**: Use InMemory for what's you're not testing
5. **Clear State Between Tests**: Use `clearInMemoryAdapters(container)` in `afterEach`
6. **Document Test Requirements**: Comment why you're using specific providers

## Reference

### Adapter Classes

| Port         | Supabase Adapter          | InMemory Adapter          | Location             |
| ------------ | ------------------------- | ------------------------- | -------------------- |
| AuthPort     | `SupabaseAuthAdapter`     | `InMemoryAuthAdapter`     | `gateways/auth/`     |
| RealtimePort | `SupabaseRealtimeAdapter` | `InMemoryRealtimeAdapter` | `gateways/realtime/` |
| StoragePort  | `SupabaseStorageAdapter`  | `InMemoryStorageAdapter`  | `gateways/storage/`  |

### Related Files

- `packages/adapters/src/modules/UseCaseModule.ts` - Provider registration
- `packages/frameworks/src/di/test-container.ts` - Test container utilities
- `packages/adapters/src/gateways/auth/` - Auth adapters
- `packages/adapters/src/gateways/realtime/` - Realtime adapters
- `packages/adapters/src/gateways/storage/` - Storage adapters

---

_Last Updated: 2026-04-10_
