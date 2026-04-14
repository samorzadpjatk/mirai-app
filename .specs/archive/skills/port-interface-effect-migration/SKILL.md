# Port Interface Effect Migration Patterns

> **USE WHEN:** Migrating port interfaces from Result pattern to Effect pattern, implementing new ports with Effect, or standardizing error handling across ports.

---

## Quick Reference

### Migration Decision Tree

```
Port using Result<T,E> or Promise<Result<T,E>>?
├─ YES → MIGRATE to Effect.Effect<T, E, never>
│   ├─ Step 1: Update interface signatures
│   ├─ Step 2: Convert errors to Data.TaggedError
│   ├─ Step 3: Update adapter implementations
│   └─ Step 4: Update controller boundaries
│
└─ NO → Already Effect? → Verify Data.TaggedError usage
    ├─ Errors use Data.TaggedError? → ✅ Complete
    └─ Errors use manual _tag? → REFACTOR to Data.TaggedError
```

---

## Migration Patterns

### Pattern 1: Interface Signature Migration

**Before (Result Pattern):**

```typescript
// packages/use-cases/src/ports/ExamplePort.ts
import type { Result } from "@mirai-app/domain";

export interface ExamplePort {
  findById(id: string): Promise<Result<User, NotFoundError>>;
  create(user: User): Promise<Result<User, DuplicateError>>;
  delete(id: string): Promise<Result<void, NotFoundError>>;
}
```

**After (Effect Pattern):**

```typescript
// packages/use-cases/src/ports/ExamplePort.ts
import { Effect } from "effect";

export interface ExamplePort {
  findById(id: string): Effect.Effect<User | null, never, never>;
  create(user: User): Effect.Effect<User, DuplicateError, never>;
  delete(id: string): Effect.Effect<void, NotFoundError, never>;
}

// Context.Tag for Effect dependency injection
export class ExamplePortTag extends Context.Tag("ExamplePort")<
  ExamplePortTag,
  ExamplePort
>() {}
```

**Key Changes:**

- Replace `Promise<Result<T, E>>` with `Effect.Effect<T, E, never>`
- Add `Context.Tag` for Effect-native DI (optional but recommended)
- Errors become part of the type signature (tracked at compile time)

---

### Pattern 2: Error Definition Migration

**Before (Manual Error Classes):**

```typescript
export class NotFoundError extends Error {
  readonly _tag = "NotFoundError" as const;
  readonly code = "NOT_FOUND" as const;
  readonly resource: string;
  readonly id: string;

  constructor(props: { resource: string; id: string }) {
    super(`${props.resource} not found: ${props.id}`);
    this.resource = props.resource;
    this.id = props.id;
  }
}
```

**After (Data.TaggedError):**

```typescript
import { Data } from "effect";

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string;
  readonly id: string;
}> {
  // Optional: override message for better debugging
  override readonly message = `${this.resource} not found: ${this.id}`;
}
```

**Benefits:**

1. **Immutable:** Errors are plain objects, not class instances
2. **Type-safe:** `_tag` is automatically typed as literal string
3. **Composable:** Native integration with Effect error handling
4. **Structural equality:** Works with Effect's equality checks

---

### Pattern 3: Adapter Implementation Migration

**Before (Promise + try/catch):**

```typescript
// packages/adapters/src/gateways/ExampleAdapter.ts
export class ExampleAdapter implements ExamplePort {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<Result<User | null, never>> {
    try {
      const user = await this.db.findById(id);
      return ok(user ? toDomain(user) : null);
    } catch (error) {
      // Unexpected error - should not happen
      throw error;
    }
  }

  async create(user: User): Promise<Result<User, DuplicateError>> {
    try {
      const created = await this.db.create(toDb(user));
      return ok(toDomain(created));
    } catch (error) {
      if (isDuplicateError(error)) {
        return err(new DuplicateError({ email: user.email }));
      }
      throw error; // Defect - not recoverable
    }
  }
}
```

