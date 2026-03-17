# @mirai-app/trpc

Shared tRPC package containing both server-side routers and client-side utilities for the MIRAI app monorepo.

## What's Inside

This package provides:

1. **Server-side tRPC routers** (`src/api/`) - Business logic and database operations
2. **Client-side utilities** (`src/client/`) - React hooks and providers for consuming the API

## Installation

### For Server-Side Usage (Next.js API routes)

```bash
# Already included if using the workspace
bun add @mirai-app/trpc
```

### For Client-Side Usage (React/React Native)

Install peer dependencies:

```bash
bun add @tanstack/react-query @trpc/client @trpc/tanstack-react-query
```

## Usage

### Server-Side (Next.js API Routes)

```typescript
import { appRouter, createCaller, createTRPCContext } from "@mirai-app/trpc";

// In API route
export const POST = async (req: Request) => {
  const context = await createTRPCContext({
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
import { APIProvider } from "@mirai-app/trpc/client";
import Constants from "expo-constants";

const httpUrl = Constants.expoConfig?.extra?.apiUrl || "https://your-api.com";
const wsUrl = Constants.expoConfig?.extra?.wsUrl || "wss://your-api.com";

export default function App() {
  return (
    <APIProvider httpUrl={httpUrl} wsUrl={wsUrl}>
      <MyApp />
    </APIProvider>
  );
}
```

Then in components:

```tsx
import { useTRPC } from "@mirai-app/trpc/client";

function MyComponent() {
  const trpc = useTRPC();
  const { data, isLoading } = trpc.user.getMy.useQuery();
  
  if (isLoading) return <Text>Loading...</Text>;
  return <Text>Hello, {data?.name}!</Text>;
}
```

### Client-Side (Next.js or other React apps)

```tsx
import { APIProvider } from "@mirai-app/trpc/client";

export default function RootLayout({ children }) {
  return (
    <APIProvider 
      httpUrl="http://localhost:3000" 
      wsUrl="ws://localhost:3000"
    >
      {children}
    </APIProvider>
  );
}
```

## Package Structure

```
packages/trpc/
├── src/
│   ├── api/              # Server-side routers
│   │   ├── trpc.ts       # tRPC initialization and procedures
│   │   ├── root.ts       # Main router combining all sub-routers
│   │   └── routers/      # Individual feature routers
│   │       ├── activityFeed.ts
│   │       ├── challenge.ts
│   │       ├── challengeSubmission.ts
│   │       ├── challengeVote.ts
│   │       ├── coin.ts
│   │       ├── coinTransaction.ts
│   │       ├── group.ts
│   │       ├── location.ts
│   │       ├── notificationDelivery.ts
│   │       ├── notificationSchedule.ts
│   │       ├── notificationSender.ts
│   │       ├── notifications.ts
│   │       ├── reward.ts
│   │       ├── sponsor.ts
│   │       ├── storage.ts
│   │       ├── submissionReport.ts
│   │       ├── trip.ts
│   │       └── user.ts
│   ├── client/           # Client-side utilities
│   │   ├── react.ts      # Base React hooks
│   │   ├── query-client.tsx  # React Query configuration
│   │   ├── invalidationUtils.ts  # Query invalidation utilities
│   │   ├── vanilia.ts    # Vanilla JS client utilities
│   │   ├── query/        # Query-specific utilities
│   │   │   └── index.ts
│   │   └── index.ts      # Client exports
│   ├── services/         # Business logic services
│   ├── utils/            # Shared utilities
│   └── index.ts          # Main package exports
├── package.json
└── README.md             # This file
```

## Exports

This package provides multiple export paths:

### Main Export (`@mirai-app/trpc`)

Server-side utilities and type definitions:

```typescript
import { 
  appRouter,
  createCaller,
  createTRPCContext,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
  type AppRouter
} from "@mirai-app/trpc";
```

### Client Export (`@mirai-app/trpc/client`)

Client-side React utilities:

```typescript
import {
  useTRPC,
  useTRPCClient,
  APIProvider,
  useSubscription,
  getTRPCClient,
  TRPCContext
} from "@mirai-app/trpc/client";
```

The client export also includes query invalidation utilities that are re-exported from the query module.

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
- **`notificationDelivery`** - Notification delivery operations
- **`notificationSchedule`** - Notification scheduling operations
- **`notificationSender`** - Notification sender operations
- **`notifications`** - Notification operations
- **`reward`** - Reward management operations
- **`sponsor`** - Sponsor management operations
- **`storage`** - File storage operations
- **`submissionReport`** - Submission reporting operations
- **`trip`** - Trip management operations
- **`user`** - User management operations

## Type Safety

Full end-to-end type safety from server to client:

```typescript
// Server defines the type
export const userRouter = createTRPCRouter({
  getMy: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id }
    });
  })
});

// Client gets automatic types
const { data } = api.user.getMy.useQuery();
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

## Documentation

- **`src/client/query/`** - Query invalidation utilities documentation
- **Package README** - This file

## Dependencies

### Runtime Dependencies
- `@mirai-app/auth` - Authentication utilities
- `@mirai-app/db` - Database client
- `@mirai-app/supabase` - Supabase client
- `@trpc/server` - tRPC server
- `superjson` - Data serialization
- `web-push` - Push notifications
- `zod` - Schema validation

### Peer Dependencies (Client)
- `@tanstack/react-query` - Data fetching for React
- `@trpc/client` - tRPC client
- `@trpc/tanstack-react-query` - tRPC React Query integration
- `react` - React library

## Contributing

When adding new routers or procedures:

1. Create router in `src/api/routers/`
2. Add to `src/api/root.ts`
3. Export types if needed
4. Add tests in appropriate test directories
