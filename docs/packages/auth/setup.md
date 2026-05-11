# Auth Package Setup

## Overview

The `@mirai-app/auth` package provides authentication utilities and state management for the MIRAI application.

## Architecture

### State Management

Uses a hybrid approach:

- **Zustand**: For global auth state (user, session)
- **Jotai**: For atomic derived state and computed values

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User Input │────▶│  Validation │────▶│  Supabase   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
┌─────────────┐     ┌─────────────┐            │
│  App State  │◀────│   Zustand   │◀───────────┘
└─────────────┘     └─────────────┘
```

## Key Exports

### Client-Side (`./src/index.ts`)

```typescript
// Auth hooks
export { useAuth } from './hooks/useAuth';
export { useUser } from './hooks/useUser';
export { useSession } from './hooks/useSession';

// Auth actions
export { signIn, signUp, signOut } from './actions';

// Auth state
export { useAuthStore } from './store';
```

### Server-Side (`./src/server.ts`)

```typescript
// Server auth helpers
export { createServerClient } from './server/client';
export { requireAuth } from './server/requireAuth';
export { getSession } from './server/session';
```

## Configuration

No additional configuration needed. The package uses environment variables from the consuming app:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Usage Patterns

### Protected Route (Native)

```typescript
import { useAuth } from '@mirai-app/auth';
import { Redirect } from 'expo-router';

function ProtectedScreen() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  if (!user) return <Redirect href="/sign-in" />;
  
  return <ActualScreen />;
}
```

### Server-Side Auth (oRPC)

```typescript
import { requireAuth } from '@mirai-app/auth/server';

export const protectedProcedure = publicProcedure
  .use(requireAuth);
```

## Testing

```bash
cd packages/auth
bun run test
```

## Troubleshooting

### "Supabase client not found"

Ensure the app has properly initialized Supabase client before using auth.

### Auth state not updating

Check that the auth store provider is at the root of your app.
