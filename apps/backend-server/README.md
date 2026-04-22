# @mirai-app/backend-server

Dedicated backend server for the MIRAI application, based on Fastify and tRPC.

## Running

```bash
# Development
bun run dev

# Tests
bun run test

# Tests with coverage
bun run test:coverage
```

## Configuration

The server requires the following environment variables:

```env
# Server port (default: 2022)
PORT=2022

# Supabase
SUPABASE_URL="http://localhost:8000"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Authorization

The backend server supports authorization via JWT tokens from Supabase.

### HTTP Requests

For HTTP requests, the token is passed in the `Authorization` header:

```typescript
headers: {
  Authorization: `Bearer ${accessToken}`
}
```

### WebSocket Connections

For WebSocket connections, the token is passed in `connectionParams`:

```typescript
createWSClient({
  url: 'ws://localhost:2022/trpc',
  connectionParams: {
    authToken: accessToken
  }
});
```

### Authorization Flow

1. **Client** (native application):
   - Gets `access_token` from Supabase session
   - Passes token in `connectionParams` (WebSocket) or `Authorization` header (HTTP)

2. **tRPC Context** (`packages/trpc/src/api/trpc.ts`):
   - Extracts token from headers or `connectionParams`
   - Creates Supabase client
   - Passes token to context

3. **Auth Middleware** (`packages/auth/src/authServer.ts`):
   - `protectedProcedure` calls `requireAuth(supabase, accessToken)`
   - `requireAuth` verifies token via `supabase.auth.getUser(accessToken)`
   - If token is invalid/missing → `AuthenticationError`
   - If token is valid → procedure continues with user data

### Missing Token

When client connects **without** a token:
- HTTP/WebSocket works normally for `publicProcedure`
- `protectedProcedure` throws `AuthenticationError("Unauthorized")`
- No `AuthSessionMissingError` errors in logs (fixed in `authServer.ts`)

### Dynamic Token Updates

In the native app, the token is automatically updated on session changes:

```typescript
// apps/native/src/app/_layout.tsx
supabaseClient.auth.onAuthStateChange((_event, session) => {
  const newToken = session?.access_token;
  setAuthToken(newToken);
});
```

Token changes cause tRPC client reconstruction with the new token in `connectionParams`.

## Architecture

```
┌─────────────────┐
│   Native App    │
│   (Expo/RN)     │
└────────┬────────┘
         │ authToken
         ↓
┌─────────────────┐     ┌──────────────┐
│   APIProvider   │────→│  WS Client   │
│  (tRPC Client)  │     │connectionParams
└────────┬────────┘     └──────┬───────┘
         │                     │
         │ HTTP: Bearer token  │ WS: authToken
         ↓                     ↓
┌─────────────────────────────────────┐
│      WebSocket Server (Fastify)     │
│         + tRPC + WebSocket          │
└──────────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│    tRPC Context (createTRPCContext)  │
│  - extracts token from headers/params│
│  - creates Supabase client           │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   protectedProcedure middleware      │
│   - requireAuth(supabase, token)     │
│   - verifies with Supabase Auth      │
└──────────────────────────────────────┘
```

## Endpoints

- `/health` - Health check endpoint
- `/trpc` - tRPC endpoint (HTTP + WebSocket)

## Testing

Tests are located in `src/__tests__/`:

```typescript
import { createServer } from "../server";

const server = createServer({
  dev: true,
  port: 3001,
  prefix: "/trpc",
});

await server.start();
// ... tests
await server.stop();
```

## Monorepo Structure

The server uses shared packages:

- `@mirai-app/trpc` - tRPC Router and procedures
- `@mirai-app/auth` - Authorization logic
- `@mirai-app/supabase` - Supabase client
- `@mirai-app/db` - Prisma client

## Troubleshooting

### AuthSessionMissingError

If you see `AuthSessionMissingError: Auth session missing!` in logs:

- **Cause**: Server tried to call `supabase.auth.getUser()` without a token
- **Solution**: Fix applied in `packages/auth/src/authServer.ts` - `getAuthServerUser` now returns `null` when no token, instead of calling Supabase Auth

### WebSocket Not Connecting

1. Check if server is running: `curl http://localhost:2022/health`
2. Check WebSocket URL in app (should start with `ws://` or `wss://`)
3. Check server logs for errors

### Token Not Being Passed

1. Check if Supabase session is active: `supabase.auth.getSession()`
2. Check if `authToken` is being passed to `APIProvider`
3. Check server logs - is token visible in context?