**After (Effect.tryPromise):**

```typescript
// packages/adapters/src/gateways/ExampleAdapter.ts
import { Effect, Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {}

export class ExampleAdapter implements ExamplePort {
  constructor(private readonly db: DatabaseClient) {}

  findById(id: string): Effect.Effect<User | null, never, never> {
    return Effect.tryPromise({
      try: () => this.db.findById(id),
      catch: (error) =>
        new DatabaseError({ operation: "findById", cause: error }),
    }).pipe(
      Effect.map((user) => (user ? toDomain(user) : null)),
      // Database errors are defects at this layer - let them crash
      Effect.catchTag("DatabaseError", (e) => Effect.die(e)),
    );
  }

  create(user: User): Effect.Effect<User, DuplicateError, never> {
    return Effect.tryPromise({
      try: () => this.db.create(toDb(user)),
      catch: (error) => {
        if (isDuplicateError(error)) {
          return new DuplicateError({ email: user.email });
        }
        // Defects should crash - not recoverable
        throw error;
      },
    }).pipe(Effect.map((created) => toDomain(created)));
  }
}
```

**Key Principles:**

- Use `Effect.tryPromise` to wrap async external calls
- Convert only expected errors to domain error types
- Let unexpected errors bubble up as defects (or use `Effect.die`)
- Use `Effect.map` for data transformations
- Use `Effect.catchTag` for specific error handling

---

### Pattern 4: Controller Boundary Migration

**Before (Result handling):**

```typescript
// packages/adapters/src/controllers/ExampleController.ts
export class ExampleController {
  constructor(private readonly examplePort: ExamplePort) {}

  async getById(input: { id: string }): Promise<UserDTO> {
    const result = await this.examplePort.findById(input.id);

    if (isErr(result)) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    if (!result.value) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return toDTO(result.value);
  }
}
```

**After (Effect.runPromise):**

```typescript
// packages/adapters/src/controllers/ExampleController.ts
import { Effect, Either } from "effect";
import { TRPCError } from "@trpc/server";

export class ExampleController {
  constructor(private readonly examplePort: ExamplePort) {}

  async getById(input: { id: string }): Promise<UserDTO> {
    const effect = this.examplePort.findById(input.id);

    // Convert null to NotFound error
    const withNotFound = effect.pipe(
      Effect.flatMap(
        Effect.fromNullable(
          () => new NotFoundError({ resource: "User", id: input.id }),
        ),
      ),
    );

    // Run at boundary and convert to Either for pattern matching
    const result = await Effect.runPromise(Effect.either(withNotFound));

    if (Either.isLeft(result)) {
      const error = result.left;
      switch (error._tag) {
        case "NotFoundError":
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `User not found: ${error.id}`,
          });
        default:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unknown error",
          });
      }
    }

    return toDTO(result.right);
  }
}
```

---

## Complete Port Migration Example

### Step 1: Define Errors with Data.TaggedError

```typescript
// packages/use-cases/src/ports/errors.ts
import { Data } from "effect";

export class RealtimeError extends Data.TaggedError("RealtimeError")<{
  readonly message: string;
  readonly code?: string;
}> {}

export class ConnectionError extends Data.TaggedError("ConnectionError")<{
  readonly message: string;
  readonly channel?: string;
}> {}

export class SubscriptionError extends Data.TaggedError("SubscriptionError")<{
  readonly message: string;
  readonly channel: string;
}> {}
```

### Step 2: Define Port Interface

```typescript
// packages/use-cases/src/ports/RealtimePort.ts
import { Context, Effect } from "effect";
import type {
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "./errors";

export type ConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "CLOSED";

export interface ChannelConfig {
  events?: string[];
  filter?: string;
  onMessage?: (event: string, payload: unknown) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

export interface RealtimeSubscription {
  readonly id: string;
  readonly channel: string;
  readonly state: ConnectionState;
  unsubscribe(): Effect.Effect<void, RealtimeError, never>;
}

export interface PresenceState {
  userId: string;
  payload?: Record<string, unknown>;
  timestamp?: Date;
}

export interface RealtimePort {
  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | SubscriptionError,
    never
  >;

  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<void, RealtimeError, never>;

  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<void, RealtimeError, never>;

  getConnectionState(): ConnectionState;
}

export class RealtimePortTag extends Context.Tag("RealtimePort")<
  RealtimePortTag,
  RealtimePort
>() {}
```

