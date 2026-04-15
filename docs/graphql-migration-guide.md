# GraphQL Migration Guide

## Overview

This guide documents the migration from tRPC to GraphQL with Pothos schema builder in the MIRAI/PJApp backend. It covers server-side resolver patterns, client-side usage with urql, authentication changes, error handling, and testing.

### Why GraphQL?

| Aspect                 | tRPC (Old)                    | GraphQL (New)                        |
| ---------------------- | ----------------------------- | ------------------------------------ |
| **Type Safety**        | Excellent with TypeScript     | Excellent with Pothos code-first     |
| **Client Flexibility** | Requires TypeScript client    | Any client can introspect schema     |
| **Query Control**      | Fixed procedure outputs       | Clients select exact fields needed   |
| **Tooling**            | Limited ecosystem             | Rich ecosystem (Playground, codegen) |
| **Real-time**          | WebSocket with manual routing | Native subscriptions + WebSocket     |
| **Documentation**      | Manual                        | Self-documenting schema              |

### Key Migration Changes

- **Endpoint**: `/trpc` → `/graphql`
- **Auth (HTTP)**: `Authorization: Bearer <token>` (unchanged)
- **Auth (WebSocket)**: `connectionParams.authToken` → http-only cookies
- **DI Pattern**: `ctx.container.resolve("xController")` → `context.controllers.x`
- **Error Format**: `TRPCError` → `GraphQLError` with `extensions.code`
- **Client**: `@trpc/client` → `urql` with generated hooks

---

## Breaking Changes Summary

| Feature         | Old (tRPC)                               | New (GraphQL)            | Impact                 |
| --------------- | ---------------------------------------- | ------------------------ | ---------------------- |
| Endpoint        | `/trpc`                                  | `/graphql`               | Update all API URLs    |
| WebSocket Auth  | `connectionParams.authToken`             | http-only cookie         | Simpler, more secure   |
| HTTP Auth       | `Authorization: Bearer <token>`          | Same (unchanged)         | No change needed       |
| DI Resolution   | `ctx.container.resolve()`                | `context.controllers.x`  | Simpler access pattern |
| Auth Procedures | `publicProcedure` / `protectedProcedure` | `authScopes`             | Declarative auth       |
| Error Codes     | `TRPCError.code`                         | `extensions.code`        | Update error handling  |
| Pagination      | Offset-based only                        | Connection/offset hybrid | Flexible pagination    |
| Input Types     | Zod schemas                              | GraphQL input types      | Different validation   |
| Return Types    | Fixed DTOs                               | Flexible field selection | Client controls shape  |

---

## Server-Side Migration

### Resolver Structure

#### Old (tRPC - Deprecated)

```typescript
// apps/backend-server/src/trpc/routers/userRouter.ts
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@mirai-app/frameworks/trpc";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Old pattern - no longer available
      // Controllers now accessed via ctx.controllers
    }),
});
```

#### New (GraphQL)

```typescript
// apps/backend-server/src/graphql/resolvers/User.ts
import { builder } from "../builder";
import { requireAuth, requireAdmin } from "../utils/auth-helpers";
import { handleControllerResult } from "../utils/error-mapper";

// Query field with auth scope
builder.queryField("user", (t) =>
  t.field({
    description: "Get a user by their unique ID",
    type: "User",
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_root, args, context) => {
      await requireAuth(context);

      // New DI pattern - direct controller access
      const controller = context.controllers.userController;

      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// Mutation with admin auth scope
builder.mutationField("createUser", (t) =>
  t.field({
    description: "Create a new user (admin only)",
    type: UserCreateResultType,
    authScopes: { admin: true },
    args: {
      input: t.arg({ type: CreateUserInput, required: true }),
    },
    resolve: async (_root, args, context) => {
      await requireAdmin(context);

      const controller = context.controllers.userController;

      const result = await controller.create({
        authUserId: args.input.authUserId,
        firstName: args.input.firstName,
        lastName: args.input.lastName,
        role: args.input.role ?? undefined,
      });

      return handleControllerResult(result);
    },
  }),
);
```

