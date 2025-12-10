# @integral-2025-app/trpc

Shared tRPC package containing both server-side routers and client-side utilities for the Integral 2025 App monorepo.

## What's Inside

This package provides:

1. **Server-side tRPC routers** (`src/api/`) - Business logic and database operations
2. **Client-side utilities** (`src/client/`) - React hooks and providers for consuming the API

## Installation

### For Server-Side Usage (Next.js API routes)

```bash
# Already included if using the workspace
pnpm add @integral-2025-app/trpc
```

### For Client-Side Usage (React/React Native)

Install peer dependencies:

```bash
pnpm add @tanstack/react-query @trpc/client @trpc/react-query
```

## Usage

### Server-Side (Next.js API Routes)

```typescript
import { appRouter, createCaller, createTRPCContext } from "@integral-2025-app/trpc";

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
import { TRPCProvider } from "@integral-2025-app/trpc/client";
import { createExpoTRPCClient } from "@integral-2025-app/trpc/client/expo";
import Constants from "expo-constants";

export default function App() {
  return (
    <TRPCProvider client={createExpoTRPCClient({ expoConfig: Constants.expoConfig })}>
      <MyApp />
    </TRPCProvider>
  );
}
```

Then in components:

```tsx
import { api } from "@integral-2025-app/trpc/client";

function MyComponent() {
  const { data, isLoading } = api.user.getMy.useQuery();
  
  if (isLoading) return <Text>Loading...</Text>;
  return <Text>Hello, {data?.name}!</Text>;
}
```

### Client-Side (Next.js or other React apps)

```tsx
import { TRPCProvider } from "@integral-2025-app/trpc/client";

export default function RootLayout({ children }) {
  return (
    <TRPCProvider
      client={{
        baseUrl: "http://localhost:3000",
        source: "nextjs-app"
      }}
    >
      {children}
    </TRPCProvider>
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
│   │       ├── user.ts
│   │       ├── group.ts
│   │       ├── coin.ts
│   │       └── ...
│   ├── client/           # Client-side utilities
│   │   ├── react.ts      # Base React hooks
│   │   ├── query-client.ts  # React Query configuration
│   │   ├── provider.tsx  # Provider component
│   │   ├── expo.ts       # Expo-specific utilities
│   │   ├── index.ts      # Client exports
│   │   └── README.md     # Client documentation
│   ├── services/         # Business logic services
│   ├── utils/            # Shared utilities
│   └── index.ts          # Main package exports
├── package.json
└── MIGRATION.md          # Migration guide
```

## Exports

This package provides multiple export paths:

### Main Export (`@integral-2025-app/trpc`)

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
} from "@integral-2025-app/trpc";
```

### Client Export (`@integral-2025-app/trpc/client`)

Client-side React utilities:

```typescript
import {
  api,
  TRPCProvider,
  createTRPCClient,
  createQueryClient,
  type TRPCClientConfig,
  type QueryClientConfig
} from "@integral-2025-app/trpc/client";
```

### Expo Export (`@integral-2025-app/trpc/client/expo`)

Expo-specific utilities:

```typescript
import {
  getExpoBaseUrl,
  createExpoTRPCClient,
  type ExpoTRPCClientOptions
} from "@integral-2025-app/trpc/client/expo";
```

## Available Routers

The API includes the following routers:

- **`user`** - User management operations
- **`group`** - Group management operations
- **`coin`** - Coin management operations
- **`coinTransaction`** - Coin transaction operations
- **`notifications`** - Notification operations
- **`notificationSchedule`** - Notification scheduling operations

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
pnpm test
```

### Watch Mode

```bash
pnpm test:watch
```

### Type Check

```bash
pnpm typecheck
```

## Documentation

- **`MIGRATION.md`** - Guide for migrating to shared client package
- **`src/client/README.md`** - Detailed client API documentation

## Dependencies

### Runtime Dependencies
- `@integral-2025-app/auth` - Authentication utilities
- `@integral-2025-app/db` - Database client
- `@integral-2025-app/supabase` - Supabase client
- `@trpc/server` - tRPC server
- `superjson` - Data serialization
- `web-push` - Push notifications
- `zod` - Schema validation

### Peer Dependencies (Client)
- `@tanstack/react-query` - Data fetching for React
- `@trpc/client` - tRPC client
- `@trpc/react-query` - tRPC React Query integration
- `react` - React library

## Contributing

When adding new routers or procedures:

1. Create router in `src/api/routers/`
2. Add to `src/api/root.ts`
3. Export types if needed
4. Add tests in `src/api/__tests__/`

## License

ISC
