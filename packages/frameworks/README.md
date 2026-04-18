# @mirai-app/frameworks - Frameworks Layer

> **Frameworks & Drivers layer of Clean Architecture - Technical configuration**
>
> Outermost layer - can depend on all inner layers
>
> **Effect Layer Composition:** Centralized dependency injection via Effect `Layer.mergeAll`

## Purpose

The frameworks layer contains:

- **GraphQL Configuration**: Yoga server and Pothos schema setup
- **Hono Configuration**: HTTP server setup
- **Drizzle Configuration**: Database ORM configuration
- **Supabase Configuration**: Supabase client setup
- **Effect Runtime**: Effect framework integration and Layer composition
- **Effect Layer Composition**: Dependency injection via `Layer.succeed` and `Layer.mergeAll`

## Rules

1. **Configuration Only**: No business logic, only framework setup
2. **Can Use All Inner Layers**: Depends on domain, use-cases, and adapters
3. **Framework-Specific Code**: Contains code specific to GraphQL, Hono, Drizzle, etc.
4. **Reusable Setup**: Configuration that can be reused across apps
5. **Layer Composition**: All DI via Effect Layers, no awilix-modular

## Directory Structure

```
src/
├── index.ts              # Public exports
├── better-auth/          # Better Auth configuration
│   ├── index.ts          # Better Auth factory
│   ├── schema.ts         # Drizzle schema for auth tables
│   └── client.ts         # Client-side auth utilities
├── graphql/              # GraphQL configuration
│   ├── client.tsx        # GraphQL client (urql)
│   ├── server.ts         # GraphQL Yoga server setup
│   └── schema.ts         # Pothos schema builder
├── hono/                 # Hono HTTP server configuration
│   └── server.ts         # Hono server setup
├── drizzle/              # Drizzle ORM configuration
│   ├── client.ts         # Database client setup
│   └── schema/           # Database schema definitions
├── supabase/             # Supabase configuration
│   ├── client.ts         # Supabase client setup
│   ├── react.tsx         # React integration
│   ├── server.ts         # Server-side client
│   └── store/            # Zustand auth store
├── di/                   # Effect DI composition
│   ├── index.ts          # DI exports
│   └── layer/            # Layer compositions
│       ├── app.ts        # Application layer
│       ├── repository.ts # Repository layer
│       ├── service.ts    # Service layer
│       └── test.ts       # Test layer
├── auth/                 # Auth configuration (legacy, being migrated)
│   ├── client.ts         # Client auth setup
│   ├── server.ts         # Server auth setup
│   └── hooks/            # React auth hooks
└── stores/               # Zustand stores
```

## Effect Layer Configuration

The frameworks layer provides **Effect Layer composition** for dependency injection, replacing the legacy awilix-modular approach.

### Layer Hierarchy

```
AppLayer (mergeAll)
├── RepositoryLayer (17 repositories)
│   ├── UserDomainLayer (User, Group, Location)
│   ├── TripRewardDomainLayer (Trip, Reward, RewardPurchase)
│   ├── ChallengeDomainLayer (Challenge, Submission, Vote)
│   ├── NotificationDomainLayer (Notification, Delivery, Schedule)
│   ├── ContentDomainLayer (ActivityFeed, Event, Sponsor)
│   └── ReportingDomainLayer (SubmissionReport, CoinTransaction)
│
└── ServiceLayer (3 services)
    ├── AuthServiceLayer (Auth)
    ├── StorageServiceLayer (SeaweedFS with native TUS)
    └── PubSubServiceLayer (PubSub)
```

### Better Auth Configuration

The frameworks layer provides Better Auth configuration using the Drizzle adapter:

```typescript
// packages/frameworks/src/better-auth/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";

export const createBetterAuth = (db: Database) => betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/api/auth",
  emailAndPassword: { enabled: true },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Integrate with notification service
      },
      expiresIn: 300, // 5 minutes
    }),
  ],
  session: {
    expiresIn: 604800,  // 7 days
    updateAge: 86400,   // 1 day
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    },
  },
});

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
```

**Key Features:**
- **Drizzle Adapter**: Uses existing database connection pool
- **Email/Password**: Traditional authentication
- **Email OTP**: Passwordless authentication with 5-minute expiration
- **Session Management**: 7-day expiry with automatic refresh
- **Security**: httpOnly, secure, sameSite=strict cookies

**Migration Support:**
The service layer uses Better Auth for authentication and SeaweedFS with native TUS for storage:

```typescript
// Service layer configuration
export const makeServiceLayer = (config: ServiceLayerConfig) => {
  // Better Auth for authentication
  const betterAuth = createBetterAuth(config.db);
  const authLayer = Layer.succeed(
    AuthPortTag, 
    new BetterAuthGateway(betterAuth)
  );

  // SeaweedFS with native TUS for storage
  const storageLayer = Layer.succeed(
    StoragePortTag,
    new SeaweedFSStorageGateway(config.storageConfig)
  );

  return Layer.mergeAll(authLayer, storageLayer);
};
```

See [`.specs/docs/auth.md`](../../.specs/docs/auth.md) for complete authentication documentation.

### Complete App Layer

Use `makeAppLayer()` for the complete dependency injection setup:

```typescript
// In application entry point or request handler
import {
  makeAppLayer,
  type AppLayerConfig,
} from "@mirai-app/frameworks/di";
import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase/client";
import { Effect } from "effect";

// Configuration
const config: AppLayerConfig = {
  supabase: createSupabaseClient(supabaseUrl, supabaseKey),
  db: createDrizzleClient(databaseUrl),
};

// Create the complete layer (22 bindings: 17 repos + 5 services)
const appLayer = makeAppLayer(config);

// Use in Effect program
const program = Effect.gen(function* () {
  const userRepo = yield* UserRepositoryTag;
  const auth = yield* AuthPortTag;
  const storage = yield* StoragePortTag;

  const user = yield* userRepo.findById("123");
  // ... orchestration logic
  return user;
}).pipe(Effect.provide(appLayer));

// Execute
const result = await Effect.runPromise(program);
```

### Repository Layer

The `RepositoryLayer` binds 17 repository Context.Tags to their Drizzle implementations:

```typescript
import {
  makeRepositoryLayer,
  makeUserDomainLayer,
} from "@mirai-app/frameworks/di";
import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";

const db = createDrizzleClient(databaseUrl);

// All 17 repositories
const fullRepoLayer = makeRepositoryLayer(db);

// Domain-specific layers (selective composition)
const userLayer = makeUserDomainLayer(db); // 3 repos
const tripLayer = makeTripRewardDomainLayer(db); // 3 repos
const challengeLayer = makeChallengeDomainLayer(db); // 3 repos

// Use in Effect
const program = Effect.gen(function* () {
  const userRepo = yield* UserRepositoryTag;
  return yield* userRepo.findById("123");
}).pipe(Effect.provide(userLayer));
```

**Domain Groups:**

| Factory                       | Repositories                                             | Count |
| ----------------------------- | -------------------------------------------------------- | ----- |
| `makeUserDomainLayer`         | User, Group, Location                                    | 3     |
| `makeTripRewardDomainLayer`   | Trip, Reward, RewardPurchase                             | 3     |
| `makeChallengeDomainLayer`    | Challenge, ChallengeSubmission, ChallengeVote            | 3     |
| `makeNotificationDomainLayer` | Notification, NotificationDelivery, NotificationSchedule | 3     |
| `makeContentDomainLayer`      | ActivityFeed, Event, Sponsor                             | 3     |
| `makeReportingDomainLayer`    | SubmissionReport, CoinTransaction                        | 2     |

### Service Layer

The `ServiceLayer` binds service Context.Tags to their adapter implementations:

```typescript
import {
  makeServiceLayer,
  makeAuthLayer,
  makeStorageLayer,
} from "@mirai-app/frameworks/di";
import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";

const db = createDrizzleClient(databaseUrl);

// All services
const serviceLayer = makeServiceLayer({ db });

// Individual service groups
const authLayer = makeAuthLayer(db); // Better Auth
const storageLayer = makeStorageLayer(storageConfig); // SeaweedFS with native TUS
const pubSubLayer = makePubSubServiceLayer(); // PubSub (no deps)

// Use in Effect
const program = Effect.gen(function* () {
  const auth = yield* AuthPortTag;
  const user = yield* auth.getCurrentUser();
  return user;
}).pipe(Effect.provide(authLayer));
```

**Service Groups:**

| Factory                     | Services                     | Dependencies        |
| --------------------------- | ---------------------------- | ------------------- |
| `makeAuthLayer`             | Authentication (Better Auth) | DrizzleDb           |
| `makeStorageLayer`          | Storage (SeaweedFS native TUS) | StorageConfig     |
| `makePubSubServiceLayer`    | PubSub                       | None                |
| `makeTelemetryServiceLayer` | Telemetry                    | DrizzleDb           |

### Factory Functions Reference

All layer factories are exported from `@mirai-app/frameworks/di`:

```typescript
// Complete application layer
makeAppLayer(config: AppLayerConfig): Layer<...>
makeRepositoriesOnlyLayer(db: DrizzleDb): Layer<...>
makeServicesOnlyLayer(config: ServiceLayerConfig): Layer<...>

// Domain-specific repository layers
makeUserDomainLayer(db: DrizzleDb): Layer<...>
makeTripRewardDomainLayer(db: DrizzleDb): Layer<...>
makeChallengeDomainLayer(db: DrizzleDb): Layer<...>
makeNotificationDomainLayer(db: DrizzleDb): Layer<...>
makeContentDomainLayer(db: DrizzleDb): Layer<...>
makeReportingDomainLayer(db: DrizzleDb): Layer<...>

// Service layers
makeAuthLayer(db: DrizzleDb): Layer<...>
makeStorageLayer(config: StorageConfig): Layer<...>
makeTelemetryServiceLayer(db: DrizzleDb): Layer<...>
makePubSubServiceLayer(): Layer<...>
```

## Testing with Effect

The frameworks layer provides comprehensive test utilities for Effect-based dependency injection.

### Quick Start

```typescript
import { createTestLayer, runWithTestLayer } from "@mirai-app/frameworks/di";
import { Effect } from "effect";
import { describe, it, expect } from "bun:test";

// Create test layer with all InMemory adapters
const testLayer = createTestLayer();

// Write your test
const program = Effect.gen(function* () {
  const userRepo = yield* UserRepositoryTag;
  const auth = yield* AuthPortTag;

  const user = yield* userRepo.findById("123");
  return user;
}).pipe(Effect.provide(testLayer));

// Run and assert
const result = await Effect.runPromise(program);
expect(result).toBeDefined();
```

### Test Layer with Overrides

```typescript
import { createTestLayer, mockLayerOf } from "@mirai-app/frameworks/di";
import { Layer } from "effect";

// Custom user repository
const customUserRepo = {
  findById: (id: string) => Effect.succeed({ id, name: "Test User" }),
  // ... other methods
};

// Create layer with override
const testLayer = createTestLayer({
  overrides: [mockLayerOf(UserRepositoryTag, customUserRepo)],
});

// Or use helper for multiple mocks
const { run } = createTestLayerWithHelpers({
  mocks: [
    { tag: UserRepositoryTag, implementation: customUserRepo },
    { tag: AuthPortTag, implementation: mockAuth },
  ],
});

const result = await run(program);
```

### Individual Service Test Layers

```typescript
import {
  createAuthTestLayer,
  createUserRepositoryTestLayer,
  createStorageTestLayer,
  createRealtimeTestLayer,
} from "@mirai-app/frameworks/di";

// Test only auth
const authLayer = createAuthTestLayer();
const authProgram = Effect.gen(function* () {
  const auth = yield* AuthPortTag;
  return yield* auth.verifyToken("token");
}).pipe(Effect.provide(authLayer));

// Test with custom implementation
const customRepo = new InMemoryUserGateway();
customRepo.users.set("123", { id: "123", name: "John" });
const userLayer = createUserRepositoryTestLayer(customRepo);
```

### Mock Helper Functions

```typescript
import {
  mockLayerOf,
  mockLayers,
  createMockAuthLayer,
  createMockRepositoryLayer,
  createMockPortLayer,
} from "@mirai-app/frameworks/di";

// Single mock layer
const mockLayer = mockLayerOf(UserRepositoryTag, {
  findById: (id) => Effect.succeed({ id, name: "Mock" }),
});

// Multiple mocks
const combinedLayer = mockLayers({
  userRepo: { tag: UserRepositoryTag, implementation: mockUserRepo },
  auth: { tag: AuthPortTag, implementation: mockAuth },
});

// Auth layer with overrides
const authLayer = createMockAuthLayer({
  verifyToken: () =>
    Effect.succeed({ userId: "123", email: "test@example.com" }),
});

// Repository layer with proxy
const repoLayer = createMockRepositoryLayer(UserRepositoryTag, {
  findById: (id) => Effect.succeed({ id, name: "Test" }),
  // Other methods will fail with "not mocked" error
});
```

### Test Layer Patterns Reference

| Pattern         | Function                                | Use Case                           |
| --------------- | --------------------------------------- | ---------------------------------- |
| Full test layer | `createTestLayer()`                     | Most tests - all InMemory adapters |
| With overrides  | `createTestLayer({ overrides })`        | Custom implementations             |
| Single service  | `createAuthTestLayer()`                 | Isolated service testing           |
| Minimal layer   | `createMinimalTestLayer({ services })`  | Subset of services                 |
| Mock layer      | `mockLayerOf(tag, impl)`                | Single mock binding                |
| Multiple mocks  | `mockLayers({ ... })`                   | Multiple mock bindings             |
| With helpers    | `createTestLayerWithHelpers({ mocks })` | Fluent API with run/provide        |
| Run helper      | `runWithTestLayer(layer, effect)`       | Clean execution                    |

## GraphQL Client Configuration