### Step 3: Implement Adapter with Effect.tryPromise

```typescript
// packages/adapters/src/gateways/realtime/SupabaseRealtimeAdapter.ts
import { Effect, Data } from "effect";
import type {
  RealtimePort,
  RealtimeSubscription,
  ChannelConfig,
  PresenceState,
  ConnectionState,
} from "@mirai-app/use-cases";
import {
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "@mirai-app/use-cases";
import type {
  SupabaseClient,
  RealtimeChannel,
} from "@mirai-app/frameworks/supabase";

class SupabaseRealtimeSubscription implements RealtimeSubscription {
  constructor(
    private readonly channel: RealtimeChannel,
    readonly channel: string,
    readonly id: string,
  ) {}

  get state(): ConnectionState {
    // Map internal state to domain state
    return mapSupabaseState(this.channel.state);
  }

  unsubscribe(): Effect.Effect<void, RealtimeError, never> {
    return Effect.try({
      try: () => {
        this.channel.unsubscribe();
      },
      catch: (error) =>
        new RealtimeError({
          message: `Failed to unsubscribe: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
    });
  }
}

export class SupabaseRealtimeAdapter implements RealtimePort {
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private subscriptionCounter = 0;

  constructor(private readonly supabase: SupabaseClient) {}

  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | SubscriptionError,
    never
  > {
    return Effect.try({
      try: () => {
        const supabaseChannel = this.supabase.channel(channel);

        // Setup event listeners
        if (config.events?.length) {
          for (const event of config.events) {
            supabaseChannel.on("broadcast", { event }, (payload) => {
              config.onMessage?.(event, payload);
            });
          }
        }

        // Subscribe
        supabaseChannel.subscribe((status) => {
          config.onConnectionChange?.(mapSupabaseStatus(status));
        });

        this.activeChannels.set(channel, supabaseChannel);

        const subscriptionId = `sub-${++this.subscriptionCounter}`;
        return new SupabaseRealtimeSubscription(
          supabaseChannel,
          channel,
          subscriptionId,
        );
      },
      catch: (error) => {
        if (error instanceof SubscriptionError) return error;
        return new SubscriptionError({
          message: error instanceof Error ? error.message : "Unknown error",
          channel,
        });
      },
    });
  }

  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<void, RealtimeError, never> {
    return Effect.tryPromise({
      try: async () => {
        let supabaseChannel = this.activeChannels.get(channel);

        if (!supabaseChannel) {
          supabaseChannel = this.supabase.channel(channel);
          await new Promise<void>((resolve, reject) => {
            supabaseChannel!.subscribe((status) => {
              if (status === "SUBSCRIBED") resolve();
              if (status === "CHANNEL_ERROR")
                reject(new Error("Channel error"));
            });
          });
          this.activeChannels.set(channel, supabaseChannel);
        }

        const { error } = await supabaseChannel.send({
          type: "broadcast",
          event,
          payload,
        });

        if (error) throw new RealtimeError({ message: error.message });
      },
      catch: (error) =>
        error instanceof RealtimeError
          ? error
          : new RealtimeError({
              message: `Broadcast failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            }),
    });
  }

  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<void, RealtimeError, never> {
    return Effect.tryPromise({
      try: async () => {
        let supabaseChannel = this.activeChannels.get(channel);

        if (!supabaseChannel) {
          supabaseChannel = this.supabase.channel(channel);
          await new Promise<void>((resolve, reject) => {
            supabaseChannel!.subscribe((status) => {
              if (status === "SUBSCRIBED") resolve();
              if (status === "CHANNEL_ERROR")
                reject(new Error("Channel error"));
            });
          });
          this.activeChannels.set(channel, supabaseChannel);
        }

        const { error } = await supabaseChannel.track({
          userId: state.userId,
          ...state.payload,
          timestamp: state.timestamp?.toISOString(),
        });

        if (error) throw new RealtimeError({ message: error.message });
      },
      catch: (error) =>
        error instanceof RealtimeError
          ? error
          : new RealtimeError({
              message: `Presence tracking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            }),
    });
  }

