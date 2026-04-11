# TanStack Query + GraphQL Code Generator Integration

## Purpose

Generate type-safe GraphQL operations for all frontend apps from the backend schema. Both `apps/web` and `apps/native` import types and hooks from a shared package.

## Architecture

**Dependency Flow:**

```
backend-server (Pothos schema)
    ↓ (introspection or SDL export)
packages/graphql-types (generates types + hooks)
    ↓ (workspace import)
apps/web & apps/native (consume typed TanStack Query hooks)
```

This follows Clean Architecture by isolating type definitions in a package with no backend implementation dependencies.

## Package Structure

```
packages/graphql-types/
├── package.json
├── tsconfig.json
├── codegen.ts                    # Codegen configuration
├── src/
│   ├── index.ts                  # Public exports
│   ├── graphql/
│   │   ├── schema.graphql        # Backend SDL
│   │   ├── operations/           # Hand-written .graphql files
│   │   │   ├── user.queries.graphql
│   │   │   ├── trip.queries.graphql
│   │   │   └── mutations.graphql
│   │   └── fragments/
│   │       └── common.graphql
│   └── generated/
│       └── graphql.ts            # Generated output (gitignored)
└── __tests__/
    └── generated-types.test.ts   # Type compilation tests
```

## Code Generator Configuration

**Plugins:**

- `@graphql-codegen/typescript` — Core TypeScript types
- `@graphql-codegen/typescript-operations` — Operation-specific types
- `@graphql-codegen/typescript-react-query` — TanStack Query hooks
- `@graphql-codegen/near-operation-file-preset` — File organization

**Key Settings:**

```typescript
// codegen.ts
const config: CodegenConfig = {
  schema: "../backend-server/schema.graphql",
  documents: "src/graphql/**/*.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        fetcher: "graphql-request", // Lightweight, no duplicate caching
        reactQueryVersion: 5,
        addInfiniteQuery: true,
        exposeQueryKeys: true,
      },
    },
  },
};
```

The `fetcher: 'graphql-request'` setting uses a lightweight fetcher. TanStack Query handles caching, deduplication, and state management.

## Frontend Integration

**1. Install Package**

```bash
# In both apps/web and apps/native
bun add @mirai-app/graphql-client
```

**2. Configure TanStack Query**

Both apps already have `@tanstack/react-query` installed. Configure the `QueryClient`:

```typescript
// Web app (apps/web/src/components/Providers.tsx)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

**3. Use Generated Hooks**

```typescript
import {
  useGetUserQuery,
  useCreateTripMutation,
} from "@mirai-app/graphql-client";

// In a component:
const { data, isLoading, error } = useGetUserQuery(
  { id: "user-123" },
  { staleTime: 10000 }, // TanStack Query options
);

const mutation = useCreateTripMutation();
mutation.mutate({ input: { name: "Trip to Tokyo" } });
```

The generated hooks wrap `useQuery` and `useMutation` with full type safety.

## Development Workflow

**Day-to-Day Steps:**

1. Backend developer modifies GraphQL types in `apps/backend-server`
2. Export schema: `cd apps/backend-server && bun run generate:sdl`
3. Write operations in `packages/graphql-types/src/graphql/operations/`
4. Generate types: `cd packages/graphql-types && bun run generate`
5. Frontend apps import typed hooks from the workspace package

**Automation Scripts:**

```json
{
  "scripts": {
    "generate": "graphql-codegen --config codegen.ts",
    "generate:watch": "graphql-codegen --watch"
  }
}
```

**Watch Mode:** Run `bun run generate:watch` during development for automatic regeneration.

## Testing Strategy

Test type compilation and hook integration:

```typescript
// packages/graphql-types/__tests__/generated-types.test.ts
import { describe, it, expect } from "bun:test";
import type {
  GetUserQuery,
  GetUserQueryVariables,
} from "../src/generated/graphql";

describe("[UNIT] GraphQL Types", () => {
  it("compiles GetUser query types", () => {
    const mockData: GetUserQuery = {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
    };

    expect(mockData.user.id).toBe("1");
  });
});
```

## Dependencies

**Install in `packages/graphql-types`:**

```bash
bun add -d @graphql-codegen/cli @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations \
  @graphql-codegen/typescript-react-query \
  @graphql-codegen/near-operation-file-preset graphql
```

**Runtime dependency (install in frontend apps):**

```bash
bun add graphql-request
```

## Alternative Approaches Considered

| Approach              | Description                            | Trade-off                          |
| --------------------- | -------------------------------------- | ---------------------------------- |
| **Minimal Setup**     | Generate types only, manual `useQuery` | More boilerplate, less type safety |
| **Persisted Queries** | Add query hashing for production       | Overkill for current stage         |
| **Per-App Codegen**   | Each app runs its own codegen          | Duplicated config, not DRY         |
| **tRPC**              | Replace GraphQL with tRPC              | Requires backend refactor          |

## Implementation Plan

1. Create `packages/graphql-types` package with codegen configuration
2. Export schema from `apps/backend-server` to shared location
3. Write initial operation files (user queries, trip queries)
4. Run initial codegen and verify types compile
5. Install `graphql-request` in both frontend apps
6. Configure TanStack Query providers
7. Write integration tests for frontend usage
8. Add pre-commit hook for automatic regeneration

---

**Last Updated:** 2026-04-10  
**Status:** Design validated, ready for implementation