```typescript
// graphql/client.tsx
import { createClient, fetchExchange } from "@urql/core";

export function createGraphQLClient(baseUrl: string) {
  return createClient({
    url: `${baseUrl}/graphql`,
    exchanges: [fetchExchange],
  });
}
```

## GraphQL Server Configuration

```typescript
// graphql/server.ts
import { createYoga } from "graphql-yoga";
import { createSchema } from "./schema";
import { makeAppLayer } from "../layers";

export function createGraphQLServer(config: AppLayerConfig) {
  const appLayer = makeAppLayer(config);

  return createYoga({
    schema: createSchema(),
    context: async ({ request }) => {
      return { layer: appLayer };
    },
  });
}
```

## Drizzle Client Configuration

```typescript
// drizzle/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
export type DrizzleDb = typeof db;
```

## Effect Runtime Configuration

```typescript
// Running Effects with the complete layer
import { makeAppLayer } from "./layers";
import { Effect, Runtime } from "effect";

// Build the runtime once
const appLayer = makeAppLayer(config);
const runtime = await Effect.runPromise(Layer.toRuntime(appLayer));

// Use runtime for multiple operations
const runWithRuntime = <E, A>(effect: Effect.Effect<A, E, Requirements>) => {
  return Runtime.runPromise(runtime)(effect);
};

// In request handler
async function handleRequest(input: Input) {
  const program = Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag;
    return yield* userRepo.findById(input.userId);
  });

  return await runWithRuntime(program);
}
```

## Testing

Framework tests verify configuration works:

```typescript
import { describe, it, expect } from "bun:test";
import { createTestLayer } from "./di/test-layer";
import { Effect } from "effect";

describe("RepositoryLayer", () => {
  it("should provide all repositories", async () => {
    const testLayer = createTestLayer();

    const program = Effect.gen(function* () {
      const userRepo = yield* UserRepositoryTag;
      const groupRepo = yield* GroupRepositoryTag;
      return { userRepo, groupRepo };
    }).pipe(Effect.provide(testLayer));

    const result = await Effect.runPromise(program);
    expect(result.userRepo).toBeDefined();
    expect(result.groupRepo).toBeDefined();
  });
});
```

## Layer Composition Patterns

### Pattern 1: Complete App Layer (Recommended)

```typescript
// For full application use
const appLayer = makeAppLayer({ supabase, db });
```

### Pattern 2: Selective Composition

```typescript
// For testing or specific domains
const repoLayer = makeRepositoryLayer(db);
const serviceLayer = makeServiceLayer({ supabase, db });
const combined = Layer.mergeAll(repoLayer, serviceLayer);
```

### Pattern 3: Domain-Specific

```typescript
// For domain-specific workflows
const userLayer = makeUserDomainLayer(db);
const challengeLayer = makeChallengeDomainLayer(db);
const domainLayer = Layer.mergeAll(userLayer, challengeLayer);
```

### Pattern 4: Test Layer Override

```typescript
// Override specific implementations in tests
const baseLayer = makeAppLayer(config);
const testLayer = baseLayer.pipe(
  Layer.merge(mockRepositoryLayer),
  Layer.merge(mockServiceLayer),
);
```

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (Effect Framework Patterns)
- [AGENTS.md](../../AGENTS.md) - Quick reference for Effect patterns
- [`.specs/docs/auth.md`](../../.specs/docs/auth.md) - Authentication system documentation
- [`.specs/docs/adr/001-better-auth-migration.md`](../../.specs/docs/adr/001-better-auth-migration.md) - Better Auth migration ADR
- [docs/effect-decision-tree.md](../../docs/effect-decision-tree.md) - When to use Effect vs async/await
- [packages/frameworks/AGENTS.md](./AGENTS.md) - Framework layer quick reference
- [packages/use-cases/AGENTS.md](../use-cases/AGENTS.md) - Use case Effect patterns
- [packages/adapters/AGENTS.md](../adapters/AGENTS.md) - Adapter DI patterns
- [Better Auth Documentation](https://www.better-auth.com/) - Official Better Auth docs

### Effect Framework Resources

| Pattern             | Location                    | Reference         |
| ------------------- | --------------------------- | ----------------- |
| Layer composition   | `layers/AppLayer.ts`        | `Layer.mergeAll`  |
| Repository bindings | `layers/RepositoryLayer.ts` | `Layer.succeed`   |
| Service bindings    | `layers/ServiceLayer.ts`    | `Layer.succeed`   |
| Test utilities      | `di/test-layer.ts`          | `createTestLayer` |
| Barrel exports      | `layers/index.ts`           | Factory functions |

---

**Last Updated:** 2026-04-16  
**Version:** 2.0.1 (Updated DI structure)