  getConnectionState(): ConnectionState {
    // Aggregate state from all channels
    if (this.activeChannels.size === 0) return "CLOSED";

    for (const [, channel] of this.activeChannels) {
      if (channel.state === "open") return "CONNECTED";
    }

    return "DISCONNECTED";
  }
}
```

### Step 4: Implement In-Memory Adapter for Testing

```typescript
// packages/adapters/src/gateways/realtime/InMemoryRealtimeAdapter.ts
import { Effect } from "effect";
import type {
  RealtimePort,
  RealtimeSubscription,
  ChannelConfig,
  PresenceState,
  ConnectionState,
} from "@mirai-app/use-cases";
import { RealtimeError, SubscriptionError } from "@mirai-app/use-cases";

class InMemoryRealtimeSubscription implements RealtimeSubscription {
  private _state: ConnectionState = "CONNECTED";

  constructor(
    readonly id: string,
    readonly channel: string,
    private readonly cleanup: () => void,
  ) {}

  get state(): ConnectionState {
    return this._state;
  }

  setState(state: ConnectionState): void {
    this._state = state;
  }

  unsubscribe(): Effect.Effect<void, RealtimeError, never> {
    return Effect.sync(() => {
      this._state = "CLOSED";
      this.cleanup();
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new RealtimeError({
            message: `Failed to unsubscribe: ${error instanceof Error ? error.message : "Unknown error"}`,
          }),
        ),
      ),
    );
  }
}

export class InMemoryRealtimeAdapter implements RealtimePort {
  private subscriptions: Map<string, InMemoryRealtimeSubscription[]> =
    new Map();
  private channelConfigs: Map<string, ChannelConfig[]> = new Map();
  private presenceData: Map<string, Map<string, PresenceState>> = new Map();
  private subscriptionCounter = 0;
  private globalState: ConnectionState = "CONNECTED";