### Type Definitions

#### Old (tRPC + Zod)

```typescript
// Zod schema for input validation
const CreateUserSchema = z.object({
  authUserId: z.string(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
});

// Return type inferred from procedure
export type CreateUserOutput = Awaited<ReturnType<typeof userRouter.create>>;
```

#### New (Pothos)

```typescript
// apps/backend-server/src/graphql/types/User.ts
import { builder, UserRoleEnum } from "../builder";

// GraphQL Object Type
export const UserType = builder.objectType("User", {
  description: "A user in the Mirai App system",
  authScopes: { public: true },
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique identifier (UUID)" }),
    authUserId: t.exposeString("authUserId"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    fullName: t.exposeString("fullName"),
    role: t.field({
      type: UserRoleEnum,
      resolve: (user) => user.role,
    }),
    hasAvatar: t.exposeBoolean("hasAvatar"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (user) => user.createdAt,
    }),
    isAdmin: t.boolean({
      resolve: (user) => user.role === "ADMIN" || user.role === "SERVICE",
    }),
  }),
});

// Input Types
export const CreateUserInput = builder.inputType("CreateUserInput", {
  description: "Input for creating a new user",
  fields: (t) => ({
    authUserId: t.string({ required: true }),
    firstName: t.string({ required: true }),
    lastName: t.string({ required: true }),
    role: t.field({ type: UserRoleEnum, required: false }),
  }),
});

// Result Types for Mutations
export const UserCreateResultType = builder.objectType("UserCreateResult", {
  description: "Result of creating a new user",
  authScopes: { public: true },
  fields: (t) => ({
    id: t.exposeID("id"),
    authUserId: t.exposeString("authUserId"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    fullName: t.exposeString("fullName"),
    role: t.field({ type: UserRoleEnum, resolve: (user) => user.role }),
    hasAvatar: t.exposeBoolean("hasAvatar"),
    createdAt: t.field({ type: "DateTime", resolve: (user) => user.createdAt }),
  }),
});
```

### Context Structure

#### GraphQL Context (Current)

```typescript
// apps/backend-server/src/graphql/context.ts
export interface GraphQLContext {
  controllers: Controllers; // All 17 controllers instantiated
  appLayer: Layer.Layer<unknown>; // Effect layer for DI
  request: Request; // Hono request object
  runtime: GraphQLRuntime; // Effect runtime
  authContext?: AuthContext; // Pre-resolved auth (optional)
}

// Usage in resolver
const controller = context.controllers.userController;
```

### Dependency Injection Pattern

```typescript
// Controllers are pre-instantiated on context
const userController = context.controllers.userController;
const tripController = context.controllers.tripController;

// For Supabase or other services, access through appLayer
const program = Effect.gen(function* () {
  const supabase = yield* SupabaseTag;
  // ... use supabase
}).pipe(Effect.provide(context.appLayer));
```

---

## Authentication Migration

### HTTP Authentication (Unchanged)

Both old and new use the same pattern:

```
Authorization: Bearer <token>
```

### WebSocket Authentication (Changed)

#### Old (tRPC WebSocket)

```typescript
// Client-side
const wsClient = createWSClient({
  url: "wss://api.mirai.com/trpc",
  connectionParams: () => ({
    authToken: getAuthToken(), // Send token in connection params
  }),
});

// Server-side
const token = ctx.connectionParams?.authToken;
```

#### New (GraphQL WebSocket)

