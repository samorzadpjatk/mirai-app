# GraphQL Client Package

TypeScript type definitions and React Query hooks generated from GraphQL schema and operations for the Mirai App.

## Installation

```bash
bun add @mirai-app/graphql-client
```

## Usage

Generate types from GraphQL schema and operation files:

```bash
bun run generate
```

Watch for changes and regenerate automatically:

```bash
bun run generate:watch
```

## Structure

- `src/generated/graphql/schema.graphql` - GraphQL schema definition (auto-generated from backend)
- `src/generated/graphql/operations/` - GraphQL query/mutation files
- `src/generated/graphql/fragments/` - Reusable GraphQL fragments
- `src/generated/graphql/subscriptions/` - GraphQL subscription files
- `src/generated/urql.ts` - Auto-generated TypeScript types and urql hooks

## Important: Auto-Generated Files

> **⚠️ WARNING:** Files in `src/generated/graphql/` are **auto-generated**.
> **Do NOT edit these files directly!**

### How to Update GraphQL Files

The GraphQL schema and operations are maintained in the backend server:

1. **Schema source location:** `apps/backend-server/src/graphql/`
   - Pothos type definitions: `src/graphql/types/*.ts`
   - Resolvers: `src/graphql/resolvers/*.ts`

2. **To update the schema:**

   ```bash
   cd apps/backend-server
   bun run generate:sdl
   ```

   This generates `packages/graphql-client/src/generated/graphql/schema.graphql`

3. **To regenerate client hooks:**
   ```bash
   cd packages/graphql-client
   bun run generate
   ```
   This regenerates `src/generated/urql.ts` from the schema and operations

### Adding New GraphQL Operations

If you need to add new queries, mutations, or fragments:

1. Add your GraphQL operation to the appropriate file in `src/generated/graphql/operations/`:

   ```graphql
   # Example: src/generated/graphql/operations/my-feature.queries.graphql

   query GetMyFeatures($filter: MyFeatureFilterInput) {
     myFeatures(filter: $filter) {
       id
       name
     }
   }
   ```

2. Regenerate the hooks:

   ```bash
   bun run generate
   ```

3. Import and use in your application:
   ```typescript
   import { useGetMyFeaturesQuery } from "@mirai-app/graphql-client";
   ```

## Codegen Configuration

The `codegen.ts` file configures GraphQL Code Generator:

```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/generated/graphql/schema.graphql",
  documents: "src/generated/graphql/**/*.graphql",
  generates: {
    "src/generated/urql.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-urql"],
      config: {
        withSubscription: true,
      },
    },
  },
};

export default config;
```

## Building

```bash
bun run build
```