  subscribe(
    channel: string,
    config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | SubscriptionError,
    never
  > {
    return Effect.sync(() => {
      if (this.globalState === "CLOSED") {
        throw new SubscriptionError({
          message: "Cannot subscribe: adapter is closed",
          channel,
        });
      }

      const subscriptionId = `inmem-sub-${++this.subscriptionCounter}`;

      const cleanup = () => this.removeSubscription(channel, subscriptionId);

      const subscription = new InMemoryRealtimeSubscription(
        subscriptionId,
        channel,
        cleanup,
      );

      // Store subscription
      const subs = this.subscriptions.get(channel) ?? [];
      const configs = this.channelConfigs.get(channel) ?? [];
      subs.push(subscription);
      configs.push(config);
      this.subscriptions.set(channel, subs);
      this.channelConfigs.set(channel, configs);

      // Notify connection change
      config.onConnectionChange?.("CONNECTED");

      return subscription;
    }).pipe(
      Effect.catchAllDefect((error) => {
        if (error instanceof SubscriptionError) {
          return Effect.fail(error);
        }
        return Effect.fail(
          new SubscriptionError({
            message: `Subscription failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            channel,
          }),
        );
      }),
    );
  }

  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<void, RealtimeError, never> {
    return Effect.tryPromise({
      try: async () => {
        const channelSubscriptions = this.subscriptions.get(channel);
        const channelConfigs = this.channelConfigs.get(channel);

        if (!channelSubscriptions || !channelConfigs) {
          return; // No subscribers - not an error
        }

        for (let i = 0; i < channelSubscriptions.length; i++) {
          const subscription = channelSubscriptions[i];
          const config = channelConfigs[i];

          if (subscription.state === "CLOSED") continue;

          // Check if event is in configured events list
          if (config.events?.length && !config.events.includes(event)) {
            continue;
          }

          try {
            config.onMessage?.(event, payload);
          } catch (error) {
            // Log but don't fail - other subscribers should still receive
            console.warn(
              `Message handler error for subscription ${subscription.id}`,
              error,
            );
          }
        }
      },
      catch: (error) =>
        new RealtimeError({
          message: `Broadcast failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
    });
  }

  trackPresence(
    channel: string,
    state: PresenceState,
  ): Effect.Effect<void, RealtimeError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (!this.presenceData.has(channel)) {
          this.presenceData.set(channel, new Map());
        }

        const channelPresence = this.presenceData.get(channel)!;
        channelPresence.set(state.userId, {
          ...state,
          timestamp: state.timestamp ?? new Date(),
        });
      },
      catch: (error) =>
        new RealtimeError({
          message: `Presence tracking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
    });
  }

  getConnectionState(): ConnectionState {
    return this.globalState;
  }

  // Test helpers
  setConnectionState(state: ConnectionState): void {
    this.globalState = state;
    for (const [, configs] of this.channelConfigs) {
      for (const config of configs) {
        config.onConnectionChange?.(state);
      }
    }
  }

  clear(): void {
    for (const [, subs] of this.subscriptions) {
      for (const sub of subs) {
        sub.setState("CLOSED");
      }
    }
    this.subscriptions.clear();
    this.channelConfigs.clear();
    this.presenceData.clear();
    this.globalState = "CONNECTED";
  }

  private removeSubscription(channel: string, subscriptionId: string): void {
    const channelSubs = this.subscriptions.get(channel);
    const channelConfigs = this.channelConfigs.get(channel);

    if (channelSubs && channelConfigs) {
      const index = channelSubs.findIndex((sub) => sub.id === subscriptionId);
      if (index !== -1) {
        channelSubs.splice(index, 1);
        channelConfigs.splice(index, 1);

        if (channelSubs.length === 0) {
          this.subscriptions.delete(channel);
          this.channelConfigs.delete(channel);
        }
      }
    }
  }
}
```

---

## Testing Patterns

### Testing Ports with In-Memory Adapters

```typescript
// packages/use-cases/src/ports/__tests__/RealtimePort.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryRealtimeAdapter } from "@mirai-app/adapters";
import type { RealtimePort, RealtimeSubscription } from "./RealtimePort";

describe("[UNIT] RealtimePort (InMemoryRealtimeAdapter)", () => {
  let adapter: InMemoryRealtimeAdapter;
  let receivedMessages: Array<{ event: string; payload: unknown }>;

  beforeEach(() => {
    adapter = new InMemoryRealtimeAdapter();
    receivedMessages = [];
  });

  it("should subscribe to channel and receive messages", async () => {
    const channel = "test-channel";
    const event = "test-event";
    const payload = { data: "value" };

    // Subscribe
    const subscription = await Effect.runPromise(
      adapter.subscribe(channel, {
        events: [event],
        onMessage: (evt, data) => {
          receivedMessages.push({ event: evt, payload: data });
        },
      }),
    );

    expect(subscription.channel).toBe(channel);
    expect(subscription.state).toBe("CONNECTED");

    // Broadcast
    await Effect.runPromise(adapter.broadcast(channel, event, payload));

    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].event).toBe(event);
    expect(receivedMessages[0].payload).toEqual(payload);
  });

  it("should fail subscription when adapter is closed", async () => {
    adapter.setConnectionState("CLOSED");

    const either = await Effect.runPromise(
      Effect.either(
        adapter.subscribe("test-channel", {
          onMessage: () => {},
        }),
      ),
    );

    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left._tag).toBe("SubscriptionError");
    }
  });

  it("should unsubscribe successfully", async () => {
    const subscription = await Effect.runPromise(
      adapter.subscribe("test-channel", {
        onMessage: () => {},
      }),
    );

    await Effect.runPromise(subscription.unsubscribe());

    expect(subscription.state).toBe("CLOSED");
    expect(adapter.getSubscribers("test-channel")).toHaveLength(0);
  });

  it("should track presence", async () => {
    const channel = "presence-channel";
    const userId = "user-123";

    await Effect.runPromise(
      adapter.trackPresence(channel, {
        userId,
        payload: { status: "online" },
      }),
    );

    const presence = adapter.getPresenceData(channel);
    expect(presence?.get(userId)?.userId).toBe(userId);
    expect(presence?.get(userId)?.payload?.status).toBe("online");
  });
});
```

---

## Common Pitfalls

### Pitfall 1: Mixing Result and Effect

```typescript
// WRONG - Don't use Result inside Effect
import { Result } from "@mirai-app/domain";

interface BadPort {
  doSomething(): Effect.Effect<Result<Data, Error>, never, never>; // ❌
}

// CORRECT - Use Effect directly
interface GoodPort {
  doSomething(): Effect.Effect<Data, Error, never>; // ✅
}
```

### Pitfall 2: Using Exceptions for Expected Errors

```typescript
// WRONG - Don't throw for expected errors
class BadAdapter implements Port {
  doSomething(): Effect.Effect<Data, never, never> {
    return Effect.gen(function* () {
      const result = yield* someOperation;
      if (!result) {
        throw new Error("Not found"); // ❌
      }
      return result;
    });
  }
}

// CORRECT - Use Effect.fail for expected errors
class GoodAdapter implements Port {
  doSomething(): Effect.Effect<Data, NotFoundError, never> {
    return Effect.gen(function* () {
      const result = yield* someOperation;
      if (!result) {
        return yield* Effect.fail(new NotFoundError({ id: "123" })); // ✅
      }
      return result;
    });
  }
}
```

### Pitfall 3: Forgetting to Use Data.TaggedError

```typescript
// WRONG - Manual _tag property
export class ManualError extends Error {
  readonly _tag = "ManualError" as const; // ❌
  constructor(readonly message: string) {
    super(message);
  }
}

// CORRECT - Use Data.TaggedError
export class TaggedError extends Data.TaggedError("TaggedError")<{
  readonly message: string;
}> {} // ✅
```

### Pitfall 4: Using Promises in Adapters Instead of Effect

```typescript
// WRONG - Async method returns Promise
class BadAdapter implements Port {
  async doSomething(): Promise<Data> {
    // ❌
    return await externalCall();
  }
}

// CORRECT - Return Effect, wrap with tryPromise
class GoodAdapter implements Port {
  doSomething(): Effect.Effect<Data, Error, never> {
    // ✅
    return Effect.tryPromise({
      try: () => externalCall(),
      catch: (error) => new Error(String(error)),
    });
  }
}
```

---

## Migration Checklist

- [ ] Identify all ports using Result pattern
- [ ] Define errors using `Data.TaggedError`
- [ ] Update port interface signatures to `Effect.Effect<T, E, never>`
- [ ] Add `Context.Tag` for Effect-native DI (optional)
- [ ] Update adapter implementations to use `Effect.tryPromise`
- [ ] Update controller boundaries to use `Effect.runPromise`
- [ ] Write tests for new Effect-based implementations
- [ ] Verify error types are properly tracked
- [ ] Update documentation

---

## References

- [Effect Documentation](https://effect.website/docs/introduction)
- [Effect Error Management](https://effect.website/docs/error-management/expected-errors)
- [Effect Context Tag](https://effect.website/docs/requirements-management/default-services)
- `.claude/skills/effect-patterns/SKILL.md` - General Effect patterns
- `.claude/skills/effect-framework-migration/SKILL.md` - Framework migration guide