```typescript
// Client-side (urql)
import { createClient, subscriptionExchange } from "urql";
import { createClient as createWSClient } from "graphql-ws";

const wsClient = createWSClient({
  url: "wss://api.mirai.com/graphql",
  // No connectionParams needed - cookie is sent automatically
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

The server extracts the token from the http-only cookie sent with the WebSocket upgrade request.

### Auth Scopes in Resolvers

#### Old (tRPC Procedures)

```typescript
// Router-level auth patterns
export const userRouter = createTRPCRouter({
  // Public - no auth required
  getById: publicProcedure.query(...),

  // Protected - requires authentication
  update: protectedProcedure.mutation(...),

  // Admin only - checked in resolver
  create: protectedProcedure.mutation(async ({ ctx, input }) => {
    const authContext = await requireAdmin(ctx.headers, ctx.container);
    // ...
  }),
});
```

#### New (GraphQL authScopes)

```typescript
// Declarative auth at field level
builder.queryField("user", (t) =>
  t.field({
    type: "User",
    authScopes: { authenticated: true }, // Requires login
    resolve: async (_root, args, context) => {
      const authContext = await requireAuth(context);
      // ...
    },
  }),
);

builder.queryField("users", (t) =>
  t.field({
    type: ["User"],
    authScopes: { admin: true }, // Requires admin role
    resolve: async (_root, args, context) => {
      const authContext = await requireAdmin(context);
      // ...
    },
  }),
);

builder.queryField("moderatorData", (t) =>
  t.field({
    type: "ModeratorData",
    authScopes: { moderator: true }, // Requires moderator or higher
    resolve: async (_root, args, context) => {
      const authContext = await requireModerator(context);
      // ...
    },
  }),
);
```

### Auth Helpers

#### Old (tRPC Controllers)

```typescript
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "@mirai-app/adapters";

async function someAction(input: Input, di: DIContext) {
  // Throws TRPCError if missing/invalid
  const authContext = await requireAuth(di.headers, di);

  // Now authContext.userId, authContext.role available
  return await this.useCase.execute({ ...input, authContext });
}
```

#### New (GraphQL Resolvers)

```typescript
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../utils/auth-helpers";

// Traditional async (backward compatible)
const authContext = await requireAuth(context);

// Effect-based (recommended for new code)
const program = Effect.gen(function* () {
  const authContext = yield* requireAuthEffect(context);
  // ... use authContext
});
```

---

## Error Handling Changes

### Error Format Comparison

#### Old (TRPCError)

```typescript
import { TRPCError } from "@trpc/server";

throw new TRPCError({
  code: "NOT_FOUND",
  message: "User not found",
});

throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "Authentication required",
});

throw new TRPCError({
  code: "FORBIDDEN",
  message: "Admin access required",
});
```

Client receives:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

#### New (GraphQLError)

```typescript
import { GraphQLError } from "graphql";

throw new GraphQLError("User not found", {
  extensions: { code: "NOT_FOUND" },
});

throw new GraphQLError("Authentication required", {
  extensions: { code: "UNAUTHENTICATED" },
});

throw new GraphQLError("Admin access required", {
  extensions: { code: "FORBIDDEN" },
});
```

Client receives:

```json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

### Error Mapping Utilities

#### Old (Manual TRPCError Creation)

```typescript
// Convert domain errors to TRPCError manually
function handleResult<T>(result: Result<T, Error>): T {
  if (result.kind === "err") {
    const code = mapErrorCode(result.error);
    throw new TRPCError({ code, message: result.error.message });
  }
  return result.value;
}
```

#### New (Utility Functions)

```typescript
// apps/backend-server/src/graphql/utils/error-mapper.ts
import {
  mapErrorToGraphQL,
  handleControllerResult,
  throwNotFound,
} from "../utils/error-mapper";

// Map any error to GraphQLError
throw mapErrorToGraphQL(new Error("Something failed"));

// Handle controller result (returns data or throws)
const data = handleControllerResult(await controller.getById({ id }));

// Specific error helpers
throwNotFound("User");
throwUnauthenticated();
throwForbidden("Admin access required");
throwBadInput("Invalid email format");
```

### Error Code Mapping

