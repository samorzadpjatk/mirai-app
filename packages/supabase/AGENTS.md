# @mirai-app/supabase - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Supabase client configuration for the MIRAI application. Provides typed Supabase client instances for both server and client-side usage.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | Supabase client factory |
| `react` | `./src/react.tsx` | React integration |
| `types` | `./src/types.ts` | Database types |

## Tech Stack

- **Client**: @supabase/supabase-js
- **Version**: ^2.89.0
- **Dependencies**: None (internal)

## Key Files

```
packages/supabase/
├── src/
│   ├── index.ts          # Client factory
│   ├── react.tsx         # React provider/hooks
│   ├── types.ts          # Database types
│   └── client.ts         # Client implementation
├── package.json
└── AGENTS.md             # This file
```

## Development Commands

```bash
# Build package
bun run build

# TypeScript check
bun run typecheck

# Lint
bun run lint

# Test
bun run test
```

## Dependencies

### External

- `@supabase/supabase-js` - Supabase JavaScript client

### Peer Dependencies

- `react` ^19.1.0

## Usage in Apps

### Server-Side

```typescript
import { createClient } from '@mirai-app/supabase';

const supabase = createClient();
const { data, error } = await supabase
  .from('users')
  .select('*');
```

### Client-Side (React)

```typescript
import { SupabaseProvider, useSupabase } from '@mirai-app/supabase/react';

// Wrap app with provider
function App() {
  return (
    <SupabaseProvider>
      <MyApp />
    </SupabaseProvider>
  );
}

// Use in components
function MyComponent() {
  const supabase = useSupabase();
  // ...
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |

## Links

- [Client documentation](../../docs/packages/supabase/client.md)
- [Root AGENTS.md](../../AGENTS.md)
