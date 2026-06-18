# @mirai-app/orpc

Shared oRPC package containing both server-side routers and client-side utilities for the MIRAI app monorepo.

## What's Inside

This package provides:

1. **Server-side oRPC routers** (`src/api/`) - Business logic and database operations
2. **Client-side utilities** (`src/client/`) - React hooks and providers for consuming the API

## Installation

### For Server-Side Usage

```bash
# Already included if using the workspace
bun add @mirai-app/orpc
```

### For Client-Side Usage (React/React Native)

Install peer dependencies:

```bash
bun add @tanstack/react-query @orpc/client @orpc/tanstack-query
```

## Usage

### Server-Side

```typescript
import { appRouter, createCaller, createRequestContext } from "@mirai-app/orpc";

// In API route
export const POST = async (req: Request) => {
  const context = await createRequestContext({
    headers: req.headers,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });
  const caller = createCaller(context);
  
  // Call procedures server-side
  const users = await caller.user.getAll();
  
  return Response.json(users);
};
```

### Client-Side (React Native with Expo)

```tsx
import { QueryProvider } from "@mirai-app/orpc/client";
import Constants from "expo-constants";

const httpUrl = Constants.expoConfig?.extra?.apiUrl || "https://your-api.com";
const wsUrl = Constants.expoConfig?.extra?.wsUrl || "wss://your-api.com";

export default function App() {
  return (
    <QueryProvider httpUrl={httpUrl} wsUrl={wsUrl}>
      <MyApp />
    </QueryProvider>
  );
}
```

Then in components:

```tsx
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";

function MyComponent() {
  const { data, isLoading } = useQuery(orpc.user.getMy.queryOptions());
  
  if (isLoading) return <Text>Loading...</Text>;
  return <Text>Hello, {data?.name}!</Text>;
}
```

## Package Structure

```
packages/orpc/
├── src/
│   ├── api/              # Server-side routers
│   │   ├── orpc.ts       # oRPC initialization and procedures
│   │   ├── root.ts       # Main router combining all sub-routers
│   │   └── routers/      # Individual feature routers
│   ├── client/           # Client-side utilities
│   │   ├── index.ts      # Client exports
│   │   ├── query-client.tsx  # React Query configuration
│   │   ├── vanilia.ts    # Vanilla JS client utilities
│   │   └── query/        # Query-specific utilities
│   ├── services/         # Business logic services
│   ├── utils/            # Shared utilities
│   └── index.ts          # Main package exports
├── package.json
└── README.md             # This file
```

## Exports

This package provides multiple export paths:

### Main Export (`@mirai-app/orpc`)

Server-side utilities and type definitions:

```typescript
import { 
  appRouter,
  createCaller,
  createRequestContext,
  createORPCRouter,
  publicProcedure,
  protectedProcedure,
  type AppRouter
} from "@mirai-app/orpc";
```

### Client Export (`@mirai-app/orpc/client`)

Client-side React utilities:

```typescript
import {
  orpc,
  getORPCClient,
  QueryProvider,
  queryClient,
} from "@mirai-app/orpc/client";
```

### Server Export (`@mirai-app/orpc/server`)

Server-only utilities:

```typescript
import { createContext } from "@mirai-app/orpc/server";
```

## Available Routers

The API includes the following routers:

- **`activityFeed`** - Activity feed operations
- **`challenge`** - Challenge management operations
- **`challengeSubmission`** - Challenge submission operations
- **`challengeVote`** - Challenge voting operations
- **`coin`** - Coin management operations
- **`coinTransaction`** - Coin transaction operations
- **`group`** - Group management operations
- **`location`** - Location management operations
- **`notificationSchedule`** - Notification scheduling operations
- **`notifications`** - Notification operations
- **`reward`** - Reward management operations
- **`sponsor`** - Sponsor management operations
- **`storage`** - File storage operations
- **`trip`** - Trip management operations
- **`user`** - User management operations

### Service Router (`@mirai-app/orpc`)

Internal service-to-service routers (not exposed to clients):

- **`notificationDelivery`** - Notification delivery operations
- **`notificationSender`** - Notification sender operations

These routers are available via the dedicated `/internal/orpc` endpoint and require `serviceAccountProcedure` authentication.

## Type Safety

Full end-to-end type safety from server to client:

```typescript
// Server defines the type
export const userRouter = createORPCRouter({
  getMy: protectedProcedure.handler(async ({ context }) => {
    return await context.db.user.findUnique({
      where: { id: context.session.user.id }
    });
  })
});

// Client gets automatic types
const { data } = useQuery(orpc.user.getMy.queryOptions());
//     ^? data: User | undefined (fully typed!)
```

## Procedures

The package provides several procedure types with different authorization levels:

- **`publicProcedure`** - No authentication required
- **`protectedProcedure`** - Requires authenticated user
- **`moderatorProcedure`** - Requires moderator role
- **`adminProcedure`** - Requires admin role
- **`serviceAccountProcedure`** - For service-to-service communication

## Development

### Run Tests

```bash
bun run test
```

### Watch Mode

```bash
bun run test:watch
```

### Type Check

```bash
bun run typecheck
```

## Dependencies

### Runtime Dependencies
- `@mirai-app/auth` - Authentication utilities
- `@mirai-app/db` - Database client
- `@mirai-app/supabase` - Supabase client
- `@orpc/server` - oRPC server
- `zod` - Schema validation

### Peer Dependencies (Client)
- `@tanstack/react-query` - Data fetching for React
- `@orpc/client` - oRPC client
- `@orpc/tanstack-query` - oRPC React Query integration
- `react` - React library

## Contributing

When adding new routers or procedures:

1. Create router in `src/api/routers/`
2. Add to `src/api/root.ts`
3. Export types if needed
4. Add tests in appropriate test directories