| tRPC Error Code         | GraphQL Extension Code  | Meaning                  |
| ----------------------- | ----------------------- | ------------------------ |
| `BAD_REQUEST`           | `BAD_USER_INPUT`        | Invalid input            |
| `UNAUTHORIZED`          | `UNAUTHENTICATED`       | Not logged in            |
| `FORBIDDEN`             | `FORBIDDEN`             | Insufficient permissions |
| `NOT_FOUND`             | `NOT_FOUND`             | Resource not found       |
| `CONFLICT`              | `CONFLICT`              | Resource conflict        |
| `INTERNAL_SERVER_ERROR` | `INTERNAL_SERVER_ERROR` | Server error             |
| `TIMEOUT`               | (use message)           | Operation timeout        |
| `PARSE_ERROR`           | `BAD_USER_INPUT`        | Parse error              |

---

## Client-Side Migration

### Client Setup

#### Old (tRPC Client)

```typescript
// apps/web/src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { AppRouter } from "@mirai-app/backend-server";

export const trpc = createTRPCReact<AppRouter>();

// Provider setup
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/trpc",
      headers: () => ({
        Authorization: `Bearer ${getToken()}`,
      }),
    }),
  ],
});

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = trpc.user.getById.useQuery({ id: userId });

  if (isLoading) return <p>Loading...</p>;
  return <div>{data?.fullName}</div>;
}
```

#### New (urql Client)

```typescript
// apps/web/src/lib/urql.ts
import { createClient, cacheExchange, fetchExchange } from "urql";

export const client = createClient({
  url: "/graphql",
  fetchOptions: () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  }),
});

// Provider setup is automatic with generated hooks
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Usage in component with generated hooks
import { useGetUserQuery } from "@mirai-app/graphql-client";

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = useGetUserQuery(
    client,
    { id: userId },
    { enabled: !!userId }
  );

  if (isLoading) return <p>Loading...</p>;
  return <div>{data?.user?.fullName}</div>;
}
```

### Query Hooks

#### Old (tRPC)

```typescript
// Automatic hook generation from router
const { data, isLoading } = trpc.user.getById.useQuery(
  { id: userId },
  { enabled: !!userId },
);

const { data: users } = trpc.user.list.useQuery({ limit: 10, offset: 0 });
```

#### New (Generated urql Hooks)

```typescript
// Generated hooks from GraphQL operations
import {
  useGetUserQuery,
  useGetCurrentUserQuery,
  useGetTripsQuery,
} from "@mirai-app/graphql-client";

// Single item query
const { data, isLoading, error } = useGetUserQuery(
  client,
  { id: userId },
  { enabled: !!userId, staleTime: 60000 },
);

// Query without variables
const { data: me } = useGetCurrentUserQuery(client, undefined, {
  staleTime: 30000,
});

// Paginated query
const [pagination, setPagination] = useState({ limit: 10, offset: 0 });
const { data: trips } = useGetTripsQuery(
  client,
  { pagination },
  { placeholderData: (prev) => prev },
);
```

### Mutation Hooks

#### Old (tRPC)

```typescript
const utils = trpc.useContext();

const mutation = trpc.user.create.useMutation({
  onSuccess: () => {
    utils.user.list.invalidate();
  },
});

// Usage
mutation.mutate({ name: "John", email: "john@example.com" });
```

#### New (Generated urql Hooks)

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { useCreateTripMutation } from "@mirai-app/graphql-client";

const queryClient = useQueryClient();

const { mutate, isPending } = useCreateTripMutation(client, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["GetTrips"] });
  },
});

// Usage
mutate({ input: { name: "New Trip", startDate, endDate } });
```

### Cache Invalidation

#### Old (tRPC Utils)

```typescript
const utils = trpc.useContext();

// Invalidate specific query
utils.user.getById.invalidate({ id: userId });

// Invalidate all user queries
utils.user.invalidate();

// Refetch
utils.user.list.refetch();
```

#### New (TanStack Query)

```typescript
const queryClient = useQueryClient();

// Get query key from generated hook
const userQueryKey = useGetUserQuery.getKey({ id: userId });

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: userQueryKey });

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: ["GetUser"] });

