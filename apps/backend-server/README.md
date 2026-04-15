# @mirai-app/backend-server

Dedicated backend server for the MIRAI application, based on Bun, GraphQL with Pothos schema builder, and Effect framework.

## Running

```bash
# Development (with hot reload)
bun run dev

# Production
bun run start

# Tests
bun test

# Tests with coverage
bun run test:coverage

# Generate GraphQL SDL
bun run generate:sdl
```

## Configuration

The server requires the following environment variables:

```env
# Server port (default: 4000)
PORT=4000

# Supabase
SUPABASE_URL="http://localhost:8000"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# GraphQL (optional)
GRAPHQL_PLAYGROUND=true  # Enable GraphiQL in development
```

## GraphQL Architecture

The server uses a modern GraphQL architecture with code-first schema building:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│              (Native App / Web Dashboard)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Bun Server                              │
│              (HTTP + WebSocket on same port)                │
├──────────────────────┬──────────────────────────────────────┤
│   HTTP Requests      │    WebSocket Connections             │
│   POST /graphql      │    ws://host:port/graphql/ws         │
│   GET /health        │    (GraphQL Subscriptions)           │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 GraphQL Yoga Handler                          │
│          (Request parsing, validation, execution)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Pothos Schema Builder                       │
│     (Code-first type definitions + resolvers)               │
├──────────────────────┬──────────────────────────────────────┤
│  Types (src/graphql/ │   Resolvers (src/graphql/resolvers/) │
│  types/*.ts)         │   - User, Trip, Challenge, etc.      │
└──────────────────────┴──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              GraphQL Context (Effect-based)                 │
├─────────────────────────────────────────────────────────────┤
│  • controllers - 17 controllers via Effect Layer DI         │
│  • appLayer - Effect Layer with repositories & services     │
│  • runtime - Effect runtime for executing effects            │
│  • request - Hono request object for header access            │
│  • authContext - Pre-resolved auth (if token present)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Effect AppLayer                              │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer (19 repos) + Service Layer (5 services)    │
│  Layer.mergeAll() composes all dependencies                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Use Case Layer                             │
│         Effect-based business logic orchestration             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                        │
│  Supabase Auth, Drizzle ORM, Storage, Push Notifications    │
└─────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Bun**: High-performance JavaScript runtime with native WebSocket support
- **GraphQL Yoga**: Feature-rich GraphQL server with subscription support
- **Pothos**: Code-first schema builder with full TypeScript type inference
- **Effect**: Framework for composable, type-safe dependency injection and error handling
- **Hono**: Lightweight web framework for middleware and routing

## Authentication

The backend server supports authorization via JWT tokens from Supabase Auth.

### HTTP Requests (Queries & Mutations)

For HTTP requests, the token is passed in the `Authorization` header:

```typescript
const client = new GraphQLClient("http://localhost:4000/graphql", {
  headers: () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
```

### WebSocket Connections (Subscriptions)

For WebSocket connections (subscriptions), authentication uses http-only cookies:

1. **Login Flow**: Client authenticates via HTTP, server sets `auth-token` httpOnly cookie
2. **WebSocket Connect**: Browser automatically sends cookies with upgrade request
3. **Server Validation**: Server extracts and validates token from cookie header

```typescript
// Client-side (urql with graphql-ws)
import { createClient, subscriptionExchange } from "urql";
import { createWSClient } from "graphql-ws";

const wsClient = createWSClient({
  url: "ws://localhost:4000/graphql/ws",
  // Cookies are sent automatically - no manual token handling needed
});

const client = createClient({
  url: "/graphql",
  exchanges: [
    // ... other exchanges
    subscriptionExchange({
      forwardSubscription: (request) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(request, sink),
        }),
      }),
    }),
  ],
});
```

### Authorization Flow

1. **Client** (native/web application):
   - Gets `access_token` from Supabase session
   - Passes token in `Authorization: Bearer <token>` header (HTTP)
   - Cookies sent automatically (WebSocket)

2. **GraphQL Context** (`src/graphql/context.ts`):
   - Extracts token from `Authorization` header or cookies
   - Resolves auth context using Effect-based `authenticateUserUseCase`
   - Provides controllers via `context.controllers`

3. **Auth Helpers** (`src/graphql/utils/auth-helpers.ts`):
   - `requireAuth(context)` - Throws if not authenticated
   - `requireAdmin(context)` - Throws if not admin
   - `requireModerator(context)` - Throws if not moderator/admin
   - `getOptionalAuth(context)` - Returns null if not authenticated

### Auth Scopes (Pothos Plugin)

Pothos scope-auth plugin provides declarative authorization:

```typescript
builder.queryField("adminOnlyField", (t) =>
  t.field({
    type: "SomeType",
    authScopes: {
      admin: true, // Requires admin role
    },
    resolve: async (_root, _args, context) => {
      // Only executes if auth passes
      return await context.controllers.someController.getData();
    },
  }),
);
```

Available scopes:

- `public: true` - No authentication required
- `authenticated: true` - User must be logged in
- `admin: true` - User must have ADMIN or SERVICE role
- `moderator: true` - User must have MODERATOR, ADMIN, or SERVICE role

### Missing Token

When client connects **without** a token:

- Public queries/mutations work normally
- Authenticated fields throw `GraphQLError` with code `UNAUTHENTICATED`
- Admin fields throw `GraphQLError` with code `FORBIDDEN`

## Resolver Patterns

### Basic Resolver (Async/Await)

```typescript
import { builder } from "../builder";
import { requireAuth } from "../utils/auth-helpers";

builder.queryField("user", (t) =>
  t.field({
    type: "User",
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Access controller from context (Effect DI)
      const controller = context.controllers.userController;

      // Execute use case
      const result = await controller.getById({ id: args.id });

      // Handle errors
      if (result.kind === "err") {
        throw mapErrorToGraphQL(result.error);
      }

      return result.value;
    },
  }),
);
```

### Effect-Based Resolver (Recommended)

```typescript
import { Effect } from "effect";
import {
  requireAuthEffect,
  mapEffectErrorToGraphQL,
} from "../utils/auth-helpers";

builder.mutationField("createTrip", (t) =>
  t.field({
    type: "Trip",
    args: {
      input: t.arg({ type: CreateTripInput, required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_root, args, context) => {
      const program = Effect.gen(function* () {
        // Authentication in Effect
        const authContext = yield* requireAuthEffect(context);

        // Access controller
        const controller = context.controllers.tripController;

        // Execute use case with auth context
        const result = yield* Effect.promise(() =>
          controller.create({
            ...args.input,
            authContext,
          }),
        );

        if (result.success === false) {
          return yield* Effect.fail(new Error(result.error));
        }

        return result.data;
      });

      // Execute and handle errors
      const result = await Effect.runPromise(Effect.either(program));

      if (result._tag === "Left") {
        throw mapEffectErrorToGraphQL(result.left);
      }

      return result.right;
    },
  }),
);
```

### Controller Access Patterns

```typescript
// Direct access (recommended)
const userController = context.controllers.userController;
const tripController = context.controllers.tripController;

// Using getController helper
import { getController } from "../utils/resolver-helpers";
const userController = getController(context, "userController");

// Using ControllersFrom shortcuts
import { ControllersFrom } from "../utils/resolver-helpers";
const userController = ControllersFrom.user(context);
```

## GraphQL Endpoints

- `/health` - Health check endpoint (HTTP GET)
- `/graphql` - GraphQL endpoint (HTTP POST/GET)
- `/graphql` - GraphiQL playground (HTTP GET, development only)
- `/graphql/ws` - WebSocket endpoint for subscriptions
- `/graphql/health` - GraphQL-specific health check

### Server Information

```bash
curl http://localhost:4000/

{
  "name": "Mirai App GraphQL API (Bun + WebSocket)",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "graphqlHealth": "/graphql/health",
    "graphql": "/graphql",
    "graphqlWs": "/graphql/ws",
    "graphiql": "/graphql/graphiql"
  }
}
```

## Schema Generation

The GraphQL schema is generated from Pothos type definitions:

```bash
# Generate and save SDL to packages/graphql-client/src/generated/graphql/schema.graphql
bun run generate:sdl
```

This outputs the schema definition to `packages/graphql-client/src/generated/graphql/schema.graphql` for:

- GraphQL Code Generator (client SDK generation)
- Documentation
- External tooling

### Manual Schema Access

```typescript
import { schema, generateSDL } from "./graphql/schema";

// Get executable schema for Yoga
const yoga = createYoga({ schema });

// Generate SDL string
const sdl = generateSDL();
console.log(sdl);
```

## Testing

Tests are located in `src/__tests__/` and `src/graphql/__tests__/`:

```typescript
import { describe, it, expect } from "bun:test";
import { schema } from "../graphql/schema";
import { createDefaultYogaHandler } from "../graphql/yoga-handler";

describe("GraphQL API", () => {
  const yoga = createDefaultYogaHandler(true);

  it("should execute query", async () => {
    const response = await yoga.handle(
      new Request("http://localhost/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query {
              __typename
            }
          `,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.__typename).toBe("Query");
  });
});
```

### Test Commands

```bash
# All tests
bun test

# Bun server tests only
bun run test:bun

# Yoga/GraphQL integration tests only
bun run test:yoga

# All other tests
bun run test:rest

# With coverage
bun run test:coverage
```

## Monorepo Structure

The server uses shared packages:

- `@mirai-app/graphql-client` - Generated GraphQL client with React Query hooks
- `@mirai-app/adapters` - Controllers, mappers, and DI configuration (awilix → Effect Layer)
- `@mirai-app/use-cases` - Business logic interactors and ports (Effect-based)
- `@mirai-app/domain` - Domain entities, value objects, and errors
- `@mirai-app/frameworks` - Supabase, Drizzle ORM, and Effect Layer composition
- `@mirai-app/shared` - Shared utilities and logging

## Troubleshooting

### GraphQL Playground Not Loading

1. Check if `GRAPHQL_PLAYGROUND=true` is set in environment
2. Verify development mode: server logs should show "GraphiQL playground: ..."
3. Check browser console for CSP errors

### WebSocket Not Connecting

1. Check server is running: `curl http://localhost:4000/health`
2. Verify WebSocket URL uses `ws://` (not `http://`)
3. Check auth cookie is set (httpOnly cookies sent automatically)
4. Server logs show connection attempts

### Auth Errors in Resolvers

1. Verify `Authorization: Bearer <token>` header is present (HTTP)
2. Check auth cookie is set for WebSocket connections
3. Use auth helpers from `src/graphql/utils/auth-helpers.ts`:
   - `requireAuth()` throws proper GraphQL errors
   - `getOptionalAuth()` returns null for unauthenticated

### Schema Generation Fails

1. Check for TypeScript errors in type definitions
2. Ensure all Pothos types are properly registered
3. Run `bun run generate:sdl` with `DEBUG=pothos:*` for verbose output

### Effect Runtime Errors

1. Verify AppLayer is properly composed in `context.ts`
2. Check all required environment variables are set
3. Use `Effect.either()` to catch and handle errors gracefully

## Migration Notes

### From tRPC to GraphQL

| tRPC (Old)                               | GraphQL (New)                                              |
| ---------------------------------------- | ---------------------------------------------------------- |
| `createTRPCRouter()`                     | Pothos builder in `src/graphql/types/*.ts`                 |
| `publicProcedure` / `protectedProcedure` | `authScopes: { public: true }` / `{ authenticated: true }` |
| `ctx.container.resolve("xController")`   | `context.controllers.xController`                          |
| WebSocket `connectionParams`             | httpOnly cookies for auth                                  |
| `/trpc` endpoint                         | `/graphql` endpoint                                        |

### From Awilix to Effect

| Awilix (Old)              | Effect (New)                      |
| ------------------------- | --------------------------------- |
| `ctx.container.resolve()` | `context.controllers.xController` |
| Container-per-request     | Layer.mergeAll() at bootstrap     |
| `container.register()`    | `Layer.succeed()`                 |
| `container.cradle`        | `Effect.gen()` with `yield*`      |

For comprehensive architecture details, see:

- `CLAUDE.md` Core Architecture section: Clean Architecture with Effect
- `CLAUDE.md` Effect Framework section: Patterns and best practices
- `AGENTS.md` (root): Universal conventions
- **Note**: Backend `AGENTS.md` shows legacy tRPC patterns, use this README for current GraphQL patterns
