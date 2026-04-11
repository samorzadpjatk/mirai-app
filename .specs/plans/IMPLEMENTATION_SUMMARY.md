# TanStack Query + GraphQL Code Generator - Implementation Summary

## What Was Built

A shared GraphQL types package (`@mirai-app/graphql-client`) that generates type-safe React Query hooks from the backend GraphQL schema. Both frontend apps (web and native) can now consume these hooks with full TypeScript support.

## Architecture

```
apps/backend-server (Pothos schema)
    ↓ bun run generate:sdl
packages/graphql-types/
    ├── src/graphql/schema.graphql      # 4,247 lines of SDL
    ├── src/graphql/operations/*.graphql # Hand-written operations
    └── src/generated/graphql.ts         # Generated types & hooks (4,174 lines)
    ↓ workspace import
apps/web & apps/native
    └── Use generated hooks with TanStack Query
```

## Files Created

### Core Package (`packages/graphql-types/`)

- `package.json` - Package configuration with codegen dependencies
- `tsconfig.json` - TypeScript configuration
- `codegen.ts` - GraphQL Code Generator configuration
- `src/index.ts` - Public exports
- `src/graphql/schema.graphql` - Exported backend schema (4,247 lines)
- `src/graphql/operations/user.queries.graphql` - User queries
- `src/graphql/operations/trip.queries.graphql` - Trip queries
- `src/graphql/operations/mutations.graphql` - Create/Update/Delete mutations
- `src/generated/graphql.ts` - Generated types & React Query hooks (4,174 lines)

### Tests

- `__tests__/generated-types.test.ts` - 35 tests for type compilation
- `__tests__/hook-integration.test.ts` - React Query hook tests

### Documentation & Examples (`apps/web/`)

- `src/components/QueryProvider.tsx` - TanStack Query provider setup
- `src/components/examples/GraphQLExample.tsx` - Comprehensive usage examples
- `src/docs/graphql-usage.md` - Full usage documentation

### Updated Configurations

- `apps/backend-server/src/graphql/schema.ts` - Fixed schema export path
- `apps/web/package.json` - Added workspace dependency & graphql-request
- `apps/native/package.json` - Added workspace dependency & graphql-request

## Generated Hooks Available

All apps can now import these typed hooks:

```typescript
import {
  useGetUserQuery,
  useGetCurrentUserQuery,
  useGetTripQuery,
  useGetTripsQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
} from "@mirai-app/graphql-client";
```

## Usage Example

```typescript
import { useGetUserQuery } from '@mirai-app/graphql-client';
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('/graphql');

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useGetUserQuery(
    client,
    { id: userId },
    { staleTime: 60000 }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.user.fullName}</div>;
}
```

## Development Workflow

1. **Backend changes:** Update Pothos types in `apps/backend-server`
2. **Export schema:** `cd apps/backend-server && bun run generate:sdl`
3. **Add operations:** Create `.graphql` files in `packages/graphql-types/src/graphql/operations/`
4. **Generate types:** `cd packages/graphql-types && bun run generate`
5. **Frontend usage:** Import hooks from `@mirai-app/graphql-client`

## Test Results

```
bun test v1.3.12
35 pass
0 fail
70 expect() calls
Ran 35 tests across 2 files. [88.00ms]
```

## Next Steps

1. **Run the backend** to serve the GraphQL API: `cd apps/backend-server && bun run dev`
2. **Regenerate types** when schema changes: `cd packages/graphql-types && bun run generate`
3. **Add more operations** as needed for new features
4. **Use in native app** - Same import pattern works in `apps/native`

## Commands Reference

```bash
# Generate types from schema
bun run generate

# Watch mode for development
bun run generate:watch

# Build package
bun run build

# Run tests
bun test

# Export schema from backend
cd apps/backend-server && bun run generate:sdl
```