// Refetch
queryClient.refetchQueries({ queryKey: userQueryKey });
```

### Subscriptions (WebSocket)

#### Old (tRPC WebSocket)

```typescript
// Limited subscription support in tRPC
const subscription = trpc.notification.onNew.useSubscription(undefined, {
  onData: (notification) => {
    console.log("New notification:", notification);
  },
});
```

#### New (GraphQL Subscriptions)

```typescript
import { useSubscription } from "urql";

const NEW_NOTIFICATION = `
  subscription OnNewNotification {
    newNotification {
      id
      title
      body
    }
  }
`;

function NotificationListener() {
  const handleSubscription = (notifications = [], response) => {
    return [...notifications, response.newNotification];
  };

  const [result] = useSubscription(
    { query: NEW_NOTIFICATION },
    handleSubscription
  );

  // result.data contains accumulated notifications
  return <NotificationList notifications={result.data || []} />;
}
```

---

## Testing Changes

### Resolver Testing

#### Old (tRPC Testing)

```typescript
// Testing tRPC routers
import { appRouter } from "../routers/_app";
import { createCallerFactory } from "@mirai-app/frameworks/trpc";

const createCaller = createCallerFactory(appRouter);

const caller = createCaller({
  container: mockContainer,
  headers: new Headers({ Authorization: "Bearer test-token" }),
});

// Test
const user = await caller.user.getById({ id: "123" });
expect(user.id).toBe("123");
```

#### New (GraphQL Resolver Testing)

```typescript
// Testing GraphQL resolvers
import { makeExecutableSchema } from "@graphql-tools/schema";
import { createYoga } from "graphql-yoga";
import { builder } from "../builder";

// Import all resolvers to register with builder
import "../resolvers/User";
import "../resolvers/Trip";

// Build schema
const schema = builder.toSchema();

// Create test context
const mockContext: GraphQLContext = {
  controllers: mockControllers,
  appLayer: mockLayer,
  request: new Request("http://localhost/graphql"),
  runtime: mockRuntime,
};

// Execute query
const result = await graphql({
  schema,
  source: `
    query {
      user(id: "123") {
        id
        fullName
      }
    }
  `,
  contextValue: mockContext,
});

expect(result.data?.user.id).toBe("123");
```

### Integration Testing

#### Old (tRPC Integration)

```typescript
// Integration test with full server
import { createTestServer } from "../test-utils";

const { client } = await createTestServer();

const user = await client.user.getById.query({ id: "123" });
expect(user).toBeDefined();
```

#### New (GraphQL Integration)

```typescript
// Integration test with full Yoga server
import { createTestYoga } from "../test-utils";

const yoga = await createTestYoga();

const response = await yoga.fetch("http://localhost/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          fullName
        }
      }
    `,
    variables: { id: "123" },
  }),
});

const result = await response.json();
expect(result.data.user.id).toBe("123");
```

### Mocking Strategies

#### Mock Controllers

```typescript
// Create mock controllers for testing
const mockUserController: Partial<UserController> = {
  getById: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: "123",
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
      role: "USER",
    },
  }),
};

const mockContext: Partial<GraphQLContext> = {
  controllers: {
    userController: mockUserController as UserController,
    // ... other controllers
  } as Controllers,
};
```

---

## Common Pitfalls

### 1. Auth Scope vs Manual Auth Check

**Pitfall**: Using both `authScopes` and manual `requireAuth()` check causes double validation.

**Wrong**:

```typescript
builder.queryField("user", (t) =>
  t.field({
    type: "User",
    authScopes: { authenticated: true }, // Checked here
    resolve: async (_root, args, context) => {
      await requireAuth(context); // Checked again!
      // ...
    },
  }),
);
```

**Right**:

```typescript
builder.queryField("user", (t) =>
  t.field({
    type: "User",
    authScopes: { authenticated: true }, // Only check here
    resolve: async (_root, args, context) => {
      // Use authContext directly if needed
      const userId = context.authContext?.userId;
      // ...
    },
  }),
);
```

### 2. Null vs Error for Not Found

**Pitfall**: Inconsistent handling of "not found" scenarios.

**Wrong**:

```typescript
resolve: async (_root, args, context) => {
  const result = await controller.getById({ id: args.id });
  if (!result.success) {
    throw new Error(result.error); // Throws generic error
  }
  return result.data;
};
```

**Right**:

```typescript
resolve: async (_root, args, context) => {
  const result = await controller.getById({ id: args.id });
  if (!result.success) {
    if (result.error.toLowerCase().includes("not found")) {
      return null; // Return null for "not found"
    }
    throw mapErrorToGraphQL(new Error(result.error)); // Map other errors
  }
  return result.data;
};
```

### 3. Missing Type Imports

**Pitfall**: Types must be imported to register with builder.

**Wrong**:

```typescript
// User.ts - tries to reference types not registered
builder.queryField("user", (t) =>
  t.field({
    type: "User", // Error: Type 'User' not found
    // ...
  }),
);
```

**Right**:

```typescript
// Import types for side effects (registers them)
import "../types/User";

// Now 'User' type is available
builder.queryField("user", (t) =>
  t.field({
    type: "User", // Works!
    // ...
  }),
);
```

### 4. WebSocket Cookie Configuration

**Pitfall**: WebSocket connection doesn't send cookies by default.

**Wrong**:

```typescript
const wsClient = createWSClient({
  url: "wss://api.mirai.com/graphql",
  // Missing cookie handling
});
```

**Right**:

```typescript
// Cookie is sent automatically with WebSocket upgrade
// Ensure server is configured to read cookie:
const token = extractTokenFromCookie(context.request.headers.get("cookie"));
```

### 5. Error Extensions Missing

**Pitfall**: Errors without `extensions.code` break client error handling.

**Wrong**:

```typescript
throw new Error("User not found"); // Client can't determine error type
```

**Right**:

```typescript
throw mapErrorToGraphQL(new Error("User not found"));
// Or explicitly:
throw new GraphQLError("User not found", {
  extensions: { code: "NOT_FOUND" },
});
```

### 6. Controller Result Handling

**Pitfall**: Not handling controller error results properly.

**Wrong**:

```typescript
resolve: async (_root, args, context) => {
  const result = await controller.getById({ id: args.id });
  return result.data; // May be undefined!
};
```

**Right**:

```typescript
resolve: async (_root, args, context) => {
  const result = await controller.getById({ id: args.id });
  return handleControllerResult(result); // Throws on error
};
```

---

## Quick Reference

### Side-by-Side Code Comparisons

#### Query with Pagination

**GraphQL Pattern**:

```typescript
builder.queryField("trips", (t) =>
  t.field({
    type: "TripListResult",
    args: {
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    authScopes: { public: true },
    resolve: async (_root, args, context) => {
      const controller = context.controllers.tripController;
      return handleControllerResult(
        await controller.list({ limit: args.limit, offset: args.offset }),
      );
    },
  }),
);
```

#### Mutation with Input Type

**New (GraphQL)**:

```typescript
// Define input type
const CreateUserInput = builder.inputType("CreateUserInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    email: t.string({ required: true }),
  }),
});

// Define mutation
builder.mutationField("createUser", (t) =>
  t.field({
    type: "UserCreateResult",
    authScopes: { authenticated: true },
    args: {
      input: t.arg({ type: CreateUserInput, required: true }),
    },
    resolve: async (_root, args, context) => {
      const controller = context.controllers.userController;
      return handleControllerResult(await controller.create(args.input));
    },
  }),
);
```

#### Field with Authorization

**GraphQL Pattern**:

```typescript
builder.queryField("adminData", (t) =>
  t.field({
    type: "AdminData",
    authScopes: { admin: true }, // Declarative auth
    resolve: async (_root, _args, context) => {
      await requireAdmin(context); // Manual check if needed
      // Return admin data
    },
  }),
);
```

#### Nested Field Resolver

**Old (tRPC)**:

```typescript
// Not supported - had to flatten structure
// or make multiple procedure calls
```

**New (GraphQL)**:

