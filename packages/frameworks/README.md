# @mirai-app/frameworks - Frameworks Layer

> **Frameworks & Drivers layer of Clean Architecture - Technical configuration**
>
> Outermost layer - can depend on all inner layers

## Purpose

The frameworks layer contains:

- **GraphQL Configuration**: Yoga server and Pothos schema setup
- **Hono Configuration**: HTTP server setup
- **Drizzle Configuration**: Database ORM configuration
- **Supabase Configuration**: Supabase client setup
- **Effect Runtime**: Effect framework integration
- **DI Container**: awilix-modular dependency injection

## Rules

1. **Configuration Only**: No business logic, only framework setup
2. **Can Use All Inner Layers**: Depends on domain, use-cases, and adapters
3. **Framework-Specific Code**: Contains code specific to GraphQL, Hono, Drizzle, etc.
4. **Reusable Setup**: Configuration that can be reused across apps

## Directory Structure

```
src/
├── index.ts              # Public exports
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
├── di/                   # Dependency injection
│   ├── index.ts          # Container creation
│   ├── types.ts          # DI type definitions
│   └── modules/          # DI modules
├── layers/               # Effect Layer configurations
│   └── index.ts          # Layer compositions
├── auth/                 # Auth configuration
│   ├── client.ts         # Client auth setup
│   ├── server.ts         # Server auth setup
│   └── hooks/            # React auth hooks
└── stores/               # Zustand stores
```

## Example Usage

### GraphQL Client Configuration

```typescript
// graphql/client.tsx
import { createClient, fetchExchange } from "@urql/core";

export const createGraphQLClient(baseUrl: string) {
  return createClient({
    url: `${baseUrl}/graphql`,
    exchanges: [fetchExchange],
  });
}
```

### GraphQL Server Configuration

```typescript
// graphql/server.ts
import { createYoga } from "graphql-yoga";
import { createSchema } from "./schema";

export function createGraphQLServer() {
  return createYoga({
    schema: createSchema(),
    context: async ({ request }) => {
      // Create context with DI container
      return { container: await createRequestContainer(request) };
    },
  });
}
```

### Drizzle Client Configuration

```typescript
// drizzle/client.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
```

### Effect Runtime Configuration

```typescript
// layers/index.ts
import { Layer } from "effect";

export const AppLayer = Layer.mergeAll(
  RepositoryLayer,
  ServiceLayer,
  ConfigLayer,
);

// Usage in application entry point
const program = Effect.gen(function* () {
  const server = yield* HttpServer;
  yield* server.start();
});

Effect.runPromise(program.pipe(Effect.provide(AppLayer)));
```

## Testing

Framework tests verify configuration works:

```typescript
import { describe, it, expect } from "bun:test";
import { prisma } from "./prisma/client";

describe("Prisma Configuration", () => {
  it("should create client", () => {
    expect(prisma).toBeDefined();
  });

  it("should connect to database", async () => {
    const result = await prisma.$queryRaw`SELECT 1`;
    expect(result).toBeDefined();
  });
});
```

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (DDD section)