```typescript
builder.objectType("Trip", {
  fields: (t) => ({
    id: t.exposeID("id"),
    // Nested resolver with N+1 protection via DataLoader
    groups: t.field({
      type: ["Group"],
      resolve: async (trip, _args, context) => {
        const controller = context.controllers.groupController;
        const result = await controller.getByTripId({ tripId: trip.id });
        return handleControllerResult(result);
      },
    }),
  }),
});
```

### File Structure Comparison

| tRPC (Old)              | GraphQL (New)           | Purpose              |
| ----------------------- | ----------------------- | -------------------- |
| `routers/_app.ts`       | `builder.ts`            | Schema builder setup |
| `routers/userRouter.ts` | `resolvers/User.ts`     | Domain resolvers     |
| `schemas/userSchema.ts` | `types/User.ts`         | Type definitions     |
| `context.ts`            | `context.ts`            | Context factory      |
| `trpc.ts`               | `utils/auth-helpers.ts` | Auth utilities       |
| `errorHandler.ts`       | `utils/error-mapper.ts` | Error mapping        |

### Common Import Paths

```typescript
// Server-side imports
import { builder } from "../builder";
import { requireAuth, requireAdmin } from "../utils/auth-helpers";
import {
  mapErrorToGraphQL,
  handleControllerResult,
} from "../utils/error-mapper";

// Client-side imports
import {
  useGetUserQuery,
  useGetCurrentUserQuery,
  useCreateTripMutation,
} from "@mirai-app/graphql-client";
```

### Environment Variables

| Variable       | Old                        | New                           |
| -------------- | -------------------------- | ----------------------------- |
| `API_ENDPOINT` | `/trpc`                    | `/graphql`                    |
| `WS_ENDPOINT`  | `wss://api.mirai.com/trpc` | `wss://api.mirai.com/graphql` |

---

## Troubleshooting

### Schema Not Building

**Symptom**: `Type 'X' not found` errors when building schema.

**Solution**: Ensure all type files are imported before building:

```typescript
// In schema entry point
import "./types/User";
import "./types/Trip";
import "./types/Group";
// ... all type files

const schema = builder.toSchema();
```

### Auth Scope Not Working

**Symptom**: `authScopes` not being checked.

**Solution**: Verify `ScopeAuthPlugin` is registered:

```typescript
export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [ScopeAuthPlugin /* other plugins */],
  scopeAuth: {
    authScopes: async (context) => ({
      public: true,
      authenticated: !!context.authContext,
      admin: context.authContext?.role === "ADMIN",
    }),
  },
});
```

### Generated Hooks Out of Date

**Symptom**: Type errors with generated hooks.

**Solution**: Regenerate hooks after schema changes:

```bash
cd packages/graphql-client
bun run generate
```

### WebSocket Connection Failing

**Symptom**: WebSocket connection rejected.

**Solution**: Check cookie configuration:

1. Ensure http-only cookie is being set on login
2. Verify `credentials: "include"` in fetch options
3. Check CORS settings allow credentials

### Controller Not Found

**Symptom**: `Cannot read property 'xController' of undefined`

**Solution**: Ensure context factory creates controllers:

```typescript
export function createContextFactory() {
  return async (honoContext: HonoContext): Promise<GraphQLContext> => {
    // ... setup layer
    const controllers = createControllers({ appLayer, supabase });

    return {
      controllers, // Must be included!
      appLayer,
      request: honoContext.req.raw,
      runtime: createGraphQLRuntime(),
    };
  };
}
```

---

## Additional Resources

- [Pothos Documentation](https://pothos-graphql.dev/)
- [GraphQL Spec](https://spec.graphql.org/)
- [urql Documentation](https://formidable.com/open-source/urql/docs/)
- [Effect Documentation](https://effect.website/)
- [CLAUDE.md §10: Effect Framework Patterns](../CLAUDE.md)
- [apps/web/src/docs/graphql-usage.md](../apps/web/src/docs/graphql-usage.md)

---

**Last Updated**: 2026-04-15  
**Version**: 1.0.0 (Initial Migration Guide)
